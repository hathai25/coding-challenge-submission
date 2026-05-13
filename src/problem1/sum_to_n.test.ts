import { describe, it, expect } from "vitest";
import {
  sum_to_n_iterative,
  sum_to_n_formula,
  sum_to_n_reduce,
  sum_to_n_recursive,
  sum_to_n_bigint,
  variants,
} from "./sum_to_n.ts";

const KNOWN: Array<[number, number]> = [
  [0, 0],
  [1, 1],
  [2, 3],
  [5, 15],
  [10, 55],
  [100, 5050],
  [1000, 500500],
];

describe("sum_to_n, known values", () => {
  for (const [name, fn] of Object.entries(variants)) {
    describe(name, () => {
      for (const [input, expected] of KNOWN) {
        it(`sum_to_n_${name}(${input}) === ${expected}`, () => {
          expect(fn(input)).toBe(expected);
        });
      }
    });
  }
});

describe("sum_to_n, equivalence across variants", () => {
  const inputs = [0, 1, 3, 7, 25, 99, 1000];
  for (const n of inputs) {
    it(`all variants agree at n=${n}`, () => {
      const results = Object.values(variants).map((fn) => fn(n));
      const [first, ...rest] = results;
      for (const r of rest) expect(r).toBe(first);
    });
  }
});

describe("sum_to_n, non-positive inputs", () => {
  it.each([0, -1, -100])("returns 0 for n=%i", (n) => {
    expect(sum_to_n_iterative(n)).toBe(0);
    expect(sum_to_n_formula(n)).toBe(0);
    expect(sum_to_n_reduce(n)).toBe(0);
    expect(sum_to_n_recursive(n)).toBe(0);
    expect(sum_to_n_bigint(n)).toBe(0n);
  });
});

describe("sum_to_n, input validation", () => {
  it.each([1.5, NaN, Infinity, -Infinity])("throws on n=%s", (n) => {
    expect(() => sum_to_n_iterative(n)).toThrow(TypeError);
    expect(() => sum_to_n_formula(n)).toThrow(TypeError);
    expect(() => sum_to_n_reduce(n)).toThrow(TypeError);
  });
});

describe("sum_to_n, formula safe-integer boundary", () => {
  // Largest n where n*(n+1)/2 stays within Number.MAX_SAFE_INTEGER (2^53 - 1).
  // n ≈ floor(sqrt(2 * MAX_SAFE_INTEGER)) ≈ 134_217_727.
  const safeN = 134_217_727;
  it(`formula stays exact at n=${safeN}`, () => {
    const r = sum_to_n_formula(safeN);
    expect(Number.isSafeInteger(r)).toBe(true);
    expect(r).toBe((safeN * (safeN + 1)) / 2);
  });
});

describe("sum_to_n, recursion stack limit (documentation test)", () => {
  it("recursive variant overflows for large n (illustrates why formula wins)", () => {
    // Exact threshold varies by engine; 1_000_000 is well past V8's default.
    expect(() => sum_to_n_recursive(1_000_000)).toThrow(RangeError);
  });
});

describe("sum_to_n_bigint, beyond Number.MAX_SAFE_INTEGER", () => {
  it("works for n past the safe-integer boundary", () => {
    const huge = 1_000_000_000n;
    // Closed-form check: n * (n+1) / 2
    expect(sum_to_n_bigint(huge)).toBe((huge * (huge + 1n)) / 2n);
  });

  it("accepts a number arg and returns bigint", () => {
    expect(sum_to_n_bigint(10)).toBe(55n);
  });
});
