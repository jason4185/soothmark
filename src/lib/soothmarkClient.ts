import { createClient } from "genlayer-js";
import { ExecutionResult, TransactionStatus, type CalldataEncodable, type TransactionHash } from "genlayer-js/types";
import type { Address } from "viem";
import { parseSoothmarkAudit, safeParseSoothmarkAudit } from "@/lib/auditSchema";
import { soothmarkDebug, soothmarkError, soothmarkTrace, soothmarkWarn } from "@/lib/debug";
import { mockAuditOwners, mockAuditsById, mockCertifiedAudit, mockConditionalAudit, mockRejectedAudit } from "@/lib/mocks/audits";
import { getSoothmarkChain, getSoothmarkTransactionExplorerUrl, requireSoothmarkContractAddress, soothmarkContractConfig } from "@/lib/soothmarkContractConfig";
import type { SoothmarkAudit } from "@/types/audit";

type OwnedAudit = {
  auditId: string;
  owner: string;
  audit: SoothmarkAudit;
};

type CreateClientConfig = NonNullable<Parameters<typeof createClient>[0]>;
type EthereumProvider = NonNullable<CreateClientConfig["provider"]>;
type BrowserWalletProvider = EthereumProvider & {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

export type AuditResponseDebug = {
  auditId?: string;
  rawType: string;
  rawWasEmpty: boolean;
  jsonParseFailed: boolean;
  schemaValidationFailed: boolean;
  schemaErrorMessage?: string;
};

export type SoothmarkSubmissionMeta = {
  auditId?: string;
  transactionHash?: string;
  explorerUrl?: string;
};

const submittedAudits = new Map<string, SoothmarkAudit>(Object.entries(mockAuditsById));
const submittedOwners = new Map<string, string>(Object.entries(mockAuditOwners));
const defaultMockOwner = "0x1111111111111111111111111111111111111111";
let mockSubmissionCount = 4;
let lastAuditResponseDebug: AuditResponseDebug | null = null;
let lastSubmissionMeta: SoothmarkSubmissionMeta | null = null;
const inFlightContractReads = new Map<string, Promise<unknown>>();

// Mock-only storage. Real audit persistence comes from the Soothmark contract.

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chooseMockAudit(contractCode: string): SoothmarkAudit {
  // Mock-only UI behavior. Real audit judgment comes from the Soothmark contract.
  if (contractCode.includes("FakeValidationMention")) {
    return mockRejectedAudit;
  }
  if (
    contractCode.includes("gl.nondet.web.get") &&
    !contractCode.includes("gl.vm.run_nondet_unsafe(") &&
    !contractCode.includes("gl.eq_principle.strict_eq") &&
    !contractCode.includes("prompt_comparative")
  ) {
    return mockRejectedAudit;
  }
  if (contractCode.includes("prompt_comparative")) {
    return mockConditionalAudit;
  }
  return mockCertifiedAudit;
}

const mockClient = {
  async submitAudit(contractCode: string): Promise<string> {
    if (contractCode.trim() === "") {
      throw new Error("Contract code is required.");
    }
    await delay(350);
    const auditId = `mock-${String(mockSubmissionCount).padStart(3, "0")}`;
    mockSubmissionCount += 1;
    submittedAudits.set(auditId, parseSoothmarkAudit(chooseMockAudit(contractCode)));
    submittedOwners.set(auditId, defaultMockOwner);
    lastSubmissionMeta = { auditId };
    soothmarkDebug("Soothmark mock submitAudit returning audit ID.", { auditId });
    return auditId;
  },

  async getAudit(auditId: string): Promise<SoothmarkAudit | null> {
    await delay(150);
    const audit = submittedAudits.get(auditId);
    soothmarkDebug("Soothmark mock raw getAudit response.", { auditId, rawAudit: audit ?? "" });
    soothmarkDebug("[Soothmark getAudit] auditId:", auditId);
    soothmarkDebug("[Soothmark getAudit] raw response:", audit ?? "");
    soothmarkDebug("[Soothmark getAudit] raw type:", typeof (audit ?? ""));
    lastAuditResponseDebug = {
      auditId,
      rawType: audit ? "object" : "string",
      rawWasEmpty: !audit,
      jsonParseFailed: false,
      schemaValidationFailed: false,
    };
    return audit ? normalizeAuditResponse(audit, auditId) : null;
  },

  async getAuditCount(): Promise<number> {
    await delay(100);
    return submittedAudits.size;
  },

  async getLastAuditId(): Promise<string> {
    await delay(100);
    const auditIds = Array.from(submittedAudits.keys());
    return auditIds[auditIds.length - 1] ?? "";
  },

  async getLastAudit(): Promise<SoothmarkAudit | null> {
    const auditId = await this.getLastAuditId();
    return auditId === "" ? null : this.getAudit(auditId);
  },

  async getAuditOwner(auditId: string): Promise<string> {
    await delay(120);
    return submittedOwners.get(auditId) ?? "";
  },

  async getAuditIdsByOwner(walletAddress: string): Promise<string[]> {
    await delay(120);
    return Array.from(submittedAudits.keys()).filter((auditId) => (
      (submittedOwners.get(auditId) ?? "").toLowerCase() === walletAddress.toLowerCase()
    ));
  },

  async getMyAuditIds(): Promise<string[]> {
    await delay(120);
    return this.getAuditIdsByOwner(defaultMockOwner);
  },

  async getMyAudits(walletAddress: string): Promise<OwnedAudit[]> {
    await delay(220);
    const auditIds = await this.getAuditIdsByOwner(walletAddress);
    return auditIds.reduce<OwnedAudit[]>((ownedAudits, auditId) => {
      const owner = submittedOwners.get(auditId) ?? "";
      const audit = submittedAudits.get(auditId);
      if (audit) {
        ownedAudits.push({ auditId, owner, audit });
      }
      return ownedAudits;
    }, []).sort((left, right) => Number(right.auditId.replace("mock-", "")) - Number(left.auditId.replace("mock-", "")));
  },
};

function createReadClient() {
  return createClient({
    chain: getSoothmarkChain(),
    endpoint: soothmarkContractConfig.endpoint,
  });
}

function getBrowserWalletProvider(): BrowserWalletProvider | null {
  if (typeof window === "undefined") {
    return null;
  }

  const browserWindow = window as Window & { ethereum?: BrowserWalletProvider };
  return browserWindow.ethereum ?? null;
}

async function getConnectedWalletAddress(provider: BrowserWalletProvider): Promise<Address> {
  if (!provider.request) {
    throw new Error("Wallet provider is unavailable.");
  }

  const accounts = await provider.request({ method: "eth_accounts" });
  const [address] = Array.isArray(accounts) ? accounts : [];

  if (typeof address !== "string" || address === "") {
    throw new Error("Connect your wallet to submit an on-chain audit.");
  }

  return address as Address;
}

async function createWriteClient() {
  const provider = getBrowserWalletProvider();
  if (!provider) {
    throw new Error("Connect your wallet to submit an on-chain audit.");
  }

  const account = await getConnectedWalletAddress(provider);
  const client = createClient({
    chain: getSoothmarkChain(),
    endpoint: soothmarkContractConfig.endpoint,
    account,
    provider,
  });

  return client;
}

function getReceiptStatus() {
  const statusName = soothmarkContractConfig.receiptStatus.toUpperCase() as keyof typeof TransactionStatus;
  return TransactionStatus[statusName] ?? TransactionStatus.ACCEPTED;
}

function coerceString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
    return String(value);
  }
  if (value && typeof value === "object" && "calldata" in value) {
    return coerceString((value as { calldata: unknown }).calldata);
  }
  return "";
}

