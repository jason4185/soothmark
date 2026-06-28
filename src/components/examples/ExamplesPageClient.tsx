"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ExampleCard } from "@/components/examples/ExampleCard";
import { ExampleCodePanel } from "@/components/examples/ExampleCodePanel";
import { exampleContracts, getExampleById } from "@/lib/mocks/examples";

export function ExamplesPageClient() {
  const searchParams = useSearchParams();
  const initialExample = useMemo(() => {
    const requestedExample = searchParams.get("example");
    return requestedExample ? getExampleById(requestedExample) : undefined;
  }, [searchParams]);
  const [selectedId, setSelectedId] = useState(initialExample?.id ?? exampleContracts[0].id);
  const selectedExample = getExampleById(selectedId) ?? exampleContracts[0];

  return (
    <main className="min-h-screen px-6 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Examples</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-text-main">Example Contracts</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-text-muted">
            Explore how Soothmark classifies deterministic contracts, unsafe outside-data state writes, fake validation mentions, and protected GenLayer equivalence patterns.
          </p>
          <div className="mt-5 rounded-lg border border-border/80 bg-surface p-4 text-sm leading-6 text-text-muted shadow-[0_16px_44px_rgb(90_70_42_/_0.06)]">
            Soothmark traces one critical path: intent → nondeterminism → state impact → validation/equivalence → result.
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-4">
            {exampleContracts.map((example) => (
              <ExampleCard key={example.id} example={example} isSelected={example.id === selectedId} onSelect={() => setSelectedId(example.id)} />
            ))}
          </div>
          <ExampleCodePanel example={selectedExample} />
        </section>
      </div>
    </main>
  );
}
