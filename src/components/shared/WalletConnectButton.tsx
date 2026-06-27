"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortenAddress } from "@/lib/utils";

type WalletConnectButtonProps = {
  className?: string;
};

export function WalletConnectButton({ className }: WalletConnectButtonProps) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openAccountModal, openChainModal, openConnectModal }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!connected) {
          return (
            <Button type="button" size="sm" className={className} onClick={openConnectModal}>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          );
        }

        if (chain.unsupported) {
          return (
            <Button type="button" size="sm" variant="outline" className={className} onClick={openChainModal}>
              Wrong network
            </Button>
          );
        }

        return (
          <Button type="button" size="sm" variant="outline" className={className} onClick={openAccountModal}>
            <Wallet className="mr-2 h-4 w-4" />
            {shortenAddress(account.address)}
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