function unquoteString(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "";
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return typeof parsed === "string" ? parsed : trimmed;
  } catch {
    return trimmed;
  }
}

function getRawType(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return "array";
  }
  return typeof value;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, (_key, nestedValue) => (
      typeof nestedValue === "bigint" ? nestedValue.toString() : nestedValue
    ), 2);
  } catch (error) {
    return `[unserializable: ${error instanceof Error ? error.message : String(error)}]`;
  }
}

function logContractRead(method: string, params: unknown[], raw: unknown, normalized: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  soothmarkDebug("[Soothmark read] method:", method);
  soothmarkDebug("[Soothmark read] params:", params);
  soothmarkDebug("[Soothmark read] raw:", raw);
  soothmarkDebug("[Soothmark read] normalized:", normalized);
}

function logContractReadStarted(method: string, params: unknown[], deduped = false) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  soothmarkDebug("[Soothmark read] method:", method);
  soothmarkDebug("[Soothmark read] params:", params);
  soothmarkDebug("[Soothmark read] started:", { deduped });
}

function logContractReadFinished(method: string, params: unknown[]) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  soothmarkDebug("[Soothmark read] method:", method);
  soothmarkDebug("[Soothmark read] params:", params);
  soothmarkDebug("[Soothmark read] finished:", true);
}

