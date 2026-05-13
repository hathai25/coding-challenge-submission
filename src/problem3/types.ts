/**
 * Shared types for the "Messy React" exercise. Pulled out so `messy.tsx`,
 * `refactored.tsx`, and the test file can all import them.
 */

export type Blockchain = "Osmosis" | "Ethereum" | "Arbitrum" | "Zilliqa" | "Neo";

export interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain;
}

export interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  usdValue: number;
}

export type Prices = Readonly<Record<string, number>>;

/**
 * Props expected by the (imaginary) `WalletRow` row component. Defined here
 * so both the messy version and the refactored version can render with the
 * same surface.
 */
export interface WalletRowProps {
  className?: string;
  amount: number;
  usdValue: number;
  formattedAmount: string;
  currency: string;
}
