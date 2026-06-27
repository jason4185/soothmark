import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ScopeCardProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function ScopeCard({ title, children, className }: ScopeCardProps) {
  return (
    <div className={cn("rounded-lg border border-border/80 bg-surface p-5 shadow-[0_16px_44px_rgb(90_70_42_/_0.07)]", className)}>
      <h3 className="text-lg font-semibold text-text-main">{title}</h3>
      <div className="mt-3 text-sm leading-6 text-text-muted">{children}</div>
    </div>
  );
}
