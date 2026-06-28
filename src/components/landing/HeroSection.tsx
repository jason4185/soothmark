"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, ClipboardCheck, Database, FileCode2, GitCompareArrows, Waves } from "lucide-react";
import { motion } from "motion/react";
import { ClassificationBadge } from "@/components/shared/ClassificationBadge";
import { GradientButton } from "@/components/shared/GradientButton";
import { IconTile } from "@/components/shared/IconTile";
import { ValidationGateTrail } from "@/components/shared/ValidationGateTrail";
import { Button } from "@/components/ui/button";

const checks = [
  { icon: <FileCode2 />, label: "Contract code scanned" },
  { icon: <Waves />, label: "Nondeterminism path traced" },
  { icon: <Database />, label: "State impact reviewed" },
  { icon: <GitCompareArrows />, label: "Verification Check completed" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-intelligence-bg" />
      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-9 px-5 py-14 sm:px-6 sm:py-16 lg:grid-cols-[1.22fr_0.78fr] lg:gap-12 lg:px-8 lg:py-12">
      <motion.div initial="hidden" animate="visible" transition={{ staggerChildren: 0.08 }} className="max-w-5xl">
        <motion.p
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.38, ease: "easeOut" }}
          className="text-xs font-semibold uppercase tracking-[0.24em] text-primary"
        >
          GenLayer-native auditor
        </motion.p>
        <motion.h1
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.44, ease: "easeOut" }}
          className="mt-5 max-w-5xl text-balance text-4xl font-semibold leading-[1.08] tracking-normal text-text-main sm:text-5xl lg:text-[3.35rem]"
        >
          Audit GenLayer contracts before outside data affects on-chain data.
        </motion.h1>
        <motion.p
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.44, ease: "easeOut" }}
          className="mt-5 max-w-2xl text-base leading-7 text-text-muted sm:text-lg sm:leading-8"
        >
          Soothmark is a GenLayer-native intelligent contract auditor that checks whether contract code uses the right validation/equivalence mechanism before AI, web data, API results, or rendered page content can affect on-chain contract data.
        </motion.p>
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.44, ease: "easeOut" }}
          className="mt-7 flex flex-col gap-3 sm:flex-row"
        >
          <GradientButton asChild size="lg" className="group">
            <Link href="/audit">
              Audit Contract
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </GradientButton>
          <Button asChild variant="outline" size="lg" className="border-border bg-surface text-text-main transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-soft">
            <Link href="/examples">View Examples</Link>
          </Button>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
        className="relative mx-auto w-full max-w-[27rem] lg:mx-0 lg:justify-self-end"
        whileHover={{ y: -4 }}
      >
        <div className="absolute -inset-5 rounded-[1.5rem] bg-primary/10 blur-3xl" />
        <div className="premium-card-glow relative overflow-hidden rounded-xl border border-border/90 bg-surface transition duration-300 hover:border-primary/25">
          <div className="border-b border-border/70 bg-surface-soft px-4 py-3.5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.2em] text-text-muted">Audit preview</p>
                <div className="mt-1 flex items-center gap-2">
                  <IconTile icon={<ClipboardCheck />} size="sm" tone="primary" />
                  <p className="text-sm font-medium text-text-main">Validation/equivalence audit</p>
                </div>
              </div>
              <ClassificationBadge classification="certified" className="soft-certified-pulse" />
            </div>
          </div>
          <div className="space-y-3.5 p-4">
            <pre className="code-scan-line relative overflow-hidden rounded-lg border border-[#1F2937] bg-[#0B1020] p-3.5 text-xs leading-6 text-[#CBD5E1] shadow-[0_0_28px_rgb(37_99_235_/_0.08)]">
              <code className="blink-cursor">{`response = gl.nondet.web.get(endpoint)
result = gl.eq_principle.strict_eq(fetch)
self.status[url] = result`}</code>
            </pre>
            <ValidationGateTrail compact className="mx-auto w-full max-w-sm" />
            <div className="grid gap-3">
              {checks.map((check) => (
                <div key={check.label} className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface-soft px-3.5 py-2 transition hover:border-primary/25 hover:bg-primary-soft/60">
                  <IconTile icon={check.icon} size="sm" tone="neutral" />
                  <span className="text-sm text-text-main">{check.label}</span>
                  <BadgeCheck className="soft-certified-pulse ml-auto h-4 w-4 text-certified" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
      </div>
    </section>
  );
}
