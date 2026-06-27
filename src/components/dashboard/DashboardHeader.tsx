import Link from "next/link";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/shared/GradientButton";
import { cn, shortenAddress } from "@/lib/utils";

type DashboardHeaderProps = {
  walletAddress: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  lastUpdatedAt?: Date | null;
};

export function DashboardHeader({ walletAddress, isRefreshing = false, onRefresh, lastUpdatedAt }: DashboardHeaderProps) {
  return (
    <header className="rounded-xl border border-border/90 bg-surface px-5 py-5 shadow-[0_18px_48px_rgb(90_70_42_/_0.08)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft/35 px-3 py-1 text-xs font-medium text-primary">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Connected wallet
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal text-text-main sm:text-4xl">My audits</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">Review Soothmark audit reports submitted from your connected wallet.</p>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-text-muted">
            Showing audit records owned by {walletAddress ? shortenAddress(walletAddress) : "the selected wallet"}. This is not a public audit history.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row lg:items-center">
          <GradientButton asChild>
            <Link href="/audit">Audit Contract</Link>
          </GradientButton>
          <Button type="button" variant="outline" className="border-border bg-surface text-text-main hover:bg-surface-soft" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("mr-1.5 h-4 w-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing..." : "Refresh audits"}
          </Button>
        </div>
      </div>
      {lastUpdatedAt && (
        <p className="mt-3 text-xs text-text-muted">
          Last updated {lastUpdatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </p>
      )}
    </header>
  );
}
