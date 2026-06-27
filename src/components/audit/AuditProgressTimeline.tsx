"use client";

import { CheckCircle2, CircleDot, ExternalLink, FileCheck, GitCompareArrows, Loader2, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { ValidationGateTrail } from "@/components/shared/ValidationGateTrail";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const auditSteps = [
  {
    label: "Transaction submitted",
    helper: "Your audit request was sent to GenLayer.",
    icon: <Send className="h-3.5 w-3.5" />,
  },
  {
    label: "Consensus in progress",
    helper: "Leader proposal and validator verification are running.",
    icon: <CircleDot className="h-3.5 w-3.5" />,
  },
  {
    label: "Checking stored report",
    helper: "Soothmark is polling the contract for your audit result.",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  {
    label: "Report finalizing",
    helper: "The audit report will appear here once available.",
    icon: <FileCheck className="h-3.5 w-3.5" />,
  },
];

type AuditProgressTimelineProps = {
  currentStep: number;
  isComplete?: boolean;
  elapsedSeconds?: number;
  explorerUrl?: string;
  isChecking?: boolean;
  isTimedOut?: boolean;
  showCheckAgain?: boolean;
  onCheckAgain?: () => void;
  className?: string;
};

function formatElapsed(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function AuditProgressTimeline({
  currentStep,
  isComplete = false,
  elapsedSeconds = 0,
  explorerUrl,
  isChecking = false,
  isTimedOut = false,
  showCheckAgain = false,
  onCheckAgain,
  className,
}: AuditProgressTimelineProps) {
  const panelTitle = isComplete ? "Report ready" : isTimedOut ? "Report still finalizing" : "Audit in progress";
  const panelDescription = isTimedOut
    ? "Your transaction was submitted, but the audit report is not available in the app yet."
    : "Transaction accepted. Soothmark is looking for the new audit report owned by your wallet.";

  return (
    <div className={cn("rounded-lg border border-border/80 bg-surface-soft p-4", className)}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-text-main">{panelTitle}</p>
          {!isComplete && (
            <p className="mt-1 text-sm text-text-muted">{panelDescription}</p>
          )}
          {!isComplete && !isTimedOut && (
            <p className="mt-1 text-xs text-text-muted">This can take a short while after on-chain acceptance.</p>
          )}
          <p className="mt-1 text-xs text-text-muted">Intent → nondeterminism → state impact → verification check → result</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isComplete && (
            <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-text-muted">
              Elapsed: {formatElapsed(elapsedSeconds)}
            </span>
          )}
          {explorerUrl ? (
            <Button asChild variant="outline" size="sm" className="border-primary/25 bg-surface text-primary hover:bg-primary-soft">
              <a href={explorerUrl} target="_blank" rel="noreferrer">
                Open in explorer
                <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          ) : !isComplete ? (
            <span className="text-xs text-text-soft">Explorer link will appear after submission.</span>
          ) : null}
        </div>
      </div>
      <ValidationGateTrail activeStep={isComplete ? 4 : currentStep} compact={false} className="mb-4" />
      <div className="space-y-3">
        {auditSteps.map((step, index) => {
          const isDone = isComplete || index < currentStep;
          const isCurrent = !isComplete && !isTimedOut && index === currentStep;
          const isWaiting = isTimedOut && index === currentStep;
          return (
            <div key={step.label} className="flex items-center gap-3">
              <motion.span
                animate={isCurrent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={isCurrent ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : undefined}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                  isDone && "border-certified/50 bg-[var(--certified-soft)] text-certified shadow-[0_0_24px_rgb(22_163_74_/_0.08)]",
                  isCurrent && "border-primary/60 bg-primary-soft text-primary shadow-[0_0_24px_rgb(91_140_255_/_0.18)]",
                  isWaiting && "border-primary/30 bg-primary-soft/50 text-primary",
                  !isDone && !isCurrent && !isWaiting && "border-border/80 bg-surface-soft/60 text-text-muted/70",
                )}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : isCurrent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitCompareArrows className="h-3.5 w-3.5" />}
              </motion.span>
              <span className="min-w-0">
                <span className={cn("block text-sm", isDone || isCurrent ? "text-text-main" : "text-text-muted")}>{step.label}</span>
                <span className="block text-xs text-text-muted">{step.helper}</span>
              </span>
            </div>
          );
        })}
      </div>
      {!isComplete && (
        <div className="mt-4 rounded-lg border border-border/70 bg-surface px-4 py-3 text-xs leading-5 text-text-muted">
          <p>On-chain audits may take several minutes as GenLayer’s Optimistic Democracy processes the audit transaction through leader proposal, validator verification, and finality.</p>
          <p className="mt-2">GenLayer audits can take several minutes. You can keep this page open while the report finalizes.</p>
          {(showCheckAgain || isTimedOut) && onCheckAgain && (
            <Button type="button" variant="outline" size="sm" className="mt-3 border-border bg-surface text-text-main hover:bg-surface-soft" onClick={onCheckAgain} disabled={isChecking}>
              <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isChecking && "animate-spin")} />
              {isChecking ? "Checking..." : "Check again"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
