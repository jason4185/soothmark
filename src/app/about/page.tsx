import Link from "next/link";
import { AlertTriangle, BadgeCheck, Crosshair, Database, GitCompareArrows, ShieldX, Waves } from "lucide-react";
import { CheckPath } from "@/components/about/CheckPath";
import { ScopeCard } from "@/components/about/ScopeCard";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { GradientButton } from "@/components/shared/GradientButton";
import { SectionShell } from "@/components/shared/SectionShell";
import { StatusCard } from "@/components/shared/StatusCard";
import { Button } from "@/components/ui/button";

const nondeterminismItems = [
  "gl.nondet.web.get(...)",
  "gl.nondet.web.request(...)",
  "gl.nondet.web.render(...)",
  "gl.nondet.exec_prompt(...)",
  "AI output",
  "Web/API output",
  "Rendered external pages",
  "Other external or unpredictable inputs",
];

const mechanisms = [
  "gl.vm.run_nondet_unsafe",
  "gl.eq_principle.strict_eq",
  "prompt_comparative",
  "prompt_non_comparative",
];

const exclusions = [
  "General smart-contract security",
  "Storage design unrelated to outside-data validation/equivalence",
  "Frontend or app completeness",
  "Dependency formatting",
  "Public method completeness",
  "Pagination or indexing",
  "Dispute flow",
  "Broad GenLayer documentation compliance",
  "Unrelated error handling",
  "Business logic quality unless it affects nondeterministic state validation",
];

const unsafeExample = `response = gl.nondet.web.get("https://api.example.com/price")
price = response.body.decode("utf-8")
self.last_price = price`;

