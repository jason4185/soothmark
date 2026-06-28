"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CheckCircle2, ExternalLink, FileCode2, Globe, Info, RotateCcw, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import type { SoothmarkAudit } from "@/types/audit";
import { AuditProgressTimeline } from "@/components/audit/AuditProgressTimeline";
import { AuditResultSummary } from "@/components/audit/AuditResultSummary";
import { GradientButton } from "@/components/shared/GradientButton";
import { SectionShell } from "@/components/shared/SectionShell";
import { Button } from "@/components/ui/button";
import { soothmarkDebug, soothmarkTrace } from "@/lib/debug";
import { getExampleById } from "@/lib/mocks/examples";
import { getLastSoothmarkAuditResponseDebug, getLastSoothmarkSubmissionMeta, isSoothmarkRateLimitError, soothmarkClient } from "@/lib/soothmarkClient";
import { soothmarkContractConfig } from "@/lib/soothmarkContractConfig";
import { shortenAddress } from "@/lib/utils";
import { useWalletIdentity } from "@/lib/wallet/useWalletIdentity";

const progressStepCount = 4;
const reportPollTimeoutMs = 5 * 60 * 1000;
const rateLimitRetryDelayMs = 45_000;
const preSubmitCountTimeoutMs = 3_000;

type ActiveAuditStatus = "submitting" | "confirmed" | "polling" | "ready" | "timeout" | "error";

type ActiveAuditSubmission = {
  submissionId: string;
  preSubmitAuditCount: number;
  auditId?: string;
  walletAddress?: string;
  transactionHash?: string;
  explorerUrl?: string;
  status: ActiveAuditStatus;
  startedAt: number;
};

type ResolvedSubmittedAudit = {
  auditId: string;
  audit: SoothmarkAudit;
};

