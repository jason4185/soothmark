"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { WalletProvider } from "@/components/providers/WalletProvider";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" storageKey="theme" defaultTheme="light" enableSystem={true} disableTransitionOnChange>
      <WalletProvider>
        {children}
        <Toaster richColors theme="light" />
      </WalletProvider>
    </ThemeProvider>
  );
}
