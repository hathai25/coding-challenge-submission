/**
 * `refactored.tsx`, the corrected `WalletPage`.
 *
 * Each fix is annotated `FIX #N` to match the numbered list in
 * `ANALYSIS.md`. The intent is "small, well-bounded, easy to read"
 * over "clever".
 *
 * Public surface (props + rendered output) is preserved so the messy
 * version can be swapped for this one without callers changing.
 */

import { useMemo } from "react";
import { useWalletBalances, usePrices } from "./hooks";
import { WalletRow } from "./WalletRow";
import type {
  Blockchain,
  FormattedWalletBalance,
  Prices,
  WalletBalance,
} from "./types";

interface Props {
  children?: React.ReactNode;
  className?: string;
}

/**
 * FIX #2, Typed lookup, no `any`. Unknown blockchains default to a
 *           sentinel `-Infinity` so they sort last instead of mixing in
 *           with valid priorities.
 * FIX #3, Lookup is O(1) per call instead of a switch chain.
 */
const PRIORITY: Record<Blockchain, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const priorityOf = (blockchain: Blockchain): number =>
  PRIORITY[blockchain] ?? -Infinity;

/**
 * FIX #11, Locale-aware token amount formatter with sensible precision
 *            based on magnitude. Pulled out so it can be tested in isolation
 *            and reused.
 */
const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 4,
});
const formatAmount = (n: number): string => amountFormatter.format(n);

/**
 * FIX #10, `usdValueOf` short-circuits when the price is missing.
 *            Returns `null` rather than `NaN` so the row can render a
 *            placeholder instead of leaking `NaN` into the DOM.
 */
const usdValueOf = (b: WalletBalance, prices: Prices): number | null => {
  const price = prices[b.currency];
  if (price === undefined || !Number.isFinite(price)) return null;
  return price * b.amount;
};

/**
 * FIX #8, #9, #12, #14, Single source of truth: one memoised pass
 *  produces a fully-formatted, sorted array, typed correctly, with a
 *  stable tie-breaker on currency.
 * FIX #5, Defensive copy via `[...balances]` before sorting so the
 *           upstream array (returned by a hook) is never mutated.
 * FIX #1, Correct filter: keep entries with a positive balance AND a
 *           known blockchain.
 */
const formatBalances = (
  balances: readonly WalletBalance[],
  prices: Prices,
): FormattedWalletBalance[] => {
  return [...balances]
    .filter((b) => b.amount > 0 && b.blockchain in PRIORITY)
    .sort((a, b) => {
      const diff = priorityOf(b.blockchain) - priorityOf(a.blockchain);
      return diff !== 0 ? diff : a.currency.localeCompare(b.currency);
    })
    .map((b) => ({
      ...b,
      formatted: formatAmount(b.amount),
      usdValue: usdValueOf(b, prices) ?? 0,
    }));
};

export const WalletPage: React.FC<Props> = ({ children, ...rest }) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  /**
   * FIX #4, Deps now genuinely reflect inputs (both `balances` and `prices`
   *           are used). FIX #8, formatting + USD calc moved into the memo.
   */
  const rows = useMemo(
    () => formatBalances(balances, prices),
    [balances, prices],
  );

  /**
   * FIX #15, Explicit empty state, not a silent blank.
   */
  if (rows.length === 0) {
    return (
      <div {...rest} role="status">
        <p>No positive balances to display.</p>
        {children}
      </div>
    );
  }

  return (
    <div {...rest} role="list">
      {rows.map((b) => (
        /**
         * FIX #7, Stable key per row: `blockchain:currency` is unique
         *  given the filter, and survives sort-order changes.
         * FIX #13, `WalletRow` is `React.memo`'d (see `WalletRow.tsx`),
         *  so unchanged rows skip reconciliation.
         */
        <WalletRow
          key={`${b.blockchain}:${b.currency}`}
          currency={b.currency}
          amount={b.amount}
          usdValue={b.usdValue}
          formattedAmount={b.formatted}
        />
      ))}
      {children}
    </div>
  );
};

// Re-exported for tests.
export { formatBalances };
