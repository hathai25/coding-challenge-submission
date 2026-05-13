# Problem 2: Fancy Swap

A clean, accessible, real-time token swap UI. Built to demonstrate
production-quality frontend habits in a single screen.

![architecture: data → math → form → UI](https://img.shields.io/badge/architecture-pure_lib_%2B_hooks_%2B_ui-1f6feb)

## Run

```bash
npm install
npm run dev         # http://localhost:5173
npm run build       # production bundle
npm test            # Vitest + RTL (27 tests)
npm run typecheck   # strict TS check, no emit
```

### Docker

A multi-stage `Dockerfile` is included: build with Node 22 (alpine),
serve the static bundle with `nginx:1.27-alpine` on port `8080`. The
runtime stage drops to the unprivileged `nginx` user, sets sensible
security headers, configures SPA fallback to `index.html`, and
long-caches hashed assets.

```bash
docker build -t fancy-swap .
docker run --rm -p 8080:8080 fancy-swap
# → http://localhost:8080
```

## What it does

1. Fetches live token prices from
   `https://interview.switcheo.com/prices.json` via TanStack Query
   (60s stale, retry + backoff, abort on unmount).
2. Lets you pick "from" and "to" tokens from a virtualised, searchable
   list of ~150 tokens (dialog opens with keyboard focus, `Esc` closes).
3. Computes the output amount in real time as you type, with USD
   equivalents on both legs and a live exchange-rate row.
4. Flips the pair with an animated arrow button.
5. Validates input (must be > 0, must not exceed mocked wallet balance,
   tokens must differ) and renders inline errors.
6. Simulates submission with a 1.2s spinner and a confirmation toast.

## Stack

| Concern | Choice | Why |
|---|---|---|
| Bundler | **Vite 8** | Fast dev server, native ESM, latest in May 2026. |
| UI | **React 19** | Latest stable; uses native `<form>` actions and ref-as-prop. |
| Styling | **Tailwind v4** (`@theme` CSS-first) | No config file, design tokens live in `index.css`. |
| Components | **shadcn-style** primitives over Radix | Copy-in primitives keep us in full control; Dialog/focus-trap from Radix. |
| Data fetching | **TanStack Query v5** | Caching, retry, abort signal, stale-while-revalidate, query devtools-ready. |
| Forms | **react-hook-form + Zod** | Uncontrolled inputs, schema validation, zero re-render storms. |
| Animations | **motion** (Framer Motion successor) | The flip button + error pop only, motion stays out of the way. |
| Lists | **react-window v2** | Virtualised token list (~150 rows), only paints what's on screen. |
| Toasts | **sonner** | Lightweight, a11y-aware. |
| Tests | **Vitest 4 + RTL 16 + jsdom** | Same engine as build, no Jest config overhead. |
| TypeScript | **6.x** | `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`. |

## Architecture

```
src/
├── lib/                  # Pure, testable logic, no React imports.
│   ├── priceClient.ts    # fetch + normalise + dedupe Switcheo feed
│   ├── swap-math.ts      # getRate, computeOutput, quote
│   ├── format.ts         # Intl.NumberFormat-based token + USD formatters
│   └── tokens.ts         # icon URL resolver + mocked balance
│
├── hooks/                # React glue around lib/, one hook per concern.
│   ├── usePrices.ts      # TanStack Query wrapper
│   ├── useTheme.ts       # prefers-color-scheme + localStorage
│   └── useDebounced.ts   # generic debounce
│
├── components/
│   ├── ui/               # shadcn-style primitives (button, dialog, skeleton)
│   ├── SwapForm.tsx      # orchestrator, composes inputs, math, validation
│   ├── TokenSelect.tsx   # virtualised modal token picker
│   ├── AmountInput.tsx   # numeric input that strips commas, single decimal
│   ├── SwapDirectionButton.tsx
│   ├── TokenIcon.tsx     # remote SVG + initials fallback
│   └── ThemeToggle.tsx
│
├── types/token.ts        # Token, SwapQuote
├── test/setup.ts         # @testing-library/jest-dom matchers + cleanup
└── __tests__/            # Co-located by file
```

The rule throughout: **pure functions in `lib/`, side-effects in hooks,
JSX-only in components**. The two layers below `components/` have no
React imports.

## UX details worth a second look

- **`aria-live="polite"` on the rate row** so screen readers announce
  "1 ETH ≈ 24.31 USDC" updates without interrupting the user.
- **`tabular-nums` + `font-mono` on amounts**: figures line up under
  each other even as digits change.
- **MAX button** under each "you pay" pane fills in the mocked balance
  via `setValue("amount", …, { shouldValidate: true })`, so validation
  runs immediately.
- **Direction-swap button** uses `motion`'s `whileHover` + `whileTap`,
  not CSS, so it composes with `disabled` cleanly.
- **Token list virtualisation**: at ~150 tokens the perf difference is
  invisible, but the pattern scales to thousands without touching the
  consumer. Rows render with `ariaAttributes` (role="listitem",
  aria-posinset, aria-setsize) from react-window v2.
- **Paste handler** in `AmountInput` strips commas and non-digits, try
  pasting `1,234.56` from a spreadsheet.
- **Loading + error + empty states** all have dedicated renders. There's
  no path where the user sees a blank screen.
- **Dark mode** uses `prefers-color-scheme` initially, persists choice
  to `localStorage`. Tokens are defined in OKLCH so both palettes have
  perceptually matched lightness.
- **`react-window` row buttons disable** the token already picked on the
  other side ("paired" badge) instead of letting you create a no-op
  pair and then erroring.

## Testing

| File | What it locks down |
|---|---|
| `swap-math.test.ts` | Rate calc, output calc, null-rate propagation, edge cases (zero, negative, NaN, Infinity). |
| `priceClient.test.ts` | Dedupe by latest date, drop zero/negative/missing prices, alphabetise. |
| `format.test.ts` | Token + USD formatting at all magnitudes, including null/NaN producing `"-"`. |
| `SwapForm.test.tsx` | End-to-end render, default ETH→USDC, output updates on type, flip button, MAX button, balance-exceeded error, rate row. |

Run with `npm test`. All 27 tests should pass in ~1.5s.

## Differentiation vs the reference candidate

The passed candidate's submission (`zylim726:OLIVIA_CODE_CHALLENGE`)
used Vue 3 + plain CSS, mock prices, and no tests. This implementation:

- Real Switcheo price feed with dedupe + abort-on-unmount.
- Strict TS 6 with `noUncheckedIndexedAccess`.
- 27 tests covering math, normalisation, formatters, and the form.
- a11y baked in (aria-live, aria-label on every interactive control,
  focus management via Radix Dialog, sr-only labels for the search).
- Dark mode with OKLCH design tokens.
- Virtualised token list.

## Known limitations

- **Mocked balances**: there's no wallet. `mockBalance(symbol)` returns
  a deterministic 100-1000 range so MAX has something to click. A real
  app would replace this with a wallet hook (`useAccount()`,
  `useTokenBalance()`).
- **No on-chain swap**: submit just `setTimeout(1200)` then toasts. The
  point is to test the UI, not move money.
- **Single bundle (562 kB)**: would code-split the Dialog and the
  virtualised list in a real app, not worth it for one screen.
- **No browser screenshot in this submission**: code was built and
  tests pass headlessly in jsdom; design tokens and component output
  were not visually verified. Running `npm run dev` and opening
  `http://localhost:5173` shows the live UI.
