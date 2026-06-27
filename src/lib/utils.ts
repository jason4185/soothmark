import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ValidationMechanism } from "@/types/audit";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string) {
  if (address.length <= 12) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const mechanismLabels: Record<ValidationMechanism, string> = {
  strict_eq: "Strict equality",
  run_nondet_unsafe: "run_nondet_unsafe",
  prompt_comparative: "Prompt comparative",
  prompt_non_comparative: "Prompt non-comparative",
  none: "None",
};
