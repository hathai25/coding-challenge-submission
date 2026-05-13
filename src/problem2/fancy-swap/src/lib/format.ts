const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const usdPreciseFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 6,
  minimumFractionDigits: 2,
});

/**
 * Format a number of tokens with up to 6 significant figures, dropping
 * trailing zeros. Returns "-" for null/NaN so UI never shows `NaN`.
 */
export const formatToken = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return "-";
  if (value === 0) return "0";
  const abs = Math.abs(value);
  const fractionDigits = abs >= 1 ? 4 : abs >= 0.01 ? 6 : 8;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
};

export const formatUsd = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return "-";
  return (Math.abs(value) < 1 ? usdPreciseFormatter : usdFormatter).format(value);
};
