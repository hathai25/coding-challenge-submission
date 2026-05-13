/**
 * Stubbed data hooks for the exercise. Both versions of `WalletPage`
 * pretend these come from a real wallet/price service. Tests replace
 * them via `vi.mock`.
 */

import type { Prices, WalletBalance } from "./types";

const sampleBalances: WalletBalance[] = [
  { currency: "OSMO", amount: 25, blockchain: "Osmosis" },
  { currency: "ETH", amount: 1.5, blockchain: "Ethereum" },
  { currency: "ZIL", amount: 1_000, blockchain: "Zilliqa" },
  { currency: "ARB", amount: 100, blockchain: "Arbitrum" },
  { currency: "NEO", amount: 5, blockchain: "Neo" },
  { currency: "DEAD", amount: 0, blockchain: "Ethereum" }, // zero balance
  { currency: "GHOST", amount: -3, blockchain: "Ethereum" }, // negative balance
];

const samplePrices: Prices = {
  OSMO: 1.5,
  ETH: 2_000,
  ZIL: 0.02,
  ARB: 1.2,
  NEO: 12,
  // DEAD intentionally missing, to exercise the missing-price code path.
};

export const useWalletBalances = (): WalletBalance[] => sampleBalances;

export const usePrices = (): Prices => samplePrices;
