import { CheckCircle2, Crosshair, Database, GitCompareArrows, Waves } from "lucide-react";
import { IconTile } from "@/components/shared/IconTile";
import { cn } from "@/lib/utils";

type SoothmarkCheckedListProps = {
  className?: string;
};

const checkedItems = [
  { label: "Intent identified", icon: <Crosshair /> },
  { label: "Nondeterminism reviewed", icon: <Waves /> },
  { label: "State impact traced", icon: <Database /> },
  { label: "Verification Check completed", icon: <GitCompareArrows /> },
];

export function SoothmarkCheckedList({ className }: SoothmarkCheckedListProps) {
  return (
    <div className={cn("rounded-lg border border-border/70 bg-surface-soft p-4", className)}>
      <p className="text-sm font-medium text-text-main">What Soothmark checked</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {checkedItems.map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-lg border border-border/60 bg-surface px-3 py-2.5">
            <IconTile icon={item.icon} size="sm" tone="neutral" />
            <span className="text-sm text-text-main">{item.label}</span>
            <CheckCircle2 className="ml-auto h-4 w-4 text-primary" />
          </div>
        ))}
      </div>
    </div>
  );
}
