import type { AuditClassification } from "@/types/audit";
import type { ReactNode } from "react";
import { AlertTriangle, BadgeCheck, ShieldX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ClassificationBadgeProps = {
  classification: AuditClassification;
  className?: string;
};

const badgeConfig: Record<AuditClassification, { label: string; className: string; icon: ReactNode }> = {
  certified: {
    label: "Certified",
    className: "border-certified/25 bg-[var(--certified-soft)] text-certified",
    icon: <BadgeCheck className="h-3.5 w-3.5" />,
  },
  conditional: {
    label: "Conditional",
    className: "border-conditional/25 bg-[var(--conditional-soft)] text-conditional",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  rejected: {
    label: "Rejected",
    className: "border-rejected/25 bg-[var(--rejected-soft)] text-rejected",
    icon: <ShieldX className="h-3.5 w-3.5" />,
  },
};

export function ClassificationBadge({ classification, className }: ClassificationBadgeProps) {
  const config = badgeConfig[classification];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-normal", config.className, className)}
    >
      {config.icon}
      {config.label}
    </Badge>
  );
}
