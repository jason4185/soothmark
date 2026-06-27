"use client";

import { useMemo, useState } from "react";
import { Braces } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RawJsonDrawerProps = {
  data: unknown;
  title?: string;
  className?: string;
};

export function RawJsonDrawer({ data, title = "Raw audit JSON", className }: RawJsonDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const formattedJson = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return "Unable to serialize JSON.";
    }
  }, [data]);

  return (
    <div className={cn("rounded-lg border border-border/80 bg-surface-soft p-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-text-main">
            <Braces className="h-4 w-4 text-primary" />
            {title}
          </p>
          <p className="mt-1 text-sm text-text-muted">This is the exact audit JSON returned by Soothmark.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-border bg-surface text-text-main hover:bg-primary-soft sm:w-auto"
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? "Hide raw JSON" : "View raw JSON"}
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <pre className="mt-4 max-h-[420px] max-w-full overflow-x-auto rounded-lg border border-[#1F2937] bg-[#0B1020] p-4 text-xs leading-6 text-[#CBD5E1]">
              <code>{formattedJson}</code>
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
