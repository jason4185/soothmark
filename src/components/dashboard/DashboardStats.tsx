import { AlertTriangle, BadgeCheck, Files, ShieldX } from "lucide-react";
import type { AuditClassification, SoothmarkAudit } from "@/types/audit";
import { IconTile } from "@/components/shared/IconTile";

type OwnedAudit = {
  auditId: string;
  owner: string;
  audit: SoothmarkAudit;
};

type DashboardStatsProps = {
  audits: OwnedAudit[];
};

function countByClassification(audits: OwnedAudit[], classification: AuditClassification) {
  return audits.filter((item) => item.audit.classification === classification).length;
}

export function DashboardStats({ audits }: DashboardStatsProps) {
  const metrics = [
    {
      icon: <Files />,
      label: "Total audits",
      value: audits.length,
      caption: "Audit records owned by this wallet.",
      tone: "neutral" as const,
    },
    {
      icon: <BadgeCheck />,
      label: "Certified",
      value: countByClassification(audits, "certified"),
      caption: "Passed Soothmark's state-safety audit.",
      tone: "certified" as const,
    },
    {
      icon: <AlertTriangle />,
      label: "Conditional",
      value: countByClassification(audits, "conditional"),
      caption: "Validation exists, but coverage may need review.",
      tone: "conditional" as const,
    },
    {
      icon: <ShieldX />,
      label: "Rejected",
      value: countByClassification(audits, "rejected"),
      caption: "Nondeterministic state impact lacks protection.",
      tone: "rejected" as const,
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article key={metric.label} className="flex min-h-[118px] gap-3 rounded-lg border border-border/80 bg-surface p-4 shadow-[0_12px_30px_rgb(90_70_42_/_0.05)]">
          <IconTile icon={metric.icon} tone={metric.tone} size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-text-muted">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold leading-none text-text-main">{metric.value}</p>
            <p className="mt-2 text-xs leading-5 text-text-muted">{metric.caption}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
