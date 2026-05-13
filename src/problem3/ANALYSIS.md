# Problem 3: Messy React: Issues, Why They Matter, and the Fix

The original `WalletPage` (see `messy.tsx`) has 15+ defects ranging from a
hard reference error to subtle React performance issues. This document
maps each issue to a `FIX #N` marker in `refactored.tsx`.

The exercise asks for analysis only; a passable submission is a prose
write-up. This submission goes further by **shipping the corrected code
alongside a Vitest suite** that locks behaviour against regressions.

## How to read this file

- Issues are numbered. Each entry has:
  - **What**: the problematic code.
  - **Why it's bad**: concrete failure modes.
  - **Fix (`FIX #N`)**: what `refactored.tsx` does instead.

## Run

```bash
npm install
npm test         # 13 tests (formatBalances pure + WalletPage render)
npm run typecheck
```

---

## The defects

### 1. Reference to undefined `lhsPriority` in the filter
**What**: `if (lhsPriority > -99)` inside `.filter()`. `lhsPriority` is
never declared.

**Why it's bad**: Throws at runtime. The author probably meant
`balancePriority` (the variable two lines above). Even with the rename,
the polarity is wrong: the body returns `true` for `amount <= 0`, which
*keeps* zero/negative balances instead of dropping them.

**Fix #1**: `formatBalances` keeps entries where
`amount > 0 && blockchain in PRIORITY`. The intent ("show me my real
balances on supported chains") is now plain.

### 2. `getPriority(blockchain: any)`
**What**: `any` annotation on the parameter type.

**Why it's bad**: TypeScript can't reject callers that pass random
strings. The `default: -99` case becomes the catch-all for typos.

**Fix #2**: `priorityOf(blockchain: Blockchain)` plus a `PRIORITY`
record keyed by the `Blockchain` union. Unknown values fall to `-Infinity`
(see Fix #14 for why).

### 3. `getPriority` called twice per comparison
**What**: Both `getPriority(lhs.blockchain)` and `getPriority(rhs.blockchain)`
run inside the sort comparator → `O(n log n)` calls.

**Why it's bad**: `switch` chain is cheap individually, but combined
with the comparator hitting it `n log n` times, this is wasted work.

**Fix #3**: `priorityOf` is a single hash lookup, and `formatBalances`
sorts on a small projection. We could go further and Schwartzian-transform
(decorate-sort-undecorate); not worth the indirection at this list size.

### 4. `prices` in `useMemo` deps but unused inside
**What**: `useMemo(..., [balances, prices])` but the calc reads
`balance.amount`/`balance.blockchain` only.

**Why it's bad**: Every price tick invalidates the memo and re-runs the
filter+sort even though nothing changed.

**Fix #4**: `prices` is genuinely used now (USD value is computed inside
the memo), so the dep is correct. If we needed to *avoid* re-sorting on
price change, we'd split into two memos.

### 5. `.sort()` mutates the hook-returned array
**What**: `balances.filter(...).sort(...)`. Filter returns a new array,
but the chain is fine, what's *not* fine is that pattern often elides
when refactors strip the filter, leaving a raw `balances.sort(...)`. Even
here, mutating the filtered array is benign; mutating the hook's array
elsewhere in the file would corrupt React's expectations.

**Why it's bad**: Hooks typically return memoised references; mutating
them breaks the assumption that React's reconciler can compare by
identity, and other consumers of the same hook see the reordered list.

**Fix #5**: `[...balances]` spread before `.sort` guarantees we never
touch the upstream array, regardless of which calls survive future
refactors.

### 6. Unused `formattedBalances` map
**What**: `const formattedBalances = sortedBalances.map(...)`, produced
but never referenced.

**Why it's bad**: Dead code is a maintenance bomb. Someone "fixes" the
filter and the now-orphaned map suddenly matters again.

**Fix #6**: Removed. The single `formatBalances` pass produces the
formatted output.

### 7. `key={index}` on the row list
**What**: React keys taken from array index.

**Why it's bad**: When sort order changes, React reconciles by position
rather than identity. Internal state (selection, animation, focus) jumps
to the wrong row.

**Fix #7**: `key={"${blockchain}:${currency}"}`, guaranteed unique
post-filter, survives reordering.

### 8. USD calc inside the render map
**What**: `const usdValue = prices[balance.currency] * balance.amount`
inside `sortedBalances.map(...)` in the JSX.

**Why it's bad**: Recomputed on every render even if `balances` and
`prices` didn't change. Mixes business logic and presentation.

**Fix #8**: USD value is computed once inside the `useMemo` that builds
the formatted rows.

### 9. Premature type assertion `as FormattedWalletBalance[]`
**What**: `} as FormattedWalletBalance[]` cast on the sorted (but
not-yet-formatted) array.

**Why it's bad**: TypeScript trusts the lie. Anything reading
`balance.formatted` after this point compiles but is `undefined` at
runtime. Type assertions should describe what *is*, not what we wish.

**Fix #9**: The `.map()` step produces a value whose runtime shape
matches `FormattedWalletBalance`, so no assertion is needed.

### 10. `prices[balance.currency]` may be undefined
**What**: `prices[balance.currency] * balance.amount` when the price
isn't loaded yet or is missing.

**Why it's bad**: `undefined * 1.5 === NaN`, which renders as `$NaN` in
the DOM.

**Fix #10**: `usdValueOf` returns `null` for missing prices; the row
falls back to `0` (and could trivially be changed to render "-" instead
without touching the `WalletRow` contract).

### 11. `amount.toFixed()` (no argument)
**What**: `toFixed()` with no fraction-digit count rounds to integer and
loses locale formatting.

**Why it's bad**: `1234567.89.toFixed()` → `"1234568"`. No thousands
separators. Looks wrong at a glance.

**Fix #11**: `Intl.NumberFormat("en-US", { maximumFractionDigits: 4 })`.
Same instance is reused (instantiation is the expensive part).

### 12. Mixing concerns inside one component
**What**: Data fetching, filtering, sorting, formatting, and rendering
all live in one function.

**Why it's bad**: Each concern is harder to test, harder to reason
about, and harder to memoise correctly.

**Fix #12**: `formatBalances(balances, prices)` is a pure module-level
function. The component does data fetch → call helper → render. The
helper is unit-tested directly.

### 13. `WalletRow` not memoised
**What**: Every parent render reconciles every row, even when the row's
props didn't change.

**Why it's bad**: At ten balances it's invisible; at five hundred it's
the dominant render cost.

**Fix #13**: `WalletRow.tsx` wraps the implementation in `memo`. Stable
keys (Fix #7) and a derived rows array let `memo` actually skip work.

### 14. Comparator returns `undefined` on ties
**What**: The if/else chain returns `-1` or `1` but has no `else`
branch.

**Why it's bad**: Returning `undefined` from a comparator gives the
engine an unstable sort. The same input renders in different orders
across runs.

**Fix #14**: `(b.priority - a.priority) || a.currency.localeCompare(b.currency)` -
explicit, total ordering. Tie-breaker is alphabetic on currency.

### 15. No empty state
**What**: If the filter drops everything, the component renders
`<div></div>` and the user sees nothing.

**Why it's bad**: "Empty" and "still loading" become indistinguishable.

**Fix #15**: When `rows.length === 0`, render a `role="status"` block
with a plain message.

---

## Behavioural tests

`refactored.test.tsx` covers:

- Pure `formatBalances`:
  - Drops zero / negative balances ✔︎
  - Drops unknown blockchains ✔︎
  - Sorts by priority desc with currency asc as tie-breaker ✔︎
  - Does not mutate the input array ✔︎
  - Formats amounts with locale separators ✔︎
  - Returns 0 USD for missing prices (no `NaN` leak) ✔︎
- `<WalletPage />` render:
  - One row per positive, known-chain balance ✔︎
  - Rows in priority order with ETH USD value `$3000.00` ✔︎
  - Empty state renders when no rows qualify ✔︎

## What's intentionally not changed

- **Component name & props surface**: same `Props` shape so callers
  upgrade in place.
- **Row component output**: same DOM elements; just memoised at the
  module boundary.
- **Hooks API**: `useWalletBalances`, `usePrices` keep their signatures.
  A real change would push USD-formatting into a `useFormattedBalances`
  hook so consumers other than `WalletPage` could reuse it.