function logDashboardRpc(message: string, value?: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (value === undefined) {
    soothmarkDebug(message);
  } else {
    soothmarkDebug(message, value);
  }
}

function parseAuditIdsByOwner(rawValue: unknown, depth = 0): string[] {
  if (rawValue && typeof rawValue === "object" && depth < 4) {
    const record = rawValue as Record<string, unknown>;
    for (const key of ["value", "result", "data", "response", "calldata"]) {
      if (key in record) {
        const nestedAuditIds = parseAuditIdsByOwner(record[key], depth + 1);
        if (nestedAuditIds.length > 0) {
          return nestedAuditIds;
        }
      }
    }
  }

  const text = unquoteString(coerceString(rawValue));
  if (text === "") {
    return [];
  }

  try {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => String(item))
      .filter((item) => item.trim() !== "");
  } catch (error) {
    soothmarkWarn("Could not parse Soothmark owner audit index.", { rawValue, error });
    return [];
  }
}

function sortAuditIdsNewestFirst(auditIds: string[]) {
  return [...auditIds].sort((left, right) => {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return rightNumber - leftNumber;
    }
    return right.localeCompare(left);
  });
}

function getAuditCountFromRaw(result: unknown): number {
  const rawCount = unquoteString(coerceString(result));
  const count = Number(rawCount);
  if (rawCount === "" || !Number.isInteger(count) || count < 0) {
    throw new Error(`Invalid Soothmark audit count response: ${safeStringify(result)}`);
  }
  return count;
}

export function isSoothmarkRateLimitError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();
  return lowerMessage.includes("rate limit exceeded") || (lowerMessage.includes("gen_call") && lowerMessage.includes("rate"));
}

async function readSoothmarkContract(functionName: string, args: CalldataEncodable[]): Promise<unknown> {
  const key = JSON.stringify([functionName, args]);
  const existingRead = inFlightContractReads.get(key);
  if (existingRead) {
    logContractReadStarted(functionName, args, true);
    if (["get_audit_count", "get_audit_owner", "get_audit", "get_audit_ids_by_owner", "get_my_audit_ids"].includes(functionName)) {
      logDashboardRpc("[Dashboard RPC] skipped because request already in flight", { method: functionName, params: args });
    }
    return existingRead;
  }

  logContractReadStarted(functionName, args);
  const readPromise = createReadClient()
    .readContract({
      address: requireSoothmarkContractAddress(),
      functionName,
      args,
    })
    .catch((error: unknown) => {
      if (isSoothmarkRateLimitError(error)) {
        soothmarkDebug("[Soothmark read] rate limited:", { method: functionName, params: args, error });
      }
      throw error;
    })
    .finally(() => {
      inFlightContractReads.delete(key);
      logContractReadFinished(functionName, args);
    });

  inFlightContractReads.set(key, readPromise);
  return readPromise;
}

function isLikelyTransactionHash(value: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(value.trim());
}

function extractTransactionHash(value: unknown, depth = 0): string {
  const asString = coerceString(value);
  if (isLikelyTransactionHash(asString)) {
    return asString;
  }

  if (!value || typeof value !== "object" || depth >= 4) {
    return "";
  }

  const record = value as Record<string, unknown>;
  for (const key of ["hash", "transactionHash", "txHash", "id", "value", "result", "data", "response"]) {
    if (key in record) {
      const nestedHash = extractTransactionHash(record[key], depth + 1);
      if (nestedHash !== "") {
        return nestedHash;
      }
    }
  }

  return "";
}

function isPlausibleAuditId(value: string): boolean {
  return /^(mock-\d+|\d+)$/.test(value.trim());
}

function extractAuditIdCandidate(value: unknown): string {
  const candidate = unquoteString(coerceString(value));
  if (candidate === "" || isLikelyTransactionHash(candidate) || !isPlausibleAuditId(candidate)) {
    return "";
  }
  return candidate;
}

