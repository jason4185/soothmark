import type { SoothmarkAudit } from "@/types/audit";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { cn, mechanismLabels } from "@/lib/utils";

type AuditResultStampProps = {
  audit: SoothmarkAudit;
  className?: string;
};

const stampClasses: Record<SoothmarkAudit["classification"], string> = {
  certified: "border-certified/30 bg-[var(--certified-soft)]",
  conditional: "border-conditional/30 bg-[var(--conditional-soft)]",
  rejected: "border-rejected/30 bg-[var(--rejected-soft)]",
};

export function AuditResultStamp({ audit, className }: AuditResultStampProps) {
  return (
    <div className={cn("rounded-2xl border p-4 shadow-[0_14px_34px_rgb(90_70_42_/_0.06)]", stampClasses[audit.classification], className)}>
      <ClassificationBadge classification={audit.classification} />
      <p className="mt-3 text-sm font-semibold text-text-main">Soothmark state-safety audit</p>
      <div className="mt-3 space-y-1 text-xs leading-5 text-text-muted">
        <p>Scope: Nondeterministic state safety</p>
        <p>Mechanism: <span className="text-text-main">{mechanismLabels[audit.validation.mechanism]}</span></p>
      </div>
    </div>
  );
}
