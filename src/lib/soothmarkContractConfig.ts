import { localnet, studionet, testnetAsimov, testnetBradbury } from "genlayer-js/chains";
import type { Address } from "viem";

export const SOOTHMARK_CONTRACT_ADDRESS =
  (process.env.NEXT_PUBLIC_SOOTHMARK_CONTRACT_ADDRESS?.trim() ||
    "0xcd549621b4684086983E8639917D77ed39240CF4") as Address;

export const GENLAYER_BRADBURY = {
  id: 4221,
  name: "GenLayer Testnet Bradbury",
  nativeCurrency: {
    name: "GEN",
    symbol: "GEN",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-bradbury.genlayer.com"],
    },
    public: {
      http: ["https://rpc-bradbury.genlayer.com"],
    },
  },
  blockExplorers: {
    default: {
      name: "GenLayer Bradbury Explorer",
      url: "https://explorer-bradbury.genlayer.com",
    },
    chain: {
      name: "GenLayer Chain Explorer",
      url: "https://explorer-bradbury.genlayer.com",
    },
  },
} as const;

const chainMap = {
  localnet,
  studionet,
  testnetAsimov,
  testnetBradbury,
} as const;

export type SoothmarkChainName = keyof typeof chainMap;

export const soothmarkContractConfig = {
  address: SOOTHMARK_CONTRACT_ADDRESS,
  chainName: (process.env.NEXT_PUBLIC_SOOTHMARK_CHAIN?.trim() || "testnetBradbury") as SoothmarkChainName,
  endpoint: process.env.NEXT_PUBLIC_SOOTHMARK_RPC_ENDPOINT?.trim() || "https://rpc-bradbury.genlayer.com",
  explorerUrl: process.env.NEXT_PUBLIC_GENLAYER_EXPLORER_URL?.trim() || GENLAYER_BRADBURY.blockExplorers.default.url,
  useMocks: process.env.NEXT_PUBLIC_SOOTHMARK_USE_MOCKS === "true",
  enableGlobalAuditScan: process.env.NEXT_PUBLIC_SOOTHMARK_ENABLE_GLOBAL_AUDIT_SCAN === "true",
  receiptStatus: process.env.NEXT_PUBLIC_SOOTHMARK_RECEIPT_STATUS?.trim() || "ACCEPTED",
};

export function getSoothmarkChain() {
  return chainMap[soothmarkContractConfig.chainName] ?? testnetBradbury;
}

export function requireSoothmarkContractAddress(): Address {
  if (!soothmarkContractConfig.address || soothmarkContractConfig.address.trim() === "") {
    throw new Error("Missing NEXT_PUBLIC_SOOTHMARK_CONTRACT_ADDRESS.");
  }
  return soothmarkContractConfig.address;
}

export function getSoothmarkTransactionExplorerUrl(transactionHash: string | undefined): string {
  if (!transactionHash || !soothmarkContractConfig.explorerUrl) {
    return "";
  }

  return `${soothmarkContractConfig.explorerUrl.replace(/\/$/, "")}/tx/${transactionHash}`;
}
