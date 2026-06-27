import Link from "next/link";
import { ArrowUpRight, GitCompareArrows, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { IconTile } from "@/components/shared/IconTile";
import type { SoothmarkAudit } from "@/types/audit";
import { mechanismLabels, shortenAddress } from "@/lib/utils";

type AuditCardProps = {
  auditId: string;
  owner: string;
  audit: SoothmarkAudit;
};

export function AuditCard({ auditId, owner, audit }: AuditCardProps) {
  return (
    <article className="rounded-lg border border-border/80 bg-surface px-4 py-4 shadow-[0_12px_30px_rgb(90_70_42_/_0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-surface-soft">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(220px,0.75fr)_auto] lg:items-center">
        <div className="flex min-w-0 gap-3">
          <IconTile icon={<Hash />} tone="neutral" size="sm" />
          <div className="min-w-0">
            <p className="font-mono text-xs text-text-muted">Audit #{auditId}</p>
            <h2 className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-text-main">{audit.intent}</h2>
            <p className="mt-1 font-mono text-xs text-text-muted">Owner {owner ? shortenAddress(owner) : "Unknown"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <ClassificationBadge classification={audit.classification} className="w-fit" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs text-text-muted">
            <GitCompareArrows className="h-3.5 w-3.5" />
            {mechanismLabels[audit.validation.mechanism]}
          </span>
        </div>

        <Button asChild variant="outline" className="border-border bg-surface text-text-main hover:bg-primary-soft hover:text-primary lg:justify-self-end">
          <Link href={`/audit/${auditId}`}>
            Open report
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </article>
  );
}
