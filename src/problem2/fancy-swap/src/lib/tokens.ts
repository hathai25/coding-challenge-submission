/**
 * Resolve a token icon URL using the Switcheo token-icons GitHub repo.
 *
 * The repo hosts SVGs under `Switcheo/token-icons/main/tokens/<SYMBOL>.svg`.
 * Using a CDN URL means we don't need to vendor hundreds of SVG files.
 */
export const tokenIconUrl = (symbol: string): string =>
  `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${symbol}.svg`;

/**
 * Mocked per-token balance for demo purposes. A real app would read this
 * from a wallet connection; here we hash the symbol to one of a few clean,
 * round tiers so the MAX button always fills in something that "looks like"
 * a real wallet balance instead of a noisy fraction.
 */
const BALANCE_TIERS = [100, 250, 500, 1_000, 2_500, 5_000] as const;

export const mockBalance = (symbol: string): number => {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) >>> 0;
  return BALANCE_TIERS[h % BALANCE_TIERS.length]!;
};