function createSubmissionId() {
  return `submission-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeWalletAddress(address: string | null | undefined) {
  return address?.toLowerCase() ?? "";
}

function auditErrorMessage(caughtError: unknown): string {
  if (caughtError instanceof Error) {
    const lowerMessage = caughtError.message.toLowerCase();
    if (lowerMessage.includes("connect your wallet")) {
      return "Connect your wallet before submitting an on-chain audit.";
    }
    if (lowerMessage.includes("rejected")) {
      return "Transaction was rejected in your wallet.";
    }
    if (lowerMessage.includes("audit id")) {
      return "Submission completed, but no audit ID was returned.";
    }
    if (lowerMessage.includes("parse") || lowerMessage.includes("json")) {
      return "Audit report was returned, but could not be parsed.";
    }
    if (lowerMessage.includes("schema")) {
      return "Audit report does not match the expected Soothmark schema.";
    }
    if (lowerMessage.includes("snap")) {
      return "Your connected wallet does not support MetaMask Snaps. Soothmark will continue without Snap features.";
    }
    if (lowerMessage.includes("rate limit")) {
      return "GenLayer RPC is busy. Soothmark will check again shortly.";
    }
  }

  return "Audit submission failed. Check the console for the transaction error.";
}

function getAuditPollingDelayMs(attempt: number, startedAt: number, wasRateLimited: boolean) {
  if (wasRateLimited) {
    return rateLimitRetryDelayMs;
  }

  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs < 30_000) {
    return 5_000;
  }
  if (elapsedMs < 120_000) {
    return 10_000;
  }
  return attempt < 5 ? 10_000 : 20_000;
}

async function readPreSubmitAuditCountForNewSubmit(): Promise<number | null> {
  try {
    return await Promise.race<number | null>([
      soothmarkClient.getAuditCount(),
      new Promise((resolve) => {
        window.setTimeout(() => resolve(null), preSubmitCountTimeoutMs);
      }),
    ]);
  } catch (error) {
    soothmarkTrace("submit", "pre-submit audit count unavailable", error);
    return null;
  }
}

export function AuditInputPreview() {
  const searchParams = useSearchParams();
  const wallet = useWalletIdentity();
  const [contractCode, setContractCode] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [result, setResult] = useState<SoothmarkAudit | null>(null);
  const [auditId, setAuditId] = useState("");
  const [error, setError] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const [transactionExplorerUrl, setTransactionExplorerUrl] = useState("");
  const [isFinalizingTimeout, setIsFinalizingTimeout] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const resultPollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const auditRunRef = useRef(0);
  const activeAuditIdRef = useRef("");
  const activeSubmissionRef = useRef<ActiveAuditSubmission | null>(null);
  const auditStartedAtRef = useRef<number | null>(null);
  const lastReadWasRateLimitedRef = useRef(false);
  const previousWalletAddressRef = useRef<string | undefined>(undefined);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      soothmarkDebug("[Soothmark polling] component unmounted; cleanup only");
      mountedRef.current = false;
      auditRunRef.current += 1;
      activeAuditIdRef.current = "";
      clearResultPolling("component_unmounted");
      clearMockStepTimers();
    };
  }, []);

  useEffect(() => {
    if (!isAuditing) {
      return;
    }

    const startedAt = auditStartedAtRef.current ?? Date.now();
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    const interval = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isAuditing]);

  useEffect(() => {
    const currentAddress = normalizeWalletAddress(wallet.address);
    const previousAddress = previousWalletAddressRef.current;
    if (previousAddress === undefined) {
      previousWalletAddressRef.current = currentAddress;
      return;
    }

    if (previousAddress === currentAddress) {
      return;
    }

    const activeSubmission = activeSubmissionRef.current;
    const storedAddress = normalizeWalletAddress(activeSubmission?.walletAddress);
    previousWalletAddressRef.current = currentAddress;

    if (activeSubmission && currentAddress && storedAddress === currentAddress) {
      return;
    }

    soothmarkDebug("[Soothmark wallet] previous address:", previousAddress);
    soothmarkDebug("[Soothmark wallet] new address:", currentAddress);
    soothmarkDebug("[Soothmark wallet] address changed:", { previousAddress, currentAddress });
    soothmarkDebug("[Soothmark wallet] clearing active audit state");
    soothmarkDebug("[Soothmark polling] stopped because:", "wallet_changed");

    clearTimers("wallet_changed");
    auditRunRef.current += 1;
    activeAuditIdRef.current = "";
    activeSubmissionRef.current = null;
    auditStartedAtRef.current = null;
    lastReadWasRateLimitedRef.current = false;
    setResult(null);
    setAuditId("");
    setError("");
    setPendingMessage("");
    setTransactionExplorerUrl("");
    setIsFinalizingTimeout(false);
    setCurrentStep(0);
    setElapsedSeconds(0);
    setIsAuditing(false);
  }, [wallet.address]);

  useEffect(() => {
    const exampleId = searchParams.get("example");
    if (!exampleId) {
      return;
    }

    const example = getExampleById(exampleId);
    if (example) {
      const activeSubmission = activeSubmissionRef.current;
      if (activeSubmission && activeSubmission.status !== "ready" && activeSubmission.status !== "error") {
        return;
      }
      resetAuditDisplay();
      setContractCode(example.code);
    }
  }, [searchParams]);

  function clearMockStepTimers() {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }

  function clearTimers(reason = "new_submission_started") {
    clearResultPolling(reason);
    clearMockStepTimers();
  }

  function clearResultPolling(reason: string) {
    if (resultPollTimerRef.current) {
      clearTimeout(resultPollTimerRef.current);
      resultPollTimerRef.current = null;
      soothmarkDebug("[Soothmark auto] stopped polling because:", reason);
      soothmarkDebug("[Soothmark flow] polling stopped reason:", reason);
      soothmarkTrace("polling", "stop reason", reason);
    }
  }

  function resetAuditDisplay() {
    clearTimers("user_reset");
    auditRunRef.current += 1;
    setResult(null);
    setAuditId("");
    activeAuditIdRef.current = "";
    activeSubmissionRef.current = null;
    auditStartedAtRef.current = null;
    setError("");
    setPendingMessage("");
    setTransactionExplorerUrl("");
    setIsFinalizingTimeout(false);
    setCurrentStep(0);
    setElapsedSeconds(0);
    setIsAuditing(false);
  }

  function runAnotherAudit() {
    resetAuditDisplay();
  }

  function loadExample(exampleId: string) {
    const example = getExampleById(exampleId);
    if (!example) {
      return;
    }

    resetAuditDisplay();
    setContractCode(example.code);
  }

  function clearEditor() {
    resetAuditDisplay();
    setContractCode("");
  }

  async function resolveSubmittedAudit(submission: ActiveAuditSubmission, source: "auto" | "manual"): Promise<ResolvedSubmittedAudit | null> {
    soothmarkDebug("[Soothmark resolve] source:", source);
    soothmarkDebug("[Soothmark submit] submissionId:", submission.submissionId);
    soothmarkDebug("[Soothmark submit] walletAtSubmit:", submission.walletAddress);
    soothmarkDebug("[Soothmark submit] preSubmitAuditCount:", submission.preSubmitAuditCount);
    soothmarkTrace("polling", "active auditId", submission.auditId ?? "(unresolved)");

    const walletAtSubmit = normalizeWalletAddress(submission.walletAddress);
    if (!walletAtSubmit) {
      return null;
    }

    try {
      soothmarkDebug("[Soothmark resolve] indexed read start:", { walletAtSubmit: submission.walletAddress, source });
      soothmarkTrace("polling", "submit post-acceptance indexed lookup start", {
        contractAddress: soothmarkContractConfig.address,
        chain: soothmarkContractConfig.chainName,
        rpcEndpoint: soothmarkContractConfig.endpoint,
        receiptStatus: soothmarkContractConfig.receiptStatus,
      });
      const indexedAuditIds = await soothmarkClient.getAuditIdsByOwner(submission.walletAddress ?? "");
      lastReadWasRateLimitedRef.current = false;
      const candidateIds = indexedAuditIds.filter((candidateId) => {
        const numericAuditId = Number(candidateId);
        return Number.isInteger(numericAuditId) && numericAuditId >= submission.preSubmitAuditCount;
      });

      if (submission.auditId && !candidateIds.includes(submission.auditId)) {
        const numericAuditId = Number(submission.auditId);
        if (Number.isInteger(numericAuditId) && numericAuditId >= submission.preSubmitAuditCount) {
          candidateIds.unshift(submission.auditId);
        }
      }

      soothmarkDebug("[Soothmark resolve] indexed candidate IDs:", candidateIds);
      for (const candidateId of candidateIds) {
        let audit: SoothmarkAudit | null = null;
        try {
          soothmarkTrace("polling", "getAudit start", { auditId: candidateId, source: `${source}_owner_index` });
          audit = await soothmarkClient.getAudit(candidateId);
          soothmarkDebug("[Soothmark flow] getAudit raw result:", getLastSoothmarkAuditResponseDebug(candidateId));
          soothmarkDebug("[Soothmark flow] normalized audit:", audit);
          lastReadWasRateLimitedRef.current = false;
        } catch (caughtError) {
          if (isSoothmarkRateLimitError(caughtError)) {
            lastReadWasRateLimitedRef.current = true;
            const message = "GenLayer RPC is busy. Soothmark will check again shortly.";
            soothmarkDebug("[Soothmark read] rate limited:", { candidateId, source, error: caughtError });
            setPendingMessage(message);
            setError("");
            return null;
          }
          throw caughtError;
        }

        const rawDebug = getLastSoothmarkAuditResponseDebug(candidateId);
        if (audit) {
          soothmarkDebug("[Soothmark resolve] loaded matching indexed auditId:", candidateId);
          soothmarkTrace("polling", "audit loaded", { auditId: candidateId, source: `${source}_owner_index` });
          return { auditId: candidateId, audit };
        }
        if (rawDebug?.jsonParseFailed || rawDebug?.schemaValidationFailed) {
          const message = rawDebug.jsonParseFailed
            ? "Audit report was returned, but could not be parsed."
            : "Audit report does not match the expected Soothmark schema.";
          soothmarkDebug("[Soothmark error] reason:", message);
          soothmarkDebug("[Soothmark error] raw:", rawDebug);
          activeSubmissionRef.current = { ...submission, status: "error" };
          setError(message);
          setPendingMessage("");
          setIsAuditing(false);
          return null;
        }
      }

      setPendingMessage("Soothmark is checking the contract for your new audit record.");
      return null;
    } catch (caughtError) {
      if (isSoothmarkRateLimitError(caughtError)) {
        lastReadWasRateLimitedRef.current = true;
        const message = "GenLayer RPC is busy. Soothmark will check again shortly.";
        soothmarkDebug("[Soothmark read] rate limited:", { source, error: caughtError });
        setPendingMessage(message);
        setError("");
        return null;
      }
      soothmarkDebug("[Soothmark resolve] owner-index lookup failed; falling back to count/owner scan.", caughtError);
    }

    let currentAuditCount = 0;
    try {
      currentAuditCount = await soothmarkClient.getAuditCount();
      lastReadWasRateLimitedRef.current = false;
    } catch (caughtError) {
      if (isSoothmarkRateLimitError(caughtError)) {
        lastReadWasRateLimitedRef.current = true;
        const message = "GenLayer RPC is busy. Soothmark will check again shortly.";
        soothmarkDebug("[Soothmark read] rate limited:", { source, error: caughtError });
        setPendingMessage(message);
        setError("");
        return null;
      }
      throw caughtError;
    }

    soothmarkDebug("[Soothmark resolve] currentAuditCount:", currentAuditCount);
    if (currentAuditCount <= submission.preSubmitAuditCount) {
      soothmarkTrace("polling", "not ready yet", {
        reason: "audit_count_not_advanced",
        currentAuditCount,
        preSubmitAuditCount: submission.preSubmitAuditCount,
      });
      setPendingMessage("Soothmark is checking the contract for your new audit record.");
      return null;
    }

    const candidateIds: string[] = [];
    if (submission.auditId) {
      const numericAuditId = Number(submission.auditId);
      if (Number.isInteger(numericAuditId) && numericAuditId >= submission.preSubmitAuditCount && numericAuditId < currentAuditCount) {
        candidateIds.push(submission.auditId);
      } else {
        soothmarkDebug("[Soothmark resolve] ignored stale auditId:", submission.auditId);
      }
    }
    for (let index = submission.preSubmitAuditCount; index < currentAuditCount; index += 1) {
      const candidateId = String(index);
      if (!candidateIds.includes(candidateId)) {
        candidateIds.push(candidateId);
      }
    }
    soothmarkDebug("[Soothmark resolve] candidate IDs:", candidateIds);

    for (const candidateId of candidateIds) {
      const numericAuditId = Number(candidateId);
      if (!Number.isInteger(numericAuditId) || numericAuditId < submission.preSubmitAuditCount) {
        soothmarkDebug("[Soothmark resolve] ignored stale auditId:", candidateId);
        continue;
      }

      soothmarkDebug("[Soothmark resolve] checking owner for auditId:", candidateId);
      let owner = "";
      try {
        owner = await soothmarkClient.getAuditOwner(candidateId);
        lastReadWasRateLimitedRef.current = false;
      } catch (caughtError) {
        if (isSoothmarkRateLimitError(caughtError)) {
          lastReadWasRateLimitedRef.current = true;
          const message = "GenLayer RPC is busy. Soothmark will check again shortly.";
          soothmarkDebug("[Soothmark read] rate limited:", { candidateId, source, error: caughtError });
          setPendingMessage(message);
          setError("");
          return null;
        }
        throw caughtError;
      }

      soothmarkDebug("[Soothmark resolve] owner:", owner);
      if (normalizeWalletAddress(owner) !== walletAtSubmit) {
        soothmarkDebug("[Soothmark resolve] ignored owner mismatch:", { candidateId, owner, walletAtSubmit: submission.walletAddress });
        continue;
      }
      soothmarkDebug("[Soothmark resolve] owner matched:", candidateId);

      let audit: SoothmarkAudit | null = null;
      try {
        soothmarkTrace("polling", "getAudit start", { auditId: candidateId, source });
        audit = await soothmarkClient.getAudit(candidateId);
        soothmarkDebug("[Soothmark flow] getAudit raw result:", getLastSoothmarkAuditResponseDebug(candidateId));
        soothmarkDebug("[Soothmark flow] normalized audit:", audit);
        soothmarkTrace("polling", "getAudit raw result", {
          auditId: candidateId,
          raw: getLastSoothmarkAuditResponseDebug(candidateId),
        });
        soothmarkTrace("polling", "normalized audit", {
          auditId: candidateId,
          audit,
        });
        lastReadWasRateLimitedRef.current = false;
      } catch (caughtError) {
        if (isSoothmarkRateLimitError(caughtError)) {
          lastReadWasRateLimitedRef.current = true;
          const message = "GenLayer RPC is busy. Soothmark will check again shortly.";
          soothmarkDebug("[Soothmark read] rate limited:", { candidateId, source, error: caughtError });
          setPendingMessage(message);
          setError("");
          return null;
        }
        throw caughtError;
      }

      const rawDebug = getLastSoothmarkAuditResponseDebug(candidateId);
      if (audit) {
        soothmarkDebug("[Soothmark resolve] loaded matching auditId:", candidateId);
        soothmarkTrace("polling", "audit loaded", { auditId: candidateId, source });
        return { auditId: candidateId, audit };
      }
      soothmarkTrace("polling", "not ready yet", { auditId: candidateId, source, rawDebug });
      if (rawDebug?.jsonParseFailed || rawDebug?.schemaValidationFailed) {
        const message = rawDebug.jsonParseFailed
          ? "Audit report was returned, but could not be parsed."
          : "Audit report does not match the expected Soothmark schema.";
        soothmarkDebug("[Soothmark error] reason:", message);
        soothmarkDebug("[Soothmark error] raw:", rawDebug);
        activeSubmissionRef.current = { ...submission, status: "error" };
        setError(message);
        setPendingMessage("");
        setIsAuditing(false);
        return null;
      }
    }

    setPendingMessage("Soothmark is checking the contract for your new audit record.");
    return null;
  }

  function applyResolvedSubmittedAudit(submission: ActiveAuditSubmission, resolved: ResolvedSubmittedAudit, source: "auto" | "manual") {
    if (activeSubmissionRef.current?.submissionId !== submission.submissionId) {
      soothmarkDebug("[Soothmark polling] ignoring stale response", submission.submissionId);
      return;
    }

    clearMockStepTimers();
    clearResultPolling("audit_loaded");
    soothmarkDebug("[Soothmark resolved] auditId:", resolved.auditId);
    soothmarkDebug("[Soothmark resolved] source:", source);
    const readySubmission = { ...submission, auditId: resolved.auditId, status: "ready" as const };
    activeSubmissionRef.current = readySubmission;
    activeAuditIdRef.current = resolved.auditId;
    setAuditId(resolved.auditId);
    setResult(resolved.audit);
    setPendingMessage("");
    setError("");
    setIsFinalizingTimeout(false);
    setCurrentStep(progressStepCount - 1);
    setElapsedSeconds(0);
    setIsAuditing(false);
    soothmarkDebug("[Soothmark flow] audit loaded into UI", { auditId: resolved.auditId, source });
    soothmarkTrace("polling", "audit loaded", { auditId: resolved.auditId, source });
    if (source === "auto") {
      soothmarkDebug("[Soothmark polling] audit loaded automatically");
    }
  }

  async function resolveAndApplySubmittedAudit(submission: ActiveAuditSubmission, source: "auto" | "manual"): Promise<boolean> {
    const resolved = await resolveSubmittedAudit(submission, source);
    if (!resolved) {
      return false;
    }
    applyResolvedSubmittedAudit(submission, resolved, source);
    return true;
  }

  function startSubmittedAuditPolling(submission: ActiveAuditSubmission, runId: number) {
    clearResultPolling("new_submission_started");

    if (soothmarkContractConfig.useMocks) {
      void (async () => {
        const auditId = submission.auditId ?? "";
        const audit = auditId ? await soothmarkClient.getAudit(auditId) : null;
        if (audit && auditId) {
          applyResolvedSubmittedAudit(submission, { auditId, audit }, "auto");
        }
      })();
      return;
    }

    soothmarkDebug("[Soothmark auto] tx accepted, starting resolver");
    soothmarkDebug("[Soothmark polling] started for auditId:", submission.auditId ?? "(unresolved)");
    soothmarkTrace("polling", "active auditId", submission.auditId ?? "(unresolved)");
    soothmarkDebug("[Soothmark flow] polling started", {
      auditId: submission.auditId ?? "(unresolved)",
      submissionId: submission.submissionId,
    });
    activeSubmissionRef.current = { ...submission, status: "polling" };
    setPendingMessage("Transaction accepted. Soothmark is looking for the new audit report owned by your wallet.");

    const startedAt = auditStartedAtRef.current ?? Date.now();
    const tick = async (attempt: number) => {
      if (!mountedRef.current) {
        clearResultPolling("component_unmounted");
        return;
      }
      if (auditRunRef.current !== runId) {
        clearResultPolling("new_submission_started");
        return;
      }

      setCurrentStep(attempt < 20 ? 2 : 3);

      const activeSubmission = activeSubmissionRef.current;
      if (!activeSubmission || activeSubmission.submissionId !== submission.submissionId) {
        clearResultPolling("new_submission_started");
        return;
      }

      soothmarkDebug("[Soothmark auto] resolver tick", { attempt: attempt + 1, submissionId: activeSubmission.submissionId });
      soothmarkTrace("polling", "active auditId", activeSubmission.auditId ?? "(unresolved)");

      try {
        const didLoad = await resolveAndApplySubmittedAudit(activeSubmission, "auto");
        if (didLoad) {
          soothmarkDebug("[Soothmark auto] resolver result found:", activeAuditIdRef.current);
          return;
        }
      } catch (caughtError) {
        if (isSoothmarkRateLimitError(caughtError)) {
          lastReadWasRateLimitedRef.current = true;
          const message = "GenLayer RPC is busy. Soothmark will check again shortly.";
          soothmarkDebug("[Soothmark read] rate limited:", { source: "auto", error: caughtError });
          setPendingMessage(message);
          setError("");
        } else {
          const message = auditErrorMessage(caughtError);
          soothmarkDebug("[Soothmark error] reason:", message);
          soothmarkDebug("[Soothmark error] raw:", caughtError);
          activeSubmissionRef.current = { ...activeSubmission, status: "error" };
          setPendingMessage("");
          setError(message);
          setIsAuditing(false);
          clearResultPolling("fatal_error");
          return;
        }
      }

      if (Date.now() - startedAt >= reportPollTimeoutMs) {
        const message = "Your transaction was accepted, but Soothmark could not find a new audit report for this wallet yet. You can check again or open the explorer.";
        const debug = activeSubmission.auditId ? getLastSoothmarkAuditResponseDebug(activeSubmission.auditId) : null;
        soothmarkDebug("[Soothmark auto] stopped polling because:", "timeout");
        soothmarkDebug("[Soothmark error] reason:", message);
        soothmarkDebug("[Soothmark error] raw:", debug);
        activeSubmissionRef.current = { ...activeSubmission, status: "timeout" };
        setIsFinalizingTimeout(true);
        setPendingMessage("");
        setError(message);
        setIsAuditing(false);
        clearResultPolling("timeout");
        return;
      }

      const nextDelayMs = getAuditPollingDelayMs(attempt, startedAt, lastReadWasRateLimitedRef.current);
      soothmarkDebug("[Soothmark auto] resolver result not found:", { attempt: attempt + 1 });
      soothmarkDebug("[Soothmark auto] continuing polling");
      soothmarkDebug("[Soothmark polling] next retry in:", nextDelayMs);
      resultPollTimerRef.current = setTimeout(() => {
        void tick(attempt + 1);
      }, nextDelayMs);
    };

    void tick(0);
  }

  async function refreshStatus() {
    setIsRefreshingStatus(true);
    try {
      const activeSubmission = activeSubmissionRef.current;
      if (activeSubmission) {
        activeSubmissionRef.current = activeSubmission;
        const didLoad = await resolveAndApplySubmittedAudit(activeSubmission, "manual");
        if (didLoad) {
          toast.success("Active audit loaded.");
        } else {
          toast.message("This audit is still finalizing. Check again in a few minutes.");
        }
        return;
      }

      if (!wallet.address) {
        toast.error("Connect your wallet to refresh wallet-scoped audit status.");
        return;
      }
      toast.message("No active audit submission is available to check.");
    } catch (caughtError) {
      if (isSoothmarkRateLimitError(caughtError)) {
        const message = "GenLayer RPC is busy. Your audit transaction may still be accepted. Soothmark will check again shortly.";
        soothmarkDebug("[Soothmark read] rate limited:", { source: "manual", error: caughtError });
        setPendingMessage(message);
        toast.message(message);
        return;
      }
      soothmarkDebug("[Soothmark error] reason:", "Could not refresh audit status.");
      soothmarkDebug("[Soothmark error] raw:", caughtError);
      toast.error("Could not refresh audit status.");
    } finally {
      setIsRefreshingStatus(false);
    }
  }

  async function startAudit() {
    soothmarkDebug("[Soothmark submit] clicked");
    soothmarkDebug("[Soothmark submit] wallet connected:", wallet.isConnected);
    soothmarkDebug("[Soothmark submit] address:", wallet.address);
    soothmarkDebug("[Soothmark submit] contract length:", contractCode.length);

    if (contractCode.trim() === "") {
      const message = "Paste a GenLayer contract before starting an audit.";
      setError(message);
      toast.error(message);
      return;
    }

    if (!soothmarkContractConfig.useMocks && !wallet.isConnected) {
      const message = "Connect your wallet before submitting an on-chain audit.";
      soothmarkDebug("[Soothmark error] reason:", message);
      soothmarkDebug("[Soothmark error] raw:", { wallet });
      setError(message);
      toast.error(message);
      return;
    }

    soothmarkTrace("submit", "active submission cleared before new submit", {
      contractAddress: soothmarkContractConfig.address,
      chainName: soothmarkContractConfig.chainName,
      walletAddress: wallet.address,
    });
    clearTimers("new_submission_started");
    auditRunRef.current += 1;
    const runId = auditRunRef.current;
    const previousAuditId = auditId;
    const walletAtSubmit = wallet.address ?? "";
    const submissionId = createSubmissionId();
    setError("");
    setPendingMessage("");
    setTransactionExplorerUrl("");
    setIsFinalizingTimeout(false);
    setResult(null);
    setAuditId("");
    activeAuditIdRef.current = "";
    auditStartedAtRef.current = Date.now();
    setIsAuditing(true);
    setCurrentStep(0);
    setElapsedSeconds(0);

    if (soothmarkContractConfig.useMocks) {
      [650, 1300, 1950].forEach((delayMs, index) => {
        timersRef.current.push(
          setTimeout(() => {
            if (mountedRef.current && auditRunRef.current === runId) {
              setCurrentStep(index + 1);
            }
          }, delayMs),
        );
      });
    } else {
      setPendingMessage("Preparing audit submission...");
    }

    try {
      const preSubmitAuditCount = soothmarkContractConfig.useMocks ? 0 : await readPreSubmitAuditCountForNewSubmit();
      soothmarkDebug("[Soothmark submit] submissionId:", submissionId);
      soothmarkDebug("[Soothmark submit] walletAtSubmit:", walletAtSubmit);
      soothmarkDebug("[Soothmark submit] preSubmitAuditCount:", preSubmitAuditCount);
      setPendingMessage("Submitting audit transaction...");
      soothmarkTrace("submit", "new submit started", { submissionId, walletAtSubmit, preSubmitAuditCount });
      soothmarkTrace("submit", "wallet transaction request started", { submissionId });
      const nextAuditId = await soothmarkClient.submitAudit(contractCode);
      const numericNextAuditId = Number(nextAuditId);
      const submissionLowerBound = preSubmitAuditCount ?? (Number.isInteger(numericNextAuditId) && numericNextAuditId >= 0 ? numericNextAuditId : 0);
      const submissionMeta = getLastSoothmarkSubmissionMeta(nextAuditId);
      const explorerUrl = submissionMeta?.explorerUrl ?? "";
      soothmarkDebug("[Soothmark submit] txHash:", submissionMeta?.transactionHash);
      soothmarkDebug("[Soothmark flow] tx submitted", {
        txHash: submissionMeta?.transactionHash,
        auditId: nextAuditId,
      });

      soothmarkDebug("[Soothmark submit] previous auditId:", previousAuditId);
      soothmarkDebug("[Soothmark submit] active auditId:", nextAuditId);
      soothmarkDebug("[Soothmark submit] interpreted auditId:", nextAuditId);
      soothmarkDebug("[Soothmark flow] resolved auditId:", nextAuditId);
      soothmarkDebug("[Soothmark submit] transaction explorer:", explorerUrl);
      setAuditId(nextAuditId);
      activeAuditIdRef.current = nextAuditId;
      soothmarkDebug("[Soothmark flow] activeAuditId set:", nextAuditId);
      setTransactionExplorerUrl(explorerUrl);
      const activeSubmission: ActiveAuditSubmission = {
        submissionId,
        preSubmitAuditCount: submissionLowerBound,
        auditId: nextAuditId,
        walletAddress: walletAtSubmit,
        transactionHash: submissionMeta?.transactionHash,
        explorerUrl,
        status: "confirmed",
        startedAt: auditStartedAtRef.current ?? Date.now(),
      };
      activeSubmissionRef.current = activeSubmission;
      soothmarkTrace("submit", "active submission started in memory", activeSubmission);
      soothmarkDebug("[Soothmark tx] auditId:", nextAuditId);
      soothmarkDebug("[Soothmark tx] accepted/confirmed");
      soothmarkDebug("[Soothmark flow] tx accepted");
      setPendingMessage("Transaction accepted. Soothmark is looking for the new audit report owned by your wallet.");
      setCurrentStep(2);
      startSubmittedAuditPolling(activeSubmission, runId);
    } catch (caughtError) {
      const message = auditErrorMessage(caughtError);
      soothmarkDebug("[Soothmark error] reason:", message);
      soothmarkDebug("[Soothmark error] raw:", caughtError);
      clearTimers("fatal_error");
      setIsFinalizingTimeout(message.includes("still finalizing"));
      if (activeSubmissionRef.current) {
        activeSubmissionRef.current = { ...activeSubmissionRef.current, status: "error" };
      }
      setPendingMessage("");
      setError(message);
      toast.error(message);
      setIsAuditing(false);
    }
  }

  const auditButtonText = isAuditing && !soothmarkContractConfig.useMocks && currentStep > 0
    ? "Waiting for report..."
    : isAuditing
      ? "Submitting..."
      : "Audit Contract";

  return (
    <SectionShell
      className="py-16"
      eyebrow="Audit workspace"
      title="Submit a GenLayer contract for audit."
      description="Paste a full GenLayer intelligent contract to check whether outside data is properly validated before it changes what the contract stores."
    >
      <motion.div
        id="audit"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="rounded-xl border border-border/90 bg-surface p-4 shadow-[0_24px_70px_rgb(90_70_42_/_0.1)] transition duration-300 hover:border-primary/30 hover:shadow-[0_28px_80px_rgb(37_99_235_/_0.08)]"
      >
        <div className="mb-3 flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rejected/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-conditional/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-certified/70" />
            <span className="ml-3 text-xs text-text-muted">contract.py</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="ghost" size="sm" className="text-xs text-text-muted hover:bg-surface-soft hover:text-text-main" onClick={() => loadExample("simple-storage")} disabled={isAuditing}>
              <FileCode2 className="mr-1.5 h-3.5 w-3.5" />
              Load SimpleStorage
            </Button>
            <Button type="button" variant="ghost" size="sm" className="text-xs text-text-muted hover:bg-surface-soft hover:text-text-main" onClick={() => loadExample("bad-web-fetcher")} disabled={isAuditing}>
              <Globe className="mr-1.5 h-3.5 w-3.5" />
              Load unsafe web fetcher
            </Button>
            <Button type="button" variant="ghost" size="sm" className="text-xs text-text-muted hover:bg-surface-soft hover:text-text-main" onClick={clearEditor} disabled={isAuditing}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
          <textarea
            value={contractCode}
            onChange={(event) => setContractCode(event.target.value)}
            placeholder="Paste your GenLayer intelligent contract here..."
            className="min-h-[300px] w-full resize-y appearance-none rounded-lg border border-[#1F2937] bg-[#0B1020] p-5 font-mono text-sm leading-7 text-[#F8FAFC] caret-primary shadow-[inset_0_1px_0_rgb(255_255_255_/_0.05),0_18px_44px_rgb(17_24_39_/_0.18)] outline-none placeholder:text-[#94A3B8] focus:border-primary disabled:opacity-70"
            disabled={isAuditing}
          />
        </div>
        {!contractCode && !isAuditing && !result && (
          <div className="mt-3 rounded-lg border border-border/70 bg-surface-soft px-4 py-3 text-sm text-text-muted">
            Paste a full GenLayer contract or load an example to preview the auditor workflow.
          </div>
        )}
        {error && (
          <p className={`mt-3 text-sm ${isFinalizingTimeout ? "text-text-muted" : "text-rejected"}`} role="alert">
            {error}
          </p>
        )}
        {pendingMessage && !error && (
          <p className="mt-3 text-sm text-primary" role="status" aria-live="polite">
            {pendingMessage}
          </p>
        )}
        <div className="mt-5 rounded-lg border border-border/70 bg-primary-soft/60 px-4 py-4 text-sm leading-6 text-text-muted">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              On-chain audits may take several minutes as GenLayer’s Optimistic Democracy processes the audit transaction through leader proposal, validator verification, and finality.
            </p>
          </div>
        </div>
        <WalletAuditStatusNote />
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {result ? (
            <>
              <GradientButton asChild>
                <Link
                  href={`/audit/${auditId}`}
                  onClick={() => soothmarkDebug("Opening Soothmark audit report route.", { route: `/audit/${auditId}`, auditId })}
                >
                  Open Full Report
                </Link>
              </GradientButton>
              <Button
                type="button"
                variant="outline"
                className="border-border bg-surface text-text-main hover:bg-surface-soft"
                onClick={runAnotherAudit}
              >
                Run another audit
              </Button>
            </>
          ) : (
            <GradientButton type="button" onClick={startAudit} disabled={isAuditing}>
              {auditButtonText}
            </GradientButton>
          )}
        </div>

        {isFinalizingTimeout && !result && (
          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-border/70 bg-surface-soft p-4 sm:flex-row sm:items-center sm:justify-end">
            <Button asChild variant="outline" className="border-border bg-surface text-text-main hover:bg-surface-soft">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
            {transactionExplorerUrl && (
              <Button asChild variant="outline" className="border-primary/25 bg-surface text-primary hover:bg-primary-soft">
                <a href={transactionExplorerUrl} target="_blank" rel="noreferrer">
                  Open in explorer
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            <Button type="button" variant="outline" className="border-border bg-surface text-text-main hover:bg-surface-soft" onClick={runAnotherAudit} disabled={isAuditing}>
              Run another audit
            </Button>
            <GradientButton type="button" onClick={refreshStatus} disabled={isRefreshingStatus}>
              {isRefreshingStatus ? "Checking..." : "Check again"}
            </GradientButton>
          </div>
        )}

        {(isAuditing || isFinalizingTimeout) && !result && (
          <div className="mt-6" aria-live="polite">
            <AuditProgressTimeline
              currentStep={currentStep}
              elapsedSeconds={elapsedSeconds}
              explorerUrl={transactionExplorerUrl}
              isChecking={isRefreshingStatus}
              isTimedOut={isFinalizingTimeout}
              showCheckAgain={elapsedSeconds >= 60}
              onCheckAgain={refreshStatus}
            />
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          >
            <AuditResultSummary audit={result} auditId={auditId} className="mt-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </SectionShell>
  );
}

function WalletAuditStatusNote() {
  if (soothmarkContractConfig.useMocks) {
    return (
      <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border/80 bg-surface-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary-soft text-primary">
            <Wallet className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium text-text-main">Preview mode</p>
            <p className="text-xs leading-5 text-text-muted">Mock audit results are active until real on-chain audits are connected.</p>
          </div>
        </div>
        <span className="w-fit rounded-full border border-primary/20 bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">Preview</span>
      </div>
    );
  }

  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted }) => {
        const connected = mounted && account && chain && !chain.unsupported;

        if (!connected) {
          return (
            <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border/80 bg-surface px-4 py-3 shadow-[0_12px_30px_rgb(90_70_42_/_0.05)] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-soft text-text-muted">
                  <Wallet className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-text-main">Wallet required</p>
                  <p className="text-xs leading-5 text-text-muted">Connect your wallet to submit an on-chain audit.</p>
                </div>
              </div>
              <span className="w-fit rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs font-medium text-text-muted">Not connected</span>
            </div>
          );
        }

        return (
          <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border/80 bg-surface px-4 py-3 shadow-[0_12px_30px_rgb(90_70_42_/_0.05)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-certified/20 bg-[var(--certified-soft)] text-certified">
                <Wallet className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-text-main">Connected wallet</p>
                <p className="font-mono text-xs text-text-muted">{shortenAddress(account.address)}</p>
                <p className="mt-0.5 text-xs leading-5 text-text-muted">Audits will be associated with this address.</p>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-certified/20 bg-[var(--certified-soft)] px-2.5 py-1 text-xs font-medium text-certified">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ready
            </span>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
