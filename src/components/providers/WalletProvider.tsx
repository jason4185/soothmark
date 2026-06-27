"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { soothmarkWarn } from "@/lib/debug";
import { GENLAYER_BRADBURY } from "@/lib/soothmarkContractConfig";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "soothmark-dev";

const wagmiConfig = getDefaultConfig({
  appName: "Soothmark",
  projectId: walletConnectProjectId,
  chains: [GENLAYER_BRADBURY],
  ssr: true,
});

type WalletProviderProps = {
  children: ReactNode;
};

export function WalletProvider({ children }: WalletProviderProps) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) {
      soothmarkWarn("WalletConnect project ID is missing. Wallet features may not work correctly.");
    }
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          modalSize="compact"
          theme={darkTheme({
            accentColor: "#5B8CFF",
            accentColorForeground: "#F8FAFC",
            borderRadius: "medium",
            overlayBlur: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
