import Link from "next/link";
import { Crosshair, Database, GitCompareArrows, Hash, LayoutDashboard, Lightbulb, Waves } from "lucide-react";
import type { SoothmarkAudit } from "@/types/audit";
import { AuditResultStamp } from "@/components/audit/AuditResultStamp";
import { RawJsonDrawer } from "@/components/audit/RawJsonDrawer";
import { SoothmarkCheckedList } from "@/components/audit/SoothmarkCheckedList";
import { StatusCard } from "@/components/shared/StatusCard";
import { ValidationGateTrail } from "@/components/shared/ValidationGateTrail";
import { mechanismLabels } from "@/lib/utils";

const verdictCopy: Record<SoothmarkAudit["classification"], string> = {
  certified: "Passed Soothmark’s validation/equivalence audit.",
  conditional: "Requires closer review before relying on the validation path.",
  rejected: "Failed Soothmark’s validation/equivalence audit.",
};

type AuditReportViewProps = {
  auditId: string;
  audit: SoothmarkAudit;
  owner?: string;
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

export function AuditReportView({ auditId, audit, owner }: AuditReportViewProps) {
  return (
    <main className="min-h-screen px-6 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <nav className="flex justify-end text-sm text-text-muted">
          <div className="flex gap-5">
            <Link href="/dashboard" className="inline-flex items-center gap-2 transition hover:text-text-main">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/examples" className="transition hover:text-text-main">
              Examples
            </Link>
          </div>
        </nav>

        <section className="mt-10 rounded-xl border border-border/90 bg-surface p-5 shadow-[0_24px_70px_rgb(90_70_42_/_0.1)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Audit status</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-normal text-text-main">Audit Report</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
                Soothmark audit report for this GenLayer contract.
              </p>
              <p className="mt-4 max-w-3xl text-base leading-7 text-text-muted">{verdictCopy[audit.classification]}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-text-muted">
                <span className="rounded-full border border-border bg-surface-soft px-3 py-1.5">
                  Audit ID: <span className="font-mono text-text-main">{auditId}</span>
                </span>
                <span className="rounded-full border border-border bg-surface-soft px-3 py-1.5">
                  Report: JSON + technical summary
                </span>
              </div>
            </div>
            <AuditResultStamp audit={audit} className="lg:min-w-72" />
          </div>
          <ValidationGateTrail status={audit.classification} className="mt-6" />
          <SoothmarkCheckedList className="mt-5" />

        </section>

        <section className="mt-5 rounded-xl border border-border/90 bg-surface p-5 shadow-[0_16px_44px_rgb(90_70_42_/_0.06)] sm:p-7">
          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Intent</p>
          <div className="mt-3 flex gap-3">
            <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm leading-6 text-text-main">{audit.intent}</p>
          </div>
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          <StatusCard icon={<Waves />} title="Nondeterminism" value={presentLabel(audit.nondeterminism.present)}>
            <EvidenceList evidence={audit.nondeterminism.evidence} />
          </StatusCard>
          <StatusCard icon={<Database />} title="Nondeterministic state impact" value={presentLabel(audit.state_impact.present)}>
            <EvidenceList evidence={audit.state_impact.evidence} />
          </StatusCard>
          <StatusCard icon={<GitCompareArrows />} iconTone="primary" title="Verification Check" value={mechanismLabels[audit.validation.mechanism]} description={audit.validation.explanation}>
            <EvidenceList evidence={audit.validation.evidence} />
          </StatusCard>
        </section>

        <section className="mt-5 rounded-xl border border-border/90 bg-surface p-5 shadow-[0_16px_44px_rgb(90_70_42_/_0.06)] sm:p-7">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-text-main">
            <Lightbulb className="h-5 w-5 text-primary" />
            Recommendations
          </h2>
          {audit.recommendations.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-text-muted">
              No recommendations. The contract passed Soothmark’s verification check.
            </p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm leading-6 text-text-muted">
              {audit.recommendations.map((recommendation) => (
                <li key={recommendation} className="flex gap-3 rounded-lg border border-border/70 bg-surface-soft p-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <RawJsonDrawer data={audit} title="Raw audit JSON" className="mt-5" />

        <details className="mt-5 rounded-lg border border-border/80 bg-surface-soft p-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-text-main marker:hidden">
            <Hash className="h-4 w-4 text-primary" />
            Technical details
          </summary>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Audit ID</p>
              <p className="mt-2 break-all font-mono text-text-main">{auditId}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Owner</p>
              <p className="mt-2 break-all font-mono text-text-main">{owner || "No owner recorded"}</p>
            </div>
          </div>
        </details>
      </div>
    </main>
  );
}
