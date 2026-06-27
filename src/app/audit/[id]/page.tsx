"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { SoothmarkAudit } from "@/types/audit";
import { AuditReportView } from "@/components/report/AuditReportView";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { soothmarkDebug } from "@/lib/debug";
import { getLastSoothmarkAuditResponseDebug, isSoothmarkRateLimitError, soothmarkClient, type AuditResponseDebug } from "@/lib/soothmarkClient";

type LoadState = "loading" | "pending" | "ready" | "not-found" | "error";

const reportPollTimeoutMs = 2 * 60 * 1000;

function getReportPollingDelayMs(attempt: number, startedAt: number, wasRateLimited: boolean) {
  if (wasRateLimited) {
    return 45_000;
  }

  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs < 30_000) {
    return 10_000;
  }
  return attempt < 5 ? 10_000 : 20_000;
}

export default function AuditReportPage() {
  const params = useParams<{ id: string }>();
  const auditId = params.id;
  const [audit, setAudit] = useState<SoothmarkAudit | null>(null);
  const [owner, setOwner] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [debug, setDebug] = useState<AuditResponseDebug | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadAudit() {
      try {
        setAudit(null);
        setOwner("");
        setDebug(null);
        setLoadState("loading");
        soothmarkDebug("Loading Soothmark audit report route.", { route: `/audit/${auditId}`, auditId });

        const startedAt = Date.now();
        let wasRateLimited = false;
        for (let attempt = 0; Date.now() - startedAt < reportPollTimeoutMs; attempt += 1) {
          soothmarkDebug("[Soothmark read] method:", "audit_report_route");
          soothmarkDebug("[Soothmark read] params:", { auditId, attempt: attempt + 1 });
          let nextAudit: SoothmarkAudit | null = null;
          try {
            nextAudit = await soothmarkClient.getAudit(auditId);
            wasRateLimited = false;
          } catch (error) {
            if (isSoothmarkRateLimitError(error)) {
              wasRateLimited = true;
              setLoadState("pending");
              soothmarkDebug("[Soothmark read] rate limited:", { method: "get_audit", params: [auditId], error });
              const nextDelayMs = getReportPollingDelayMs(attempt, startedAt, true);
              soothmarkDebug("[Soothmark polling] next retry in:", nextDelayMs);
              await new Promise((resolve) => setTimeout(resolve, nextDelayMs));
              continue;
            }
            throw error;
          }
          if (!isMounted) {
            return;
          }

          if (nextAudit) {
            const nextOwner = await soothmarkClient.getAuditOwner(auditId);
            if (!isMounted) {
              return;
            }
            setAudit(nextAudit);
            setOwner(nextOwner);
            setDebug(null);
            setLoadState("ready");
            return;
          }

          const nextDebug = getLastSoothmarkAuditResponseDebug(auditId);
          setDebug(nextDebug);
          if (nextDebug && !nextDebug.rawWasEmpty && (nextDebug.jsonParseFailed || nextDebug.schemaValidationFailed)) {
            setLoadState("error");
            return;
          }

          soothmarkDebug("Soothmark audit report route is still pending.", {
            auditId,
            attempt: attempt + 1,
            timeoutMs: reportPollTimeoutMs,
          });

          setLoadState("pending");
          const nextDelayMs = getReportPollingDelayMs(attempt, startedAt, wasRateLimited);
          soothmarkDebug("[Soothmark polling] next retry in:", nextDelayMs);
          await new Promise((resolve) => setTimeout(resolve, nextDelayMs));
        }

        if (isMounted) {
          setDebug(getLastSoothmarkAuditResponseDebug(auditId));
          setLoadState("not-found");
        }
      } catch (error) {
        if (isSoothmarkRateLimitError(error)) {
          soothmarkDebug("GenLayer RPC is rate-limiting Soothmark report reads.", { auditId, error });
        } else {
          soothmarkDebug("Could not load Soothmark audit report.", { auditId, error });
        }
        if (isMounted) {
          setDebug(getLastSoothmarkAuditResponseDebug(auditId));
          setLoadState(isSoothmarkRateLimitError(error) ? "pending" : "error");
        }
      }
    }

    loadAudit();

    return () => {
      isMounted = false;
    };
  }, [auditId, refreshNonce]);

  if (loadState === "loading" || loadState === "pending") {
    const isPending = loadState === "pending";
    return (
      <main className="min-h-screen px-6 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-text-muted" aria-live="polite">
            {isPending ? "Audit report is still being loaded from the contract. GenLayer audits may take several minutes to complete." : "Loading audit report..."}
          </p>
          {isPending && (
            <Button type="button" variant="outline" className="mt-4 border-border bg-surface text-text-main hover:bg-surface-soft" onClick={() => setRefreshNonce((value) => value + 1)}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Retry loading
            </Button>
          )}
          <div className="mt-8 rounded-xl border border-border/90 bg-surface p-6 shadow-[0_16px_44px_rgb(90_70_42_/_0.06)]">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-4 h-4 w-full max-w-xl" />
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              <Skeleton className="h-44" />
              <Skeleton className="h-44" />
              <Skeleton className="h-44" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (loadState === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="max-w-md rounded-xl border border-border/90 bg-surface p-6 text-center shadow-[0_16px_44px_rgb(90_70_42_/_0.06)]" role="alert">
          <h1 className="text-3xl font-semibold text-text-main">Unable to load audit</h1>
          <p className="mt-3 text-sm leading-6 text-text-muted">We could not load the latest contract data yet. Try refreshing.</p>
          <AuditDebugPanel auditId={auditId} debug={debug} />
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button type="button" variant="outline" className="border-border bg-surface text-text-main hover:bg-surface-soft" onClick={() => setRefreshNonce((value) => value + 1)}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Retry loading
            </Button>
            <Link href="/" className="inline-flex text-sm font-medium text-primary hover:text-primary/75">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (loadState === "not-found" || !audit) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="max-w-md rounded-xl border border-border/90 bg-surface p-6 text-center shadow-[0_24px_70px_rgb(90_70_42_/_0.1)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Audit not found</p>
          <h1 className="mt-3 text-3xl font-semibold text-text-main">Audit not found</h1>
          <p className="mt-3 text-sm leading-6 text-text-muted">We could not load this audit report yet. The transaction may still be pending or the audit ID may be invalid.</p>
          <AuditDebugPanel auditId={auditId} debug={debug} />
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button type="button" variant="outline" className="border-border bg-surface text-text-main hover:bg-surface-soft" onClick={() => setRefreshNonce((value) => value + 1)}>
              <RefreshCw className="mr-1.5 h-4 w-4" />
              Retry loading
            </Button>
            <Link href="/" className="inline-flex text-sm font-medium text-primary hover:text-primary/75">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <AuditReportView auditId={auditId} audit={audit} owner={owner} />;
}

function AuditDebugPanel({ auditId, debug }: { auditId: string; debug: AuditResponseDebug | null }) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="mt-5 rounded-lg border border-border bg-surface-soft p-3 text-left text-xs text-text-muted">
      <p className="font-medium text-text-main">Development audit load debug</p>
      <dl className="mt-3 space-y-1">
        <div className="flex justify-between gap-3">
          <dt>auditId</dt>
          <dd className="font-mono text-text-main">{auditId}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>raw type</dt>
          <dd className="font-mono text-text-main">{debug?.rawType ?? "unknown"}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>empty response</dt>
          <dd className="font-mono text-text-main">{String(debug?.rawWasEmpty ?? false)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>JSON parse failed</dt>
          <dd className="font-mono text-text-main">{String(debug?.jsonParseFailed ?? false)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>schema failed</dt>
          <dd className="font-mono text-text-main">{String(debug?.schemaValidationFailed ?? false)}</dd>
        </div>
      </dl>
      {debug?.schemaErrorMessage && (
        <pre className="mt-3 max-h-40 overflow-auto rounded-md bg-surface px-3 py-2 font-mono text-[11px] leading-5 text-text-muted">
          {debug.schemaErrorMessage}
        </pre>
      )}
    </div>
  );
}
