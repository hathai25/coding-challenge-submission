import { memo } from "react";
import type { WalletRowProps } from "./types";

/**
 * Display-only row component. Memoised because parents typically re-create
 * the rows array; without `memo`, every parent render reconciles every row.
 */
const WalletRowImpl = ({
  className,
  amount,
  usdValue,
  formattedAmount,
  currency,
}: WalletRowProps) => (
  <div className={className} role="listitem" aria-label={`${currency} balance`}>
    <span data-testid="currency">{currency}</span>
    <span data-testid="amount">{formattedAmount}</span>
    <span data-testid="usd">${usdValue.toFixed(2)}</span>
    <span data-testid="raw-amount" hidden>
      {amount}
    </span>
  </div>
);

export const WalletRow = memo(WalletRowImpl);
WalletRow.displayName = "WalletRow";
