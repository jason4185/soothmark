"use client";

import { useAccount } from "wagmi";
import { shortenAddress } from "@/lib/utils";

export type WalletIdentity = {
  address: string | null;
  isConnected: boolean;
  displayAddress: string;
};

export function useWalletIdentity(): WalletIdentity {
  const { address, isConnected } = useAccount();
  const normalizedAddress = address ?? null;

  return {
    address: normalizedAddress,
    isConnected: Boolean(isConnected && normalizedAddress),
    displayAddress: normalizedAddress ? shortenAddress(normalizedAddress) : "Not connected",
  };
}