function extractAuditIdFromSubmitValue(value: unknown, depth = 0): string {
  const directCandidate = extractAuditIdCandidate(value);
  if (directCandidate !== "") {
    return directCandidate;
  }

  if (!value || typeof value !== "object" || depth >= 4) {
    return "";
  }

  const record = value as Record<string, unknown>;
  for (const key of ["value", "result", "returnValue", "data", "response", "output"]) {
    if (key in record) {
      const nestedCandidate = extractAuditIdFromSubmitValue(record[key], depth + 1);
      if (nestedCandidate !== "") {
        return nestedCandidate;
      }
    }
  }

  return "";
}

function normalizeAuditResponse(rawAudit: unknown, auditId?: string, depth = 0): SoothmarkAudit | null {
  const debug: AuditResponseDebug = {
    auditId,
    rawType: getRawType(rawAudit),
    rawWasEmpty: rawAudit === null || rawAudit === undefined || rawAudit === "",
    jsonParseFailed: false,
    schemaValidationFailed: false,
  };

  if (depth === 0) {
    soothmarkDebug("[Soothmark getAudit] raw:", rawAudit);
    soothmarkDebug("[Soothmark getAudit] raw type:", debug.rawType);
    soothmarkDebug("[Soothmark getAudit] raw json:", safeStringify(rawAudit));
  }

  if (rawAudit === null || rawAudit === undefined) {
    lastAuditResponseDebug = debug;
    return null;
  }

  if (typeof rawAudit === "string") {
    const auditText = unquoteString(rawAudit);
    if (auditText === "") {
      lastAuditResponseDebug = debug;
      return null;
    }

    try {
      const parsed = JSON.parse(auditText) as unknown;
      return normalizeAuditResponse(parsed, auditId, depth + 1);
    } catch (error) {
      debug.jsonParseFailed = true;
      debug.schemaErrorMessage = error instanceof Error ? error.message : String(error);
      lastAuditResponseDebug = debug;
      soothmarkError("[Soothmark getAudit] JSON parse failed.", {
        auditId,
        rawAudit,
        auditText,
        error,
      });
      return null;
    }
  }

  if (typeof rawAudit === "object") {
    const parsed = safeParseSoothmarkAudit(rawAudit);
    if (parsed.success) {
      lastAuditResponseDebug = debug;
      soothmarkDebug("[Soothmark getAudit] normalized audit:", parsed.data);
      return parsed.data;
    }

    if (depth < 4) {
      const record = rawAudit as Record<string, unknown>;
      for (const key of ["value", "result", "data", "response", "calldata"]) {
        if (key in record) {
          const normalized = normalizeAuditResponse(record[key], auditId, depth + 1);
          if (normalized) {
            return normalized;
          }
        }
      }
    }

    debug.schemaValidationFailed = true;
    debug.schemaErrorMessage = parsed.error.message;
    lastAuditResponseDebug = debug;
    soothmarkError("[Soothmark getAudit] schema validation failed.", {
      auditId,
      rawAudit,
      schemaError: parsed.error.flatten(),
    });
    return null;
  }

  debug.schemaValidationFailed = true;
  debug.schemaErrorMessage = `Unsupported audit response type: ${typeof rawAudit}`;
  lastAuditResponseDebug = debug;
  return null;
}

export function getLastSoothmarkAuditResponseDebug(auditId?: string): AuditResponseDebug | null {
  if (!auditId || !lastAuditResponseDebug?.auditId || lastAuditResponseDebug.auditId === auditId) {
    return lastAuditResponseDebug;
  }
  return null;
}

export function getLastSoothmarkSubmissionMeta(auditId?: string): SoothmarkSubmissionMeta | null {
  if (!auditId || !lastSubmissionMeta?.auditId || lastSubmissionMeta.auditId === auditId) {
    return lastSubmissionMeta;
  }
  return null;
}

function assertReceiptSucceeded(receipt: Awaited<ReturnType<ReturnType<typeof createReadClient>["waitForTransactionReceipt"]>>) {
  if (receipt.txExecutionResultName === ExecutionResult.FINISHED_WITH_ERROR) {
    throw new Error("Audit submission failed. Please try again.");
  }
}

