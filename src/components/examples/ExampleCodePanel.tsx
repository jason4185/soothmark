"use client";

import Link from "next/link";
import { toast } from "sonner";
import type { ExampleContract } from "@/lib/mocks/examples";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/shared/GradientButton";

type ExampleCodePanelProps = {
  example: ExampleContract;
};

export function ExampleCodePanel({ example }: ExampleCodePanelProps) {
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(example.code);
      toast.success("Example copied.");
    } catch {
      toast.error("Could not copy example.");
    }
  }

  return (
    <div className="min-w-0 rounded-xl border border-border/90 bg-surface p-4 shadow-[0_24px_70px_rgb(90_70_42_/_0.1)]">
      <div className="mb-3 flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Selected example</p>
          <h2 className="mt-1 text-xl font-semibold text-text-main">{example.name}</h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="border-border bg-surface text-text-main hover:bg-surface-soft" onClick={copyCode}>
            Copy code
          </Button>
          <GradientButton asChild>
            <Link href={`/audit?example=${example.id}`}>Load into Auditor</Link>
          </GradientButton>
        </div>
      </div>
      <pre className="max-h-[620px] max-w-full overflow-auto rounded-lg border border-[#1F2937] bg-[#0B1020] p-5 text-sm leading-7 text-[#CBD5E1]">
        <code>{example.code}</code>
      </pre>
    </div>
  );
}
