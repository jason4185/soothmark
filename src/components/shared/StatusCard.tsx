import type { ReactNode } from "react";
import { IconTile } from "@/components/shared/IconTile";
import { cn } from "@/lib/utils";

type StatusCardProps = {
  title: string;
  value?: string;
  description?: string;
  icon?: ReactNode;
  iconTone?: "neutral" | "primary" | "certified" | "conditional" | "rejected";
  children?: ReactNode;
  className?: string;
};

export function StatusCard({ title, value, description, icon, iconTone = "neutral", children, className }: StatusCardProps) {
  return (
    <div
      className={cn(
        "group rounded-lg border border-border/80 bg-surface p-5 shadow-[0_16px_44px_rgb(90_70_42_/_0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_20px_54px_rgb(37_99_235_/_0.08)]",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {icon && <IconTile icon={icon} tone={iconTone} />}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text-muted">{title}</p>
          {value && <p className="mt-2 text-2xl font-semibold tracking-normal text-text-main">{value}</p>}
          {description && <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>}
        </div>
      </div>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