function extractAuditIdFromReceipt(receipt: unknown): string {
  if (!receipt || typeof receipt !== "object") {
    return "";
  }

  const receiptRecord = receipt as Record<string, unknown>;
  const candidates = [
    receiptRecord.result,
    receiptRecord.returnValue,
    receiptRecord.calldata,
    receiptRecord.data,
  ];

  const consensusData = receiptRecord.consensus_data;
  if (consensusData && typeof consensusData === "object") {
    const leaderReceipts = (consensusData as Record<string, unknown>).leader_receipt;
    if (Array.isArray(leaderReceipts)) {
      for (const leaderReceipt of leaderReceipts) {
        if (leaderReceipt && typeof leaderReceipt === "object") {
          const leaderRecord = leaderReceipt as Record<string, unknown>;
          candidates.push(leaderRecord.result, leaderRecord.returnValue, leaderRecord.calldata);
        }
      }
    }
  }

  for (const candidate of candidates) {
    const auditId = extractAuditIdFromSubmitValue(candidate);
    if (auditId !== "") {
      return auditId;
    }
  }

  return "";
}

function isWalletRejection(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes("user rejected") || message.includes("user denied") || message.includes("rejected the request") || message.includes("4001");
}

function isUnsupportedSnapError(error: unknown) {
  const maybeError = error as { code?: unknown; message?: unknown };
  const message = typeof maybeError?.message === "string" ? maybeError.message : String(error);
  return maybeError?.code === -32601 && message.includes("wallet_getSnaps");
}

