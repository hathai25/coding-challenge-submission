import { describe, it, expect } from "vitest";
import { computeOutput, getRate, quote } from "@/lib/swap-math";
import type { Token } from "@/types/token";

const eth: Token = { symbol: "ETH", priceUsd: 2_000, lastUpdated: "2024-01-01" };
const usdc: Token = { symbol: "USDC", priceUsd: 1, lastUpdated: "2024-01-01" };
const noPrice: Token = { symbol: "ZERO", priceUsd: 0, lastUpdated: "2024-01-01" };

describe("getRate", () => {
  it("returns from/to ratio", () => {
    expect(getRate(eth, usdc)).toBe(2_000);
    expect(getRate(usdc, eth)).toBe(0.0005);
  });

  it("returns null when either price is non-positive", () => {
    expect(getRate(eth, noPrice)).toBeNull();
    expect(getRate(noPrice, eth)).toBeNull();
  });
});

describe("computeOutput", () => {
  it("multiplies amount by rate", () => {
    expect(computeOutput(2, 2_000)).toBe(4_000);
  });

  it("returns 0 for zero or negative amount", () => {
    expect(computeOutput(0, 2_000)).toBe(0);
    expect(computeOutput(-5, 2_000)).toBe(0);
  });

  it("returns null when rate is null", () => {
    expect(computeOutput(2, null)).toBeNull();
  });

  it("returns 0 for non-finite amount", () => {
    expect(computeOutput(NaN, 2_000)).toBe(0);
    expect(computeOutput(Infinity, 2_000)).toBe(0);
  });
});

describe("quote", () => {
  it("returns a complete quote for valid pair", () => {
    const q = quote(eth, usdc, 0.5);
    expect(q).toEqual({
      from: eth,
      to: usdc,
      amountIn: 0.5,
      amountOut: 1_000,
      rate: 2_000,
    });
  });

  it("returns null when rate is unavailable", () => {
    expect(quote(eth, noPrice, 1)).toBeNull();
  });
});
