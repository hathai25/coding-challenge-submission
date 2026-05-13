# Problem 1: Three Ways to Sum to `n`

> Given `n : integer`, return `1 + 2 + ... + n`. Result is assumed
> `< Number.MAX_SAFE_INTEGER` (≈ `2^53 − 1`).

This solution ships **five** implementations rather than three, so the
trade-offs (speed, memory, safety, expressiveness) can be compared directly,
plus a Vitest suite and a micro-benchmark.

## Run

```bash
npm install
npm test           # full Vitest suite (known values, equivalence, validation)
npm run bench      # ns/op micro-benchmark across variants
npm run typecheck  # strict TS check
```

## Variants at a glance

| Variant | Time | Space | Notes |
|---|---|---|---|
| `sum_to_n_formula` | **O(1)** | **O(1)** | Gauss closed-form. **Use this in production.** |
| `sum_to_n_iterative` | O(n) | O(1) | Simple loop. Useful as the reference. |
| `sum_to_n_reduce` | O(n) | O(n) | Functional / declarative. Allocates an array. |
| `sum_to_n_recursive` | O(n) | O(n) stack | Overflows the call stack around `n ≈ 10⁴`. Pedagogical only. |
| `sum_to_n_bigint` | O(1) | O(1) | `BigInt` Gauss for `n` beyond `Number.MAX_SAFE_INTEGER`. |

## Why five?

The challenge says "provide 3 unique implementations". Variants A-C
satisfy the literal ask. The two extras serve a real purpose:

- **`recursive`** is the implementation a naïve refactor would reach for.
  Including it (and the stack-overflow test that documents its limit)
  makes the case for `formula` empirical, not asserted.
- **`bigint`** addresses the unspoken question, "what if the constraint
  on `n` were lifted?" The prompt's `MAX_SAFE_INTEGER` ceiling translates
  to `n ≈ 1.34 × 10⁸`. Past that, `number` silently loses precision; the
  BigInt variant does not.

## Correctness

`sum_to_n.test.ts` covers:

- **Known values** for every variant at `n ∈ {0, 1, 2, 5, 10, 100, 1000}`.
- **Cross-variant equivalence** at seven inputs, every variant must agree.
- **Non-positive inputs** (`0`, `-1`, `-100`) return `0` (or `0n` for the
  BigInt variant).
- **Invalid inputs** (`1.5`, `NaN`, `±Infinity`) throw `TypeError`.
- **Safe-integer boundary**: `formula` is exact at `n = 134_217_727`, the
  largest `n` where `n(n+1)/2` fits in a `number`.
- **Stack-overflow documentation**: `recursive` throws `RangeError` at
  `n = 10⁶`, demonstrating why the formula matters.
- **BigInt beyond the boundary**: correct result at `n = 10⁹`.

## Benchmark (Apple Silicon, Node 22)

`npm run bench` output:

| variant | n = 1,000 | n = 100,000 | n = 10,000,000 |
|---|---|---|---|
| `iterative` | 650.6 ns | 68.4 µs | 6.86 ms |
| `formula` | 4.6 ns | 4.4 ns | 4.1 ns |
| `reduce` | 25.8 µs | 3.16 ms | 319.92 ms |
| `recursive` | 7.0 µs | n/a (stack overflow) | n/a (stack overflow) |

Read this row by row: `formula` cost is constant regardless of `n`;
`iterative` scales linearly; `reduce` is ~45× slower than `iterative`
because the intermediate array allocation dominates; `recursive`
overflows the V8 default stack already by `n = 100_000`.

## Design notes

- **Input validation** is centralised in `assertValidN`. Floats and
  non-finite values throw; negative integers return `0` (a documented
  convention, not an error, because the math is well-defined as an empty
  sum).
- **No `var`.** The reference candidate used `var`; this implementation
  uses `const` / `let` with strict TypeScript and `noUncheckedIndexedAccess`.
- **`variants` map** at the bottom of the source is for test ergonomics
  only, the named exports above are the documented API.
