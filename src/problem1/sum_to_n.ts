/**
 * Problem 1, Three (plus more) ways to sum from 1 to n.
 *
 * All variants accept any non-negative integer `n` and return `1 + 2 + ... + n`.
 * For `n <= 0` they return `0`. Non-integer or non-finite inputs throw.
 *
 * The challenge asks for three implementations; five are provided so trade-offs
 * (speed vs. memory vs. safety vs. style) can be compared directly.
 */

const assertValidN = (n: number): void => {
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new TypeError(`sum_to_n: expected a finite integer, got ${n}`);
  }
};

/**
 * Variant A, Iterative accumulator.
 *
 * - Time:  O(n)
 * - Space: O(1)
 *
 * The most "obvious" implementation. Useful as the reference behaviour
 * we expect the others to match.
 */
export const sum_to_n_iterative = (n: number): number => {
  assertValidN(n);
  if (n <= 0) return 0;
  let sum = 0;
  for (let i = 1; i <= n; i++) sum += i;
  return sum;
};

/**
 * Variant B, Gauss closed-form formula. **Recommended for production.**
 *
 * - Time:  O(1)
 * - Space: O(1)
 *
 * `n * (n + 1) / 2` always yields an integer because exactly one of
 * `n`, `n + 1` is even. Stays exact while the result is within
 * `Number.MAX_SAFE_INTEGER` (i.e. up to `n ≈ 9.4e7` per the prompt's
 * constraint). For larger `n` use {@link sum_to_n_bigint}.
 */
export const sum_to_n_formula = (n: number): number => {
  assertValidN(n);
  if (n <= 0) return 0;
  return (n * (n + 1)) / 2;
};

/**
 * Variant C, Functional / declarative.
 *
 * - Time:  O(n)
 * - Space: O(n)  (intermediate array)
 *
 * Shows idiomatic modern JS. The array allocation is wasted work for this
 * problem, but the style is valuable in pipelines where the sequence is
 * already in hand.
 */
export const sum_to_n_reduce = (n: number): number => {
  assertValidN(n);
  if (n <= 0) return 0;
  return Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a + b, 0);
};

/**
 * Variant D, Naive recursion.
 *
 * - Time:  O(n)
 * - Space: O(n)  (call stack)
 *
 * Throws `RangeError` from the engine at roughly `n > 10_000` (V8 default).
 * Included to illustrate why this is the *wrong* tool here, even though
 * the math is the same.
 */
export const sum_to_n_recursive = (n: number): number => {
  assertValidN(n);
  if (n <= 0) return 0;
  return n + sum_to_n_recursive(n - 1);
};

/**
 * Variant E, BigInt-safe Gauss.
 *
 * - Time:  O(1) (modulo BigInt arithmetic cost)
 * - Space: O(1)
 *
 * Works correctly for `n` far beyond `Number.MAX_SAFE_INTEGER`. The result
 * is a `bigint`; callers can narrow to `number` when known-safe.
 */
export const sum_to_n_bigint = (n: number | bigint): bigint => {
  const big = typeof n === "bigint" ? n : (assertValidN(n), BigInt(n));
  if (big <= 0n) return 0n;
  return (big * (big + 1n)) / 2n;
};

/**
 * Convenience map for tests/benchmarks. Keep last so explicit imports above
 * remain the documented API.
 */
export const variants = {
  iterative: sum_to_n_iterative,
  formula: sum_to_n_formula,
  reduce: sum_to_n_reduce,
  recursive: sum_to_n_recursive,
} as const;

export type VariantName = keyof typeof variants;
