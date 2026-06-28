"use client";

import { Database, GitCompareArrows, Waves } from "lucide-react";
import type { SoothmarkAudit } from "@/types/audit";
import { AuditResultStamp } from "@/components/audit/AuditResultStamp";
import { RawJsonDrawer } from "@/components/audit/RawJsonDrawer";
import { SoothmarkCheckedList } from "@/components/audit/SoothmarkCheckedList";
import { StatusCard } from "@/components/shared/StatusCard";
import { ValidationGateTrail } from "@/components/shared/ValidationGateTrail";
import { cn, mechanismLabels } from "@/lib/utils";

const verdictCopy: Record<SoothmarkAudit["classification"], string> = {
  certified: "Passed Soothmark’s validation/equivalence audit.",
  conditional: "Requires closer review before relying on the validation path.",
  rejected: "Failed Soothmark’s validation/equivalence audit.",
};

type AuditResultSummaryProps = {
  audit: SoothmarkAudit;
  auditId?: string;
  className?: string;
};

function presentLabel(value: boolean) {
  return value ? "Present" : "Not present";
}

function EvidenceList({ evidence }: { evidence: string[] }) {
  if (evidence.length === 0) {
    return <p className="mt-3 text-sm text-text-muted">No evidence reported.</p>;
  }

  return (
    <ul className="mt-3 space-y-2">
      {evidence.map((item) => (
        <li key={item} className="break-words rounded-md border border-border/60 bg-surface-soft px-3 py-2 font-mono text-xs leading-5 text-text-muted">
          {item}
        </li>
      ))}
    </ul>
  );
}

function mainReason(audit: SoothmarkAudit) {
  if (audit.recommendations[0]) {
    return audit.recommendations[0];
  }
  if (audit.validation.explanation) {
    return audit.validation.explanation;
  }
  return audit.nondeterminism.present
    ? "Soothmark evaluated whether the nondeterministic path is protected before state changes."
    : "No executable nondeterminism was reported, so a verification check is not required for on-chain contract data.";
}

export function AuditResultSummary({ audit, auditId, className }: AuditResultSummaryProps) {
  return (
    <div className={cn("rounded-xl border border-border/90 bg-surface p-5 shadow-[0_24px_70px_rgb(90_70_42_/_0.1)]", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">{auditId ?? "Mock audit"}</p>
          <h3 className="mt-2 text-2xl font-semibold text-text-main">Soothmark result</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">{verdictCopy[audit.classification]}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-main">
            <span className="font-medium">Main reason:</span> {mainReason(audit)}
          </p>
        </div>
        <AuditResultStamp audit={audit} className="sm:min-w-64" />
      </div>

      <ValidationGateTrail status={audit.classification} className="mt-5" />
      <SoothmarkCheckedList className="mt-5" />

      <div className="mt-5 rounded-lg border border-border/70 bg-surface-soft p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Intent</p>
        <p className="mt-2 text-sm leading-6 text-text-main">{audit.intent}</p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <StatusCard icon={<Waves />} title="Nondeterminism" value={presentLabel(audit.nondeterminism.present)}>
          <EvidenceList evidence={audit.nondeterminism.evidence} />
        </StatusCard>
        <StatusCard icon={<Database />} title="State impact" value={presentLabel(audit.state_impact.present)}>
          <EvidenceList evidence={audit.state_impact.evidence} />
        </StatusCard>
        <StatusCard icon={<GitCompareArrows />} iconTone="primary" title="Verification Check" value={mechanismLabels[audit.validation.mechanism]} description={audit.validation.explanation}>
          <EvidenceList evidence={audit.validation.evidence} />
        </StatusCard>
      </div>

      <div className="mt-5 rounded-lg border border-border/70 bg-surface-soft p-4">
        <p className="text-sm font-medium text-text-main">Recommendations</p>
        {audit.recommendations.length === 0 ? (
          <p className="mt-2 text-sm leading-6 text-text-muted">
            No recommendations. The contract passed Soothmark’s verification check.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm leading-6 text-text-muted">
            {audit.recommendations.map((recommendation) => (
              <li key={recommendation} className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <RawJsonDrawer data={audit} className="mt-5" />
    </div>
  );
}
