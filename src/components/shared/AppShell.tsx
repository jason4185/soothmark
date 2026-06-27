import type { ReactNode } from "react";
import { AppFooter } from "@/components/shared/AppFooter";
import { AppNavbar } from "@/components/shared/AppNavbar";
import { ValidatorFieldBackground } from "@/components/shared/ValidatorFieldBackground";

type AppShellProps = {
  children: ReactNode;
  showFooter?: boolean;
};

export function AppShell({ children, showFooter = true }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <ValidatorFieldBackground />
      <AppNavbar />
      {children}
      {showFooter && <AppFooter />}
    </div>
  );
}
