import { describe, it, expect } from "vitest";
import { normalisePrices } from "@/lib/priceClient";

describe("normalisePrices", () => {
  it("keeps only the most recent positive price per symbol", () => {
    const raw = [
      { currency: "ETH", price: 1_800, date: "2024-01-01T00:00:00Z" },
      { currency: "ETH", price: 2_000, date: "2024-02-01T00:00:00Z" },
      { currency: "USDC", price: 1, date: "2024-02-01T00:00:00Z" },
    ];
    const result = normalisePrices(raw);
    expect(result).toEqual([
      { symbol: "ETH", priceUsd: 2_000, lastUpdated: "2024-02-01T00:00:00Z" },
      { symbol: "USDC", priceUsd: 1, lastUpdated: "2024-02-01T00:00:00Z" },
    ]);
  });

  it("drops entries with missing or non-positive prices", () => {
    const raw = [
      { currency: "ETH", price: 2_000, date: "2024-02-01T00:00:00Z" },
      { currency: "BAD" } as unknown as { currency: string; price: number; date: string },
      { currency: "ZERO", price: 0, date: "2024-02-01T00:00:00Z" },
      { currency: "NEG", price: -1, date: "2024-02-01T00:00:00Z" },
    ];
    expect(normalisePrices(raw).map((t) => t.symbol)).toEqual(["ETH"]);
  });

  it("returns an alphabetised list", () => {
    const raw = [
      { currency: "ZZZ", price: 1, date: "2024-01-01T00:00:00Z" },
      { currency: "AAA", price: 1, date: "2024-01-01T00:00:00Z" },
      { currency: "MMM", price: 1, date: "2024-01-01T00:00:00Z" },
    ];
    expect(normalisePrices(raw).map((t) => t.symbol)).toEqual(["AAA", "MMM", "ZZZ"]);
  });
});
