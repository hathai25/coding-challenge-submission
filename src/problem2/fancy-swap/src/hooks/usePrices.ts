import { useQuery } from "@tanstack/react-query";
import { fetchTokens } from "@/lib/priceClient";
import type { Token } from "@/types/token";

export const PRICES_QUERY_KEY = ["prices"] as const;

export const usePrices = () =>
  useQuery<Token[], Error>({
    queryKey: PRICES_QUERY_KEY,
    queryFn: ({ signal }) => fetchTokens(signal),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
