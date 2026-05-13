/**
 * `messy.tsx`, the original `WalletPage` as posed by the challenge, kept
 * runnable so reviewers can compile-check the antipatterns themselves.
 *
 * Each issue is marked inline with `BUG #N` matching `ANALYSIS.md`.
 *
 * Do NOT use this code as-is. See `refactored.tsx` for the corrected version.
 */

import { useMemo } from "react";
import { useWalletBalances, usePrices } from "./hooks";
import { WalletRow } from "./WalletRow";
import type { WalletBalance, FormattedWalletBalance } from "./types";

interface Props {
  children?: React.ReactNode;
  className?: string;
}

// BUG #2, `getPriority` declared with `any`; TypeScript can't catch
// callers passing non-Blockchain strings.
const getPriority = (blockchain: any): number => {
  switch (blockchain) {
    case "Osmosis":
      return 100;
    case "Ethereum":
      return 50;
    case "Arbitrum":
      return 30;
    case "Zilliqa":
      return 20;
    case "Neo":
      return 20;
    default:
      return -99;
  }
};

export const MessyWalletPage: React.FC<Props> = (props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  const sortedBalances = useMemo(() => {
    return balances
      .filter((balance: WalletBalance) => {
        const balancePriority = getPriority(balance.blockchain);
        // BUG #1, `lhsPriority` is undefined (was meant to be
        // `balancePriority`). The whole filter clause is dead code, so
        // the `<= 0` branch decides things, and the polarity is inverted:
        // we KEEP entries with amount ≤ 0 instead of dropping them.
        // @ts-expect-error referencing undefined identifier on purpose for the demo
        if (lhsPriority > -99) {
          if (balance.amount <= 0) {
            return true;
          }
        }
        return false;
      })
      // BUG #5, `Array.prototype.sort` mutates in place. `balances` is
      // returned by a hook; mutating it can corrupt React's internal state.
      // BUG #3, `getPriority` is recomputed for every comparator call
      // (O(n log n) instead of O(n)).
      // BUG #14, comparator returns `undefined` on ties → unstable order.
      // @ts-expect-error preserving the original broken comparator on purpose
      .sort((lhs: WalletBalance, rhs: WalletBalance) => {
        const leftPriority = getPriority(lhs.blockchain);
        const rightPriority = getPriority(rhs.blockchain);
        if (leftPriority > rightPriority) {
          return -1;
        } else if (rightPriority > leftPriority) {
          return 1;
        }
      });
    // BUG #4, `prices` is in the deps array but unused by the calc;
    // every price refresh thrashes this memo for nothing.
  }, [balances, prices]) as FormattedWalletBalance[]; // BUG #9, type assertion lies; `formatted` isn't set yet.

  // BUG #6, `formattedBalances` is computed but never used. The actual
  // `rows` map below reads `balance.formatted` off the un-formatted array.
  const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
    return {
      ...balance,
      // BUG #11, `toFixed()` (default 0 fraction digits) and no locale
      // formatting. Also stringifies in a way that's hard to test against.
      formatted: balance.amount.toFixed(),
    };
  });

  const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
    // BUG #10, `prices[balance.currency]` may be undefined → `undefined * x`
    // is `NaN`, which propagates into the rendered USD value.
    // BUG #8, business logic (USD calc) inside the render map; should be
    // memoised alongside the filter/sort, not recomputed on every render.
    // @ts-expect-error preserving the original missing-undefined-check on purpose
    const usdValue = prices[balance.currency] * balance.amount;
    return (
      <WalletRow
        // BUG #7, `index` as a React key. When the sort order changes,
        // React reconciles by position and animates wrong rows.
        key={index}
        currency={balance.currency}
        amount={balance.amount}
        usdValue={usdValue}
        // BUG #12, `balance.formatted` doesn't exist on `WalletBalance`.
        // It "works" only because of the lying type assertion at #9.
        formattedAmount={balance.formatted}
      />
    );
  });

  // BUG #15, no empty state. If filter drops everything, the user sees
  // an empty `<div>` with no indication of "why".
  // BUG #13, `WalletRow` not memoised at the call site OR the component
  // level → every parent re-render reconciles every row even when the
  // row's props are unchanged.
  return <div {...rest}>{rows}{children}</div>;

  // Silence unused-var noise in the demo file; the variable's existence
  // is itself one of the bugs (#6).
  void formattedBalances;
};
