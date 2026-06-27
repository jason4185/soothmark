"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

type ThemeSelectorProps = {
  className?: string;
};

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const activeTheme = mounted ? theme || "light" : "light";
  const activeOption = themeOptions.find((option) => option.value === activeTheme) ?? themeOptions[0];
  const ActiveIcon = activeOption.icon;

  return (
    <div
      className={cn(
        "relative inline-block text-left",
        className,
      )}
      ref={menuRef}
    >
      <button
        type="button"
        className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-full border border-border/80 bg-surface/85 px-3 text-xs font-medium text-text-main shadow-sm transition hover:border-primary/25 hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        aria-label="Select appearance theme"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
      >
        <ActiveIcon className="h-3.5 w-3.5 text-primary" />
        <span>{activeOption.label}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-text-soft transition", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-xl border border-border/80 bg-surface p-1.5 shadow-[0_14px_34px_color-mix(in_srgb,var(--border-strong)_28%,transparent)]"
          role="menu"
          aria-label="Appearance theme options"
        >
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = activeTheme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-text-muted transition hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive && "bg-primary-soft text-primary",
                )}
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  setTheme(option.value);
                  setIsOpen(false);
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="flex-1">{option.label}</span>
                {isActive && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