const realClient = {
  async submitAudit(contractCode: string): Promise<string> {
    if (contractCode.trim() === "") {
      throw new Error("Contract code is required.");
    }

    const address = requireSoothmarkContractAddress();
    soothmarkTrace("submit", "contract address", address);
    soothmarkTrace("submit", "chain", soothmarkContractConfig.chainName);
    soothmarkTrace("submit", "rpc endpoint", soothmarkContractConfig.endpoint);
    soothmarkTrace("submit", "expected receipt status", soothmarkContractConfig.receiptStatus);
    const writeClient = await createWriteClient();
    const readClient = createReadClient();
    const provider = getBrowserWalletProvider();
    if (!provider) {
      throw new Error("Connect your wallet to submit an on-chain audit.");
    }
    const owner = await getConnectedWalletAddress(provider);

    let submitResult: unknown;
    try {
      submitResult = await writeClient.writeContract({
        address,
        functionName: "audit_contract",
        args: [contractCode],
        value: BigInt(0),
      });
    } catch (error) {
      if (isWalletRejection(error)) {
        throw new Error("Transaction was rejected in your wallet.");
      }
      if (isUnsupportedSnapError(error)) {
        soothmarkWarn("Wallet does not support MetaMask Snaps. Continuing without Snap features.", error);
        throw new Error("Audit submission failed before the contract call because the wallet provider attempted an unsupported Snap request.");
      }
      throw new Error("Audit submission failed. Please try again.");
    }

    soothmarkDebug("[Soothmark submit] raw result:", submitResult);
    soothmarkTrace("submit", "raw submit result", submitResult);

    let auditId = extractAuditIdFromSubmitValue(submitResult);
    const txHashText = extractTransactionHash(submitResult);
    if (txHashText !== "") {
      soothmarkDebug("[Soothmark tx] txHash:", txHashText);
      soothmarkTrace("submit", "tx hash", txHashText);
      lastSubmissionMeta = {
        transactionHash: txHashText,
        explorerUrl: getSoothmarkTransactionExplorerUrl(txHashText),
      };
    }

    if (isLikelyTransactionHash(txHashText)) {
      const receipt = await readClient.waitForTransactionReceipt({
        hash: txHashText as TransactionHash,
        status: getReceiptStatus(),
        retries: 240,
      });

      assertReceiptSucceeded(receipt);
      auditId = extractAuditIdFromReceipt(receipt);
      soothmarkDebug("[Soothmark tx] accepted/confirmed");
      soothmarkTrace("submit", "tx accepted", {
        expectedReceiptStatus: soothmarkContractConfig.receiptStatus,
        txExecutionResultName: receipt.txExecutionResultName,
      });
    }

    if (auditId === "") {
      // Development fallback only: this assumes this transaction receives the next audit ID.
      // Production-safe flow should use the actual audit_contract return value or an emitted event.
      try {
        const fallbackCount = await realClient.getAuditCount();
        auditId = String(Math.max(0, fallbackCount - 1));
        soothmarkWarn("Using post-submit audit count as the submitted audit ID fallback. This is unsafe for simultaneous submissions.", {
          auditId,
          fallbackCount,
          owner,
        });
      } catch (error) {
        if (isSoothmarkRateLimitError(error)) {
          soothmarkWarn("Could not read fallback audit count because GenLayer RPC is rate-limiting reads.", error);
        } else {
          throw error;
        }
      }
    }

    if (auditId === "") {
      throw new Error("Your audit was submitted, but the audit ID is not available yet. Check your dashboard again in a few minutes.");
    }

    lastSubmissionMeta = {
      ...lastSubmissionMeta,
      auditId,
    };
    soothmarkDebug("[Soothmark tx] auditId:", auditId);
    soothmarkDebug("[Soothmark submit] interpreted auditId:", auditId);
    soothmarkTrace("submit", "resolved auditId", auditId);
    return auditId;
  },

  async getAudit(auditId: string): Promise<SoothmarkAudit | null> {
    if (auditId.trim() === "") {
      return null;
    }

    const result = await readSoothmarkContract("get_audit", [auditId]);

    soothmarkDebug("[Soothmark getAudit] auditId:", auditId);
    soothmarkDebug("[Soothmark getAudit] raw response:", result);
    soothmarkDebug("[Soothmark getAudit] raw type:", typeof result);
    const normalized = normalizeAuditResponse(result, auditId);
    logContractRead("get_audit", [auditId], result, normalized);
    return normalized;
  },

  async getAuditCount(): Promise<number> {
    try {
      const result = await readSoothmarkContract("get_audit_count", []);
      const normalized = getAuditCountFromRaw(result);
      logContractRead("get_audit_count", [], result, normalized);
      return normalized;
    } catch (error) {
      if (isSoothmarkRateLimitError(error)) {
        throw error;
      }
      soothmarkError("Could not load Soothmark audit count.", error);
      return 0;
    }
  },

  async getLastAuditId(): Promise<string> {
    const result = await readSoothmarkContract("get_last_audit_id", []);
    const normalized = unquoteString(coerceString(result));
    logContractRead("get_last_audit_id", [], result, normalized);
    return normalized;
  },

  async getLastAudit(): Promise<SoothmarkAudit | null> {
    const result = await readSoothmarkContract("get_last_audit", []);
    soothmarkDebug("Soothmark raw getLastAudit response.", { rawAudit: result });
    const normalized = normalizeAuditResponse(result);
    logContractRead("get_last_audit", [], result, normalized);
    return normalized;
  },

  async getAuditOwner(auditId: string): Promise<string> {
    if (auditId.trim() === "") {
      return "";
    }

    try {
      const result = await readSoothmarkContract("get_audit_owner", [auditId]);
      const normalized = unquoteString(coerceString(result));
      logContractRead("get_audit_owner", [auditId], result, normalized);
      return normalized;
    } catch (error) {
      if (isSoothmarkRateLimitError(error)) {
        throw error;
      }
      soothmarkError(`Could not load Soothmark audit owner for ${auditId}.`, error);
      return "";
    }
  },

  async getAuditIdsByOwner(owner: string): Promise<string[]> {
    if (owner.trim() === "") {
      return [];
    }

    try {
      const result = await readSoothmarkContract("get_audit_ids_by_owner", [owner]);
      const normalized = parseAuditIdsByOwner(result);
      logContractRead("get_audit_ids_by_owner", [owner], result, normalized);
      return normalized;
    } catch (error) {
      if (isSoothmarkRateLimitError(error)) {
        throw error;
      }
      soothmarkError(`Could not load Soothmark audit IDs for ${owner}.`, error);
      return [];
    }
  },

  async getMyAuditIds(): Promise<string[]> {
    try {
      const result = await readSoothmarkContract("get_my_audit_ids", []);
      const normalized = parseAuditIdsByOwner(result);
      logContractRead("get_my_audit_ids", [], result, normalized);
      return normalized;
    } catch (error) {
      if (isSoothmarkRateLimitError(error)) {
        throw error;
      }
      soothmarkError("Could not load Soothmark audit IDs for the connected wallet.", error);
      return [];
    }
  },

  async getMyAudits(walletAddress: string): Promise<OwnedAudit[]> {
    const normalizedWalletAddress = walletAddress.trim().toLowerCase();
    if (normalizedWalletAddress === "") {
      return [];
    }

    logDashboardRpc("[Soothmark dashboard] wallet address", walletAddress);
    soothmarkTrace("dashboard", "connected wallet", walletAddress);
    soothmarkTrace("dashboard", "contract address", soothmarkContractConfig.address);
    logDashboardRpc("[Soothmark dashboard] getAuditCount start");
    soothmarkTrace("dashboard", "getAuditCount start");

    let auditCount = 0;
    try {
      const countResult = await readSoothmarkContract("get_audit_count", []);
      auditCount = getAuditCountFromRaw(countResult);
      logContractRead("get_audit_count", [], countResult, auditCount);
      logDashboardRpc("[Soothmark dashboard] getAuditCount result", auditCount);
      soothmarkTrace("dashboard", "getAuditCount result", auditCount);
    } catch (error) {
      logDashboardRpc("[Soothmark dashboard] read failed", { method: "getAuditCount", error });
      soothmarkTrace("dashboard", "read failed", { method: "getAuditCount", error });
      throw error;
    }

    const auditIds = sortAuditIdsNewestFirst(
      Array.from({ length: auditCount }, (_item, index) => String(index)),
    );
    soothmarkTrace("dashboard", "scanning id range", {
      count: auditCount,
      ids: auditIds,
      from: auditCount > 0 ? "0" : null,
      to: auditCount > 0 ? String(auditCount - 1) : null,
    });
    const ownedAudits: OwnedAudit[] = [];

    for (const auditId of auditIds) {
      if (!/^\d+$/.test(auditId)) {
        logDashboardRpc("[Soothmark dashboard] skipped invalid auditId", auditId);
        soothmarkTrace("dashboard", "read failed", { method: "auditIdValidation", auditId, error: "Invalid audit ID" });
        continue;
      }

      logDashboardRpc("[Soothmark dashboard] getAuditOwner start", { auditId });
      soothmarkTrace("dashboard", "getAuditOwner start", { auditId });
      let owner = "";
      try {
        const ownerResult = await readSoothmarkContract("get_audit_owner", [auditId]);
        owner = unquoteString(coerceString(ownerResult));
        logContractRead("get_audit_owner", [auditId], ownerResult, owner);
        logDashboardRpc("[Soothmark dashboard] getAuditOwner result", { auditId, owner });
        soothmarkTrace("dashboard", "getAuditOwner result", { auditId, owner });
      } catch (error) {
        logDashboardRpc("[Soothmark dashboard] read failed", { method: "getAuditOwner", auditId, error });
        soothmarkTrace("dashboard", "read failed", { method: "getAuditOwner", auditId, error });
        if (isSoothmarkRateLimitError(error)) {
          throw error;
        }
        continue;
      }

      const normalizedOwner = owner.trim().toLowerCase();
      const ownerMatches = normalizedOwner !== "" && normalizedOwner === normalizedWalletAddress;
      soothmarkTrace("dashboard", "owner match result", {
        auditId,
        owner,
        walletAddress,
        matched: ownerMatches,
      });

      if (!ownerMatches) {
        if (auditId !== auditIds[auditIds.length - 1]) {
          await delay(120);
        }
        continue;
      }

      logDashboardRpc("[Soothmark dashboard] getAudit start", { auditId });
      soothmarkTrace("dashboard", "getAudit start", { auditId });
      try {
        const auditResult = await readSoothmarkContract("get_audit", [auditId]);
        soothmarkTrace("dashboard", "getAudit raw result", {
          auditId,
          raw: auditResult,
        });
        const audit = normalizeAuditResponse(auditResult, auditId);
        logContractRead("get_audit", [auditId], auditResult, audit);
        soothmarkTrace("dashboard", "getAudit debug result", {
          auditId,
          debug: getLastSoothmarkAuditResponseDebug(auditId),
        });
        soothmarkTrace("dashboard", "normalized dashboard audit", {
          auditId,
          loaded: Boolean(audit),
          audit,
        });
        logDashboardRpc("[Soothmark dashboard] getAudit result", { auditId, loaded: Boolean(audit) });
        if (audit) {
          ownedAudits.push({ auditId, owner, audit });
        }
      } catch (error) {
        logDashboardRpc("[Soothmark dashboard] read failed", { method: "getAudit", auditId, error });
        soothmarkTrace("dashboard", "read failed", { method: "getAudit", auditId, error });
        if (isSoothmarkRateLimitError(error)) {
          throw error;
        }
      }

      if (auditId !== auditIds[auditIds.length - 1]) {
        await delay(120);
      }
    }

    return ownedAudits;
  },
};

export const soothmarkClient = soothmarkContractConfig.useMocks ? mockClient : realClient;
