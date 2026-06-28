import { Database, GitCompareArrows, Waves } from "lucide-react";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { Reveal } from "@/components/shared/Reveal";
import { SectionShell } from "@/components/shared/SectionShell";
import { StatusCard } from "@/components/shared/StatusCard";
import { ValidationGateTrail } from "@/components/shared/ValidationGateTrail";

const reportJson = `{
  "classification": "certified",
  "nondeterminism": { "present": false },
  "state_impact": { "present": false },
  "validation": {
    "mechanism": "none",
    "properly_used": true
  }
}`;

export function ResultPreview() {
  return (
    <SectionShell
      eyebrow="Report preview"
      title="A focused audit report for validation/equivalence review."
      description="Soothmark reports highlight the path from outside data to state impact and the validation/equivalence mechanism that protects it."
    >
      <Reveal className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="code-scan-line relative overflow-hidden rounded-xl border border-border/90 bg-surface p-5 shadow-[0_24px_70px_rgb(90_70_42_/_0.1),0_0_34px_rgb(37_99_235_/_0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_24px_80px_rgb(37_99_235_/_0.08)]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-text-muted">Mock audit report</p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-certified/20 bg-[var(--certified-soft)] px-2 py-1 text-[0.68rem] text-certified">
                  <span className="report-ready-dot h-1.5 w-1.5 rounded-full bg-certified" />
                  Report ready
                </span>
              </div>
              <h3 className="mt-2 text-2xl font-semibold text-text-main">SimpleStorage</h3>
            </div>
            <ClassificationBadge classification="certified" className="soft-certified-pulse" />
          </div>
          <ValidationGateTrail compact className="mb-5" />
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StatusCard icon={<Waves />} title="Nondeterminism" value="Not present" />
            <StatusCard icon={<Database />} title="State impact" value="Not present" />
            <StatusCard icon={<GitCompareArrows />} iconTone="primary" title="Validation" value="None required" />
          </div>
        </div>
        <pre className="code-scan-line relative max-w-full overflow-hidden rounded-xl border border-[#1F2937] bg-[#0B1020] p-5 text-sm leading-7 text-[#CBD5E1] shadow-[0_20px_54px_rgb(17_24_39_/_0.18)] transition duration-300 hover:border-primary/45">
          <code className="blink-cursor block overflow-x-auto">{reportJson}</code>
        </pre>
      </Reveal>
    </SectionShell>
  );
}
