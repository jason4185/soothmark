import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Braces, Database, Globe, ShieldCheck } from "lucide-react";
import type { ExampleContract } from "@/lib/mocks/examples";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { IconTile } from "@/components/shared/IconTile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExampleCardProps = {
  example: ExampleContract;
  isSelected: boolean;
  onSelect: () => void;
};

const exampleIcons: Record<string, ReactNode> = {
  "simple-storage": <Database />,
  "bad-web-fetcher": <Globe />,
  "fake-validation-mention": <Braces />,
  "safe-web-fetcher": <ShieldCheck />,
};

export function ExampleCard({ example, isSelected, onSelect }: ExampleCardProps) {
  return (
    <article
      className={cn(
        "w-full rounded-lg border bg-surface p-5 text-left shadow-[0_14px_34px_rgb(90_70_42_/_0.06)] transition hover:-translate-y-0.5 hover:border-primary/35",
        isSelected ? "border-primary/70 shadow-[0_18px_44px_rgb(37_99_235_/_0.12)]" : "border-border/80",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <IconTile icon={exampleIcons[example.id] ?? <Braces />} tone={example.expectedClassification === "rejected" ? "rejected" : "neutral"} />
          <div>
            <h2 className="text-lg font-semibold text-text-main">{example.name}</h2>
            <p className="mt-2 text-sm leading-6 text-text-muted">{example.description}</p>
          </div>
        </div>
        <ClassificationBadge classification={example.expectedClassification} className="w-fit shrink-0" />
      </div>
      <div className="mt-4 rounded-md border border-border/70 bg-surface-soft px-3 py-2 text-xs text-text-muted">
        Expected result: <span className="font-medium text-text-main">{example.expectedLabel}</span>
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button asChild size="sm" className="bg-primary text-white hover:bg-primary/90">
          <Link href={`/audit?example=${example.id}`}>Load into Auditor</Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="group border-transparent bg-transparent text-primary shadow-none transition duration-200 hover:translate-x-0.5 hover:border-primary/20 hover:bg-primary-soft hover:text-primary focus-visible:ring-primary"
          onClick={onSelect}
        >
          View example
          <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Button>
      </div>
    </article>
  );
}