const deterministicExample = `self.message = new_message
self.update_count = self.update_count + u256(1)`;

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <SectionShell className="pt-8" eyebrow="Scope" title="What Soothmark Checks" description="Soothmark is a GenLayer-native intelligent contract auditor that checks whether contract code uses the right validation/equivalence mechanism before AI, web data, API results, or rendered page content can affect on-chain contract data.">
        <div className="rounded-xl border border-border/80 bg-surface p-5 text-sm leading-6 text-text-muted shadow-[0_16px_44px_rgb(90_70_42_/_0.06)]">
          Soothmark helps GenLayer builders check if outside data is properly validated before it changes what their contract stores.
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Core path"
        title="The Soothmark audit path."
        description="Soothmark traces one critical path: intent → nondeterminism → state impact → validation/equivalence → result."
      >
        <CheckPath />
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatusCard icon={<Crosshair />} title="Intent" description="Soothmark identifies what the submitted contract is trying to do." />
          <StatusCard icon={<Waves />} title="Nondeterminism" description="Soothmark detects executable logic that may produce different results across validators, such as web calls, rendered pages, AI prompts, and external unpredictable inputs." />
          <StatusCard icon={<Database />} title="State impact" description="Soothmark checks whether nondeterministic output can affect on-chain contract data." />
          <StatusCard icon={<GitCompareArrows />} iconTone="primary" title="Verification Check" description="Soothmark checks whether the exact nondeterministic state-changing path is protected by the correct GenLayer validation or equivalence mechanism." />
        </div>
      </SectionShell>

      <SectionShell eyebrow="Nondeterminism" title="What Counts as Nondeterminism">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <ScopeCard title="Executable sources">
            <ul className="grid gap-2 sm:grid-cols-2">
              {nondeterminismItems.map((item) => (
                <li key={item} className="rounded-md border border-border/60 bg-surface-soft px-3 py-2 font-mono text-xs">
                  {item}
                </li>
              ))}
            </ul>
          </ScopeCard>
          <ScopeCard title="Executable usage only">
            <p>
              Only executable usage counts. Mentions inside comments, strings, prompts, schema examples, documentation text, or recommendations do not count by themselves.
            </p>
          </ScopeCard>
        </div>
      </SectionShell>

      <SectionShell eyebrow="State impact" title="What Counts as State Impact" description="State impact means nondeterministic output can affect on-chain contract data.">
        <div className="grid gap-5 lg:grid-cols-2">
          <ScopeCard title="Unsafe nondeterministic state impact">
            <pre className="overflow-x-auto rounded-lg border border-[#1F2937] bg-[#0B1020] p-4 font-mono text-xs leading-6 text-[#CBD5E1]">
              <code>{unsafeExample}</code>
            </pre>
            <p className="mt-4">This has state impact because external web output changes what the contract stores.</p>
          </ScopeCard>
          <ScopeCard title="Safe deterministic state writing">
            <pre className="overflow-x-auto rounded-lg border border-[#1F2937] bg-[#0B1020] p-4 font-mono text-xs leading-6 text-[#CBD5E1]">
              <code>{deterministicExample}</code>
            </pre>
            <p className="mt-4">This is deterministic state writing. It does not create nondeterministic state impact by itself.</p>
          </ScopeCard>
        </div>
      </SectionShell>

      <SectionShell eyebrow="Mechanisms" title="Validation and Equivalence Mechanisms">
        <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
          <ScopeCard title="Known mechanisms">
            <ul className="space-y-2">
              {mechanisms.map((item) => (
                <li key={item} className="rounded-md border border-border/60 bg-surface-soft px-3 py-2 font-mono text-xs">
                  {item}
                </li>
              ))}
            </ul>
          </ScopeCard>
          <ScopeCard title="Path coverage matters">
            <p>
              Soothmark does not judge protection by mechanism name alone. A mechanism is properly used only when it protects the same nondeterministic value that can affect on-chain contract data.
            </p>
            <p className="mt-4">
              Protection may come from run_nondet_unsafe, strict_eq, prompt_comparative, or prompt_non_comparative when applied to the correct state-changing path.
            </p>
            <p className="mt-4">
              prompt_comparative is not automatically rejected. It can be valid when the equivalence rule is tight enough for the stored value.
            </p>
          </ScopeCard>
        </div>
      </SectionShell>

      <SectionShell eyebrow="Non-goals" title="What Soothmark Does Not Check">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {exclusions.map((item) => (
              <div key={item} className="rounded-lg border border-border/70 bg-surface p-4 text-sm text-text-muted shadow-[0_12px_30px_rgb(90_70_42_/_0.05)]">
                {item}
              </div>
            ))}
          </div>
          <ScopeCard title="Intentionally narrow">
            <p>
              Soothmark is intentionally narrow. It checks one critical GenLayer question: does contract code use the right validation/equivalence mechanism before outside data affects on-chain contract data?
            </p>
          </ScopeCard>
        </div>
      </SectionShell>

      <SectionShell eyebrow="Classification" title="Classification Meaning">
        <div className="grid gap-4 md:grid-cols-3">
          <StatusCard icon={<BadgeCheck />} iconTone="certified" title="Certified" description="No executable nondeterminism exists, or nondeterministic output does not affect on-chain contract data, or the state-changing nondeterministic path is properly protected.">
            <ClassificationBadge classification="certified" />
          </StatusCard>
          <StatusCard icon={<AlertTriangle />} iconTone="conditional" title="Conditional" description="Nondeterministic state impact exists and validation is present, but coverage, validator quality, or equivalence tightness may need improvement.">
            <ClassificationBadge classification="conditional" />
          </StatusCard>
          <StatusCard icon={<ShieldX />} iconTone="rejected" title="Rejected" description="Nondeterministic output can affect on-chain contract data and no appropriate validation or equivalence mechanism protects that path.">
            <ClassificationBadge classification="rejected" />
          </StatusCard>
        </div>
      </SectionShell>

      <SectionShell className="pb-24">
        <div className="rounded-xl border border-border/90 bg-surface p-6 text-center shadow-[0_24px_70px_rgb(90_70_42_/_0.1)]">
          <h2 className="text-3xl font-semibold text-text-main">Ready to check a contract?</h2>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <GradientButton asChild>
              <Link href="/audit">Audit Contract</Link>
            </GradientButton>
            <Button asChild variant="outline" className="border-border bg-surface text-text-main hover:bg-surface-soft">
              <Link href="/examples">View Examples</Link>
            </Button>
          </div>
        </div>
      </SectionShell>
    </main>
  );
}
