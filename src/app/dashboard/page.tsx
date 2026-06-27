"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { AuditList } from "@/components/dashboard/AuditList";
import { SectionShell } from "@/components/shared/SectionShell";
import { WalletConnectButton } from "@/components/shared/WalletConnectButton";
import { Button } from "@/components/ui/button";
import { soothmarkDebug } from "@/lib/debug";
import { soothmarkContractConfig } from "@/lib/soothmarkContractConfig";
import { cn } from "@/lib/utils";
import { isSoothmarkRateLimitError, soothmarkClient } from "@/lib/soothmarkClient";
import { useWalletIdentity } from "@/lib/wallet/useWalletIdentity";
import type { AuditClassification, SoothmarkAudit } from "@/types/audit";

type OwnedAudit = {
  auditId: string;
  owner: string;
  audit: SoothmarkAudit;
};

type DashboardFilter = "all" | AuditClassification;
type DashboardCacheEntry = {
  audits: OwnedAudit[];
  updatedAt: Date;
};

const filters: Array<{ label: string; value: DashboardFilter }> = [
  { label: "All", value: "all" },
  { label: "Certified", value: "certified" },
  { label: "Conditional", value: "conditional" },
  { label: "Rejected", value: "rejected" },
];
const dashboardCache = new Map<string, DashboardCacheEntry>();
const dashboardCacheTtlMs = 60_000;

function getDashboardCacheKey(walletAddress: string) {
  return `${soothmarkContractConfig.address.toLowerCase()}:${walletAddress.toLowerCase()}`;
}

export default function DashboardPage() {
  const wallet = useWalletIdentity();
  const [audits, setAudits] = useState<OwnedAudit[]>([]);
  const [filter, setFilter] = useState<DashboardFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const connectedWalletAddress = wallet.address;
  const visibleAudits = filter === "all" ? audits : audits.filter((item) => item.audit.classification === filter);

  useEffect(() => {
    let active = true;
    async function loadAudits() {
      if (!connectedWalletAddress) {
        setAudits([]);
        setError(undefined);
        setLastUpdatedAt(null);
        setIsLoading(false);
        return;
      }

      soothmarkDebug("[Dashboard RPC] refresh started", { walletAddress: connectedWalletAddress, refreshNonce });
      soothmarkDebug("[Soothmark dashboard] loading wallet:", connectedWalletAddress);
      setIsLoading(true);
      setError(undefined);
      setAudits([]);
      try {
        const cacheKey = getDashboardCacheKey(connectedWalletAddress);
        const cached = dashboardCache.get(cacheKey);
        if (cached && refreshNonce === 0 && Date.now() - cached.updatedAt.getTime() < dashboardCacheTtlMs) {
          soothmarkDebug("[Dashboard RPC] refresh finished", {
            source: "cache",
            auditRecords: cached.audits.length,
            updatedAt: cached.updatedAt.toISOString(),
          });
          setAudits(cached.audits);
          setLastUpdatedAt(cached.updatedAt);
          setIsLoading(false);
          return;
        }

        const walletAudits = await soothmarkClient.getMyAudits(connectedWalletAddress);
        if (active) {
          const updatedAt = new Date();
          dashboardCache.set(cacheKey, {
            audits: walletAudits,
            updatedAt,
          });
          soothmarkDebug("[Dashboard RPC] refresh finished", {
            source: "contract",
            auditRecords: walletAudits.length,
            updatedAt: updatedAt.toISOString(),
          });
          setAudits(walletAudits);
          setLastUpdatedAt(updatedAt);
        }
      } catch (caughtError) {
        soothmarkDebug("[Soothmark dashboard] refresh error:", caughtError);
        if (isSoothmarkRateLimitError(caughtError)) {
          soothmarkDebug("[Dashboard RPC] rate limited", caughtError);
        }
        if (active) {
          setAudits([]);
          setError(
            isSoothmarkRateLimitError(caughtError)
              ? "GenLayer RPC is rate-limiting reads. Your audits may still be processing. Try refreshing again shortly."
              : "We could not load the latest contract data yet. Try refreshing.",
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    loadAudits();
    return () => {
      active = false;
    };
  }, [connectedWalletAddress, refreshNonce]);

  if (!connectedWalletAddress) {
    return (
      <main className="min-h-screen">
        <SectionShell className="pt-8">
          <div className="rounded-xl border border-border/90 bg-surface px-5 py-6 shadow-[0_18px_48px_rgb(90_70_42_/_0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Wallet required</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-text-main sm:text-4xl">Connect wallet to view audits</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
              Your dashboard shows Soothmark audit reports submitted from your connected wallet.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <WalletConnectButton className="border-border bg-surface text-text-main hover:bg-surface-soft" />
              <Button asChild className="bg-primary text-white hover:bg-primary/90">
                <Link href="/audit">Audit Contract</Link>
              </Button>
              <Button asChild variant="outline" className="border-border bg-surface text-text-main hover:bg-surface-soft">
                <Link href="/examples">View Examples</Link>
              </Button>
            </div>
          </div>
        </SectionShell>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <SectionShell className="pt-8">
        <DashboardHeader
          walletAddress={connectedWalletAddress}
          isRefreshing={isLoading}
          onRefresh={() => setRefreshNonce((value) => value + 1)}
          lastUpdatedAt={lastUpdatedAt}
        />
      </SectionShell>

      <SectionShell className="pt-0">
        <DashboardStats audits={audits} />
      </SectionShell>

      <SectionShell className="pb-24 pt-0" eyebrow="Audit records" title="Audit records" description="Open a previous report or refresh the wallet-scoped audit list.">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition",
                  filter === item.value ? "border-primary/35 bg-primary-soft text-primary" : "border-border bg-surface text-text-muted hover:border-primary/25 hover:text-text-main",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <AuditList
          audits={visibleAudits}
          isLoading={isLoading}
          error={error}
          emptyTitle={audits.length === 0 ? "No audits yet" : "No matching audits"}
          emptyCopy={
            audits.length === 0
              ? "No audits yet. Submit a GenLayer contract to create your first Soothmark audit."
              : "Try another status filter or submit a new contract audit."
          }
        />
      </SectionShell>
    </main>
  );
}
