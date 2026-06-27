import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuditCard } from "@/components/dashboard/AuditCard";
import { LogoMark } from "@/components/shared/Logo";
import { ValidationGateTrail } from "@/components/shared/ValidationGateTrail";
import type { SoothmarkAudit } from "@/types/audit";

type OwnedAudit = {
  auditId: string;
  owner: string;
  audit: SoothmarkAudit;
};

type AuditListProps = {
  audits: OwnedAudit[];
  isLoading: boolean;
  error?: string;
  emptyTitle?: string;
  emptyCopy?: string;
};

export function AuditList({ audits, isLoading, error, emptyTitle = "No audits yet", emptyCopy = "No audits yet. Submit a GenLayer contract to create your first Soothmark audit." }: AuditListProps) {
  if (isLoading) {
    return (
      <section className="rounded-xl border border-border/90 bg-surface p-6 shadow-[0_16px_44px_rgb(90_70_42_/_0.06)]" aria-live="polite">
        <div className="flex items-center gap-3 text-sm text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Refreshing audits...
        </div>
        <div className="mt-5 grid gap-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-24 animate-pulse rounded-lg border border-border/70 bg-surface-soft" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-rejected/30 bg-[var(--rejected-soft)] p-6 text-sm text-rejected" role="alert">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      </section>
    );
  }

  if (audits.length === 0) {
    return (
      <section className="rounded-xl border border-border/90 bg-surface p-8 text-center shadow-[0_16px_44px_rgb(90_70_42_/_0.06)]">
        <LogoMark className="mx-auto mb-4 h-12 w-12" />
        <h2 className="text-2xl font-semibold text-text-main">{emptyTitle}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-text-muted">
          {emptyCopy}
        </p>
        <ValidationGateTrail compact className="mx-auto mt-5 max-w-md" />
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="bg-primary text-white hover:bg-primary/90">
            <Link href="/audit">Audit Contract</Link>
          </Button>
          <Button asChild variant="outline" className="border-border bg-surface text-text-main hover:bg-surface-soft">
            <Link href="/examples">View Examples</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      {audits.map((item) => (
        <AuditCard key={item.auditId} auditId={item.auditId} owner={item.owner} audit={item.audit} />
      ))}
    </section>
  );
}
