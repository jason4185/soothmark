"use client";

import { Crosshair, Database, GitCompareArrows, Waves } from "lucide-react";
import { motion } from "motion/react";
import { IconTile } from "@/components/shared/IconTile";
import { Reveal } from "@/components/shared/Reveal";
import { SectionShell } from "@/components/shared/SectionShell";
import { ValidationGateTrail } from "@/components/shared/ValidationGateTrail";

const steps = [
  {
    title: "Intent",
    description: "Identifies what the submitted contract is designed to do.",
    icon: <Crosshair />,
  },
  {
    title: "Nondeterminism",
    description: "Detects executable web, AI, render, and other nondeterministic logic.",
    icon: <Waves />,
  },
  {
    title: "State Impact",
    description: "Checks whether nondeterministic output can affect persistent contract state.",
    icon: <Database />,
  },
  {
    title: "Verification Check",
    description: "Verifies whether the state-changing path is protected by the correct GenLayer mechanism.",
    icon: <GitCompareArrows />,
  },
];

export function HowItWorks() {
  return (
    <SectionShell
      eyebrow="Audit path"
      title="A focused audit model for intelligent contracts."
      description="Soothmark reviews the exact path where nondeterministic logic can influence saved contract state."
    >
      <Reveal>
        <div className="consensus-trace mb-7 overflow-hidden rounded-lg border border-border/80 bg-surface px-4 py-3 text-center text-sm text-text-muted shadow-[0_16px_44px_rgb(90_70_42_/_0.08)]">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <span>
              intent <span className="text-primary">-&gt;</span> nondeterminism <span className="text-primary">-&gt;</span> state impact{" "}
              <span className="text-primary">-&gt;</span> verification check
            </span>
            <ValidationGateTrail compact className="w-full max-w-md" />
          </div>
        </div>
        <motion.div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          transition={{ staggerChildren: 0.08 }}
        >
          {steps.map((step, index) => (
            <motion.article
              key={step.title}
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.42, ease: "easeOut" }}
              className="path-card-scan group rounded-lg border border-border/80 bg-surface p-5 shadow-[0_18px_50px_rgb(90_70_42_/_0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-surface-soft"
              style={{ animationDelay: `${index * 0.55}s` }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <IconTile icon={step.icon} tone={index === 3 ? "primary" : "neutral"} className="path-icon-scan" active={index === 3} />
                  <p className="min-w-0 text-sm font-medium leading-5 text-text-main">{step.title}</p>
                </div>
                <p className="text-sm leading-6 text-text-muted">{step.description}</p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </Reveal>
    </SectionShell>
  );
}
