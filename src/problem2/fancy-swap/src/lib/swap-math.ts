import type { SwapQuote, Token } from "@/types/token";

/**
 * Conversion rate: 1 `from` token = `getRate(from, to)` `to` tokens.
 *
 * Returns `null` when either price is missing or non-positive (the caller
 * should treat this as "no quote available", never silently compute 0).
 */
export const getRate = (from: Token, to: Token): number | null => {
  if (from.priceUsd <= 0 || to.priceUsd <= 0) return null;
  return from.priceUsd / to.priceUsd;
};

/**
 * Compute swap output. `null` inputs propagate to `null` output so the UI
 * can render an "unavailable" state instead of a misleading `NaN`/`0`.
 */
export const computeOutput = (amountIn: number, rate: number | null): number | null => {
  if (!Number.isFinite(amountIn) || amountIn <= 0) return 0;
  if (rate === null || !Number.isFinite(rate)) return null;
  return amountIn * rate;
};

/**
 * One-shot quote helper for tests and call sites that have everything ready.
 */
export const quote = (from: Token, to: Token, amountIn: number): SwapQuote | null => {
  const rate = getRate(from, to);
  if (rate === null) return null;
  const amountOut = computeOutput(amountIn, rate);
  if (amountOut === null) return null;
  return { from, to, amountIn, amountOut, rate };
};
