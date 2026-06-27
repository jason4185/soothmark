import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionShellProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function SectionShell({ eyebrow, title, description, children, className }: SectionShellProps) {
  return (
    <section className={cn("mx-auto w-full max-w-6xl px-6 py-16 sm:px-8", className)}>
      {(eyebrow || title || description) && (
        <div className="mb-8 max-w-3xl">
          {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>}
          {title && <h2 className="text-balance text-3xl font-semibold tracking-normal text-text-main sm:text-4xl">{title}</h2>}
          {description && <p className="mt-4 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}
