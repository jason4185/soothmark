import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { Reveal } from "@/components/shared/Reveal";
import { SectionShell } from "@/components/shared/SectionShell";

const examples = [
  {
    name: "SimpleStorage",
    description: "Deterministic state updates with no nondeterministic state impact.",
    classification: "certified" as const,
    label: "Certified",
  },
  {
    name: "BadWebFetcher",
    description: "Stores external web output without validation or equivalence protection.",
    classification: "rejected" as const,
    label: "Rejected",
  },
  {
    name: "FakeValidationMention",
    description: "Mentions validation in comments or strings but never executes the mechanism.",
    classification: "rejected" as const,
    label: "Rejected",
  },
  {
    name: "SafeWebFetcher",
    description: "Protects a nondeterministic web result before it changes contract storage.",
    classification: "certified" as const,
    label: "Certified",
  },
];

export function ExamplesPreview() {
  return (
    <SectionShell
      eyebrow="Examples"
      title="Representative contracts for Soothmark audit calibration."
      description="Review sample contracts that demonstrate how Soothmark classifies deterministic logic, unsafe outside-data state writes, fake validation mentions, and protected validation paths."
    >
      <Reveal className="grid gap-4 md:grid-cols-2">
        {examples.map((example) => (
          <article
            key={example.name}
            className="flex min-h-[190px] flex-col rounded-lg border border-border/80 bg-surface p-5 shadow-[0_16px_44px_rgb(90_70_42_/_0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_18px_54px_rgb(37_99_235_/_0.08)]"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-text-main">{example.name}</h3>
              <ClassificationBadge classification={example.classification} className="shrink-0" />
            </div>
            <p className="mt-4 flex-1 text-sm leading-6 text-text-muted">{example.description}</p>
            <div className="mt-6 flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-text-muted">
                Expected result:{" "}
                <span className={example.classification === "certified" ? "font-medium text-certified" : "font-medium text-rejected"}>
                  {example.label}
                </span>
              </p>
              <Link
                href="/examples"
                className="group inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 text-sm font-medium text-primary transition duration-200 hover:translate-x-0.5 hover:border-primary/20 hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                View example
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </article>
        ))}
      </Reveal>
      <Reveal delay={0.08}>
        <p className="mt-5 text-sm leading-6 text-text-muted">
          Soothmark helps GenLayer builders check if outside data is properly validated before it changes what their contract stores.
        </p>
      </Reveal>
    </SectionShell>
  );
}
