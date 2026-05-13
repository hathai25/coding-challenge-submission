export type Token = {
  readonly symbol: string;
  readonly priceUsd: number;
  readonly lastUpdated: string;
};

export type SwapQuote = {
  readonly from: Token;
  readonly to: Token;
  readonly amountIn: number;
  readonly amountOut: number;
  readonly rate: number;
};
