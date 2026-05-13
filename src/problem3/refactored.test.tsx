import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { formatBalances, WalletPage } from "./refactored";
import type { Prices, WalletBalance } from "./types";

vi.mock("./hooks", () => {
  return {
    useWalletBalances: () => sampleBalances,
    usePrices: () => samplePrices,
  };
});

const sampleBalances: WalletBalance[] = [
  { currency: "OSMO", amount: 25, blockchain: "Osmosis" },
  { currency: "ETH", amount: 1.5, blockchain: "Ethereum" },
  { currency: "ZIL", amount: 1_000, blockchain: "Zilliqa" },
  { currency: "ARB", amount: 100, blockchain: "Arbitrum" },
  { currency: "NEO", amount: 5, blockchain: "Neo" },
  { currency: "DEAD", amount: 0, blockchain: "Ethereum" },
  { currency: "GHOST", amount: -3, blockchain: "Ethereum" },
];

const samplePrices: Prices = {
  OSMO: 1.5,
  ETH: 2_000,
  ZIL: 0.02,
  ARB: 1.2,
  NEO: 12,
};

describe("formatBalances (pure)", () => {
  it("keeps only positive balances on known blockchains", () => {
    const out = formatBalances(sampleBalances, samplePrices);
    const currencies = out.map((b) => b.currency);
    expect(currencies).not.toContain("DEAD"); // amount 0
    expect(currencies).not.toContain("GHOST"); // amount < 0
    expect(currencies).toEqual(expect.arrayContaining(["OSMO", "ETH", "ARB", "NEO", "ZIL"]));
  });

  it("sorts by priority desc, then currency asc as tie-breaker", () => {
    const out = formatBalances(sampleBalances, samplePrices);
    // Priorities: Osmosis 100 > Ethereum 50 > Arbitrum 30 > Zilliqa 20 = Neo 20
    // Tie on Zilliqa(ZIL) vs Neo(NEO) → "NEO" < "ZIL" alphabetically.
    expect(out.map((b) => b.currency)).toEqual([
      "OSMO",
      "ETH",
      "ARB",
      "NEO",
      "ZIL",
    ]);
  });

  it("does not mutate the input array", () => {
    const before = [...sampleBalances];
    formatBalances(sampleBalances, samplePrices);
    expect(sampleBalances).toEqual(before);
  });

  it("formats amounts with locale separators", () => {
    const out = formatBalances(sampleBalances, samplePrices);
    const zil = out.find((b) => b.currency === "ZIL")!;
    expect(zil.formatted).toBe("1,000");
  });

  it("falls back to 0 USD value when price is missing", () => {
    const balances: WalletBalance[] = [{ currency: "UNKNOWN", amount: 5, blockchain: "Ethereum" }];
    const [row] = formatBalances(balances, { ETH: 2_000 });
    expect(row?.usdValue).toBe(0); // missing price → null → 0 (no NaN leak)
  });

  it("filters out unknown blockchains rather than ranking them last", () => {
    const balances = [
      { currency: "X", amount: 1, blockchain: "Solana" as unknown as WalletBalance["blockchain"] },
      { currency: "ETH", amount: 1, blockchain: "Ethereum" as const },
    ] satisfies WalletBalance[];
    const out = formatBalances(balances, { ETH: 2_000, X: 1 });
    expect(out.map((b) => b.currency)).toEqual(["ETH"]);
  });
});

describe("<WalletPage />", () => {
  it("renders one row per positive balance, ordered by priority", () => {
    render(<WalletPage />);
    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(5);
    const currencies = items.map((el) => within(el).getByTestId("currency").textContent);
    expect(currencies).toEqual(["OSMO", "ETH", "ARB", "NEO", "ZIL"]);
  });

  it("renders USD values formatted to two decimal places", () => {
    render(<WalletPage />);
    const ethRow = screen.getByLabelText("ETH balance");
    expect(within(ethRow).getByTestId("usd")).toHaveTextContent("$3000.00");
  });

  it("renders the formatted amount", () => {
    render(<WalletPage />);
    const zilRow = screen.getByLabelText("ZIL balance");
    expect(within(zilRow).getByTestId("amount")).toHaveTextContent("1,000");
  });
});

describe("<WalletPage />, empty state", () => {
  it("renders an empty-state message when no balances qualify", async () => {
    vi.resetModules();
    vi.doMock("./hooks", () => ({
      useWalletBalances: () => [],
      usePrices: () => ({}),
    }));
    const { WalletPage: EmptyPage } = await import("./refactored");
    render(<EmptyPage />);
    expect(screen.getByRole("status")).toHaveTextContent(
      /no positive balances/i,
    );
  });
});
