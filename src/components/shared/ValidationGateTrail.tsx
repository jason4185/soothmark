import type { AuditClassification } from "@/types/audit";
import { cn } from "@/lib/utils";

type ValidationGateTrailProps = {
  status?: AuditClassification;
  activeStep?: number;
  compact?: boolean;
  className?: string;
};

const steps = [
  { label: "Intent", compactLabel: "Intent", marker: "I" },
  { label: "Nondeterminism", compactLabel: "Nondet", marker: "N" },
  { label: "State Impact", compactLabel: "State", marker: "S" },
  { label: "Verification Check", compactLabel: "Check", marker: "C" },
  { label: "Result", compactLabel: "Result", marker: "R" },
];

const statusClasses: Record<AuditClassification, string> = {
  certified: "border-certified bg-[var(--certified-soft)] text-certified",
  conditional: "border-conditional bg-[var(--conditional-soft)] text-conditional",
  rejected: "border-rejected bg-[var(--rejected-soft)] text-rejected",
};

export function ValidationGateTrail({ status = "certified", activeStep = 4, compact = false, className }: ValidationGateTrailProps) {
  return (
    <div className={cn("validation-gate-trail rounded-xl border border-border/70 bg-surface-soft/70 px-3 py-3", className)}>
      <div className="relative">
        <div className="absolute left-4 right-4 top-3 h-px bg-gradient-to-r from-primary/20 via-primary/45 to-primary/20" />
        <div className="validation-gate-trail__trace absolute left-4 right-4 top-3 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="relative z-10 grid grid-cols-5 gap-1.5">
          {steps.map((step, index) => {
            const isCheck = step.label === "Verification Check";
            const isResult = step.label === "Result";
            const isActive = index <= activeStep;
            return (
              <div key={step.label} className="flex min-w-0 flex-col items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center border bg-surface text-[0.58rem] font-semibold text-text-muted transition",
                    isCheck ? "rotate-45 rounded-[4px] border-primary/40 text-primary" : "rounded-full border-border",
                    isResult && statusClasses[status],
                    isActive && !isResult && "border-primary/40 bg-primary-soft text-primary",
                  )}
                >
                  <span className={cn(isCheck && "-rotate-45")}>{compact ? step.marker : index + 1}</span>
                </span>
                <span className={cn("truncate font-medium text-text-muted", compact ? "text-[0.62rem]" : "text-[0.68rem]")}>
                  {compact ? step.compactLabel : step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
