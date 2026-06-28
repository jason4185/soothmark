import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { AppShell } from "@/components/shared/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soothmark",
  description: "Soothmark helps GenLayer builders check if AI or fetched web data is properly validated before it changes what their contract stores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var key="theme";var value=window.localStorage.getItem(key);var valid=value==="light"||value==="dark"||value==="system";if(!valid){value="light";window.localStorage.setItem(key,value)}var isDark=value==="dark"||(value==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var root=document.documentElement;root.classList.remove(isDark?"light":"dark");root.classList.add(isDark?"dark":"light");root.style.colorScheme=isDark?"dark":"light"}catch(error){document.documentElement.classList.remove("dark");document.documentElement.classList.add("light");document.documentElement.style.colorScheme="light"}})();`,
          }}
        />
      </head>
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
