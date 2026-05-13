import type { Token } from "@/types/token";

const PRICES_URL = "https://interview.switcheo.com/prices.json";

type RawPriceEntry = {
  currency: string;
  date: string;
  price: number;
};

/**
 * Normalises the upstream price feed.
 *
 * The Switcheo feed contains:
 *   - Multiple entries per currency at different timestamps.
 *   - Entries with `price: undefined` or `0` for tokens that have no quote.
 *
 * We keep only the most recent positive price per symbol and surface a stable,
 * alphabetised token list ready for the UI.
 */
export const normalisePrices = (raw: readonly RawPriceEntry[]): Token[] => {
  const bySymbol = new Map<string, Token>();

  for (const entry of raw) {
    if (!entry?.currency || typeof entry.price !== "number" || entry.price <= 0) continue;
    const existing = bySymbol.get(entry.currency);
    if (!existing || new Date(entry.date) > new Date(existing.lastUpdated)) {
      bySymbol.set(entry.currency, {
        symbol: entry.currency,
        priceUsd: entry.price,
        lastUpdated: entry.date,
      });
    }
  }

  return Array.from(bySymbol.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
};

export const fetchTokens = async (signal?: AbortSignal): Promise<Token[]> => {
  const res = await fetch(PRICES_URL, { signal });
  if (!res.ok) {
    throw new Error(`Failed to load prices: HTTP ${res.status}`);
  }
  const raw = (await res.json()) as RawPriceEntry[];
  return normalisePrices(raw);
};
