import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconTileProps = {
  icon: ReactNode;
  tone?: "neutral" | "primary" | "certified" | "conditional" | "rejected";
  size?: "sm" | "md" | "lg";
  active?: boolean;
  className?: string;
};

const toneClasses = {
  neutral: "border-border bg-surface-soft text-slate-700",
  primary: "border-primary/20 bg-primary-soft text-primary",
  certified: "border-certified/25 bg-[var(--certified-soft)] text-certified",
  conditional: "border-conditional/25 bg-[var(--conditional-soft)] text-conditional",
  rejected: "border-rejected/25 bg-[var(--rejected-soft)] text-rejected",
};

const sizeClasses = {
  sm: "h-8 w-8 rounded-lg [&_svg]:h-4 [&_svg]:w-4",
  md: "h-10 w-10 rounded-xl [&_svg]:h-5 [&_svg]:w-5",
  lg: "h-12 w-12 rounded-2xl [&_svg]:h-5 [&_svg]:w-5",
};

export function IconTile({ icon, tone = "neutral", size = "md", active = false, className }: IconTileProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center border transition duration-200 group-hover:-translate-y-0.5",
        toneClasses[tone],
        sizeClasses[size],
        active && "shadow-[0_10px_28px_rgb(37_99_235_/_0.12)]",
        className,
      )}
    >
      {icon}
    </span>
  );
}
