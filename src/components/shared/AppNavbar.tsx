"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Braces, ClipboardCheck, Home, Info, LayoutDashboard, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GradientButton } from "@/components/shared/GradientButton";
import { Logo } from "@/components/shared/Logo";
import { ThemeSelector } from "@/components/shared/ThemeSelector";
import { WalletConnectButton } from "@/components/shared/WalletConnectButton";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/audit", label: "Audit", icon: ClipboardCheck },
  { href: "/examples", label: "Examples", icon: Braces },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/about", label: "About", icon: Info },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center text-text-main" aria-label="Soothmark home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1.5 text-sm text-text-muted md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1.5 transition hover:border-border hover:bg-surface-soft hover:text-text-main",
                isActive(pathname, link.href) && "border-primary/20 bg-primary-soft/30 text-primary",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <GradientButton asChild size="sm">
            <Link href="/audit">Audit Contract</Link>
          </GradientButton>
          <ThemeSelector />
          <WalletConnectButton className="border-border bg-surface text-text-main hover:bg-surface-soft" />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="border-border bg-surface text-text-main hover:bg-surface-soft md:hidden">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="border-border/80 bg-surface text-text-main">
            <SheetHeader>
              <SheetTitle className="text-text-main">
                <Logo />
              </SheetTitle>
              <SheetDescription className="text-text-muted">GenLayer-native nondeterministic state safety checks.</SheetDescription>
            </SheetHeader>
            <div className="mt-8 grid gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border border-border/70 bg-surface-soft/70 px-4 py-3 text-sm text-text-muted transition hover:text-text-main",
                      isActive(pathname, link.href) && "border-primary/35 bg-primary-soft/45 text-primary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </SheetClose>
                );
              })}
            </div>
            <SheetClose asChild>
              <GradientButton asChild className="mt-6 w-full">
                <Link href="/audit">Audit Contract</Link>
              </GradientButton>
            </SheetClose>
            <div className="mt-3">
              <ThemeSelector className="w-full justify-center" />
            </div>
            <div className="mt-3">
              <WalletConnectButton className="w-full border-border/80 bg-surface text-text-main hover:bg-surface-soft" />
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
