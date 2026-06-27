import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { AppShell } from "@/components/shared/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soothmark",
  description: "GenLayer-native certification for nondeterministic contract state safety.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
