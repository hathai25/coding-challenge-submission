import { useMemo, useState } from "react";
import { List, type RowComponentProps } from "react-window";
import { ChevronDown, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TokenIcon } from "@/components/TokenIcon";
import { useDebounced } from "@/hooks/useDebounced";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Token } from "@/types/token";

type Props = {
  label: string;
  selected: Token | null;
  tokens: Token[];
  disabledSymbol?: string;
  onSelect: (token: Token) => void;
};

const ROW_HEIGHT = 56;
const MAX_LIST_HEIGHT = 360;

type RowProps = {
  tokens: Token[];
  selectedSymbol: string | undefined;
  disabledSymbol: string | undefined;
  onSelect: (token: Token) => void;
};

const TokenRow = ({
  index,
  style,
  ariaAttributes,
  tokens,
  selectedSymbol,
  disabledSymbol,
  onSelect,
}: RowComponentProps<RowProps>) => {
  const token = tokens[index];
  if (!token) return null;
  const isDisabled = token.symbol === disabledSymbol;
  const isSelected = token.symbol === selectedSymbol;
  return (
    <div style={style} className="px-2" {...ariaAttributes}>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => onSelect(token)}
        className={cn(
          "flex h-full w-full items-center gap-3 rounded-[var(--radius)] px-3 text-left transition-colors",
          "hover:bg-(--color-muted) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-ring)",
          isSelected && "bg-(--color-accent)",
          isDisabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
        )}
      >
        <TokenIcon symbol={token.symbol} size={32} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-mono text-sm font-semibold">{token.symbol}</span>
          <span className="text-xs text-(--color-muted-fg) tabular-nums">
            {formatUsd(token.priceUsd)}
          </span>
        </div>
        {isDisabled && <span className="text-xs text-(--color-muted-fg)">paired</span>}
      </button>
    </div>
  );
};

export const TokenSelect = ({ label, selected, tokens, disabledSymbol, onSelect }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 120);

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toUpperCase();
    if (!q) return tokens;
    return tokens.filter((t) => t.symbol.toUpperCase().includes(q));
  }, [tokens, debouncedQuery]);

  const handleSelect = (token: Token) => {
    onSelect(token);
    setOpen(false);
    setQuery("");
  };

  const listHeight = Math.min(filtered.length * ROW_HEIGHT, MAX_LIST_HEIGHT);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${selected?.symbol ?? "Select a token"}`}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-(--color-muted) px-3 text-sm font-semibold transition-colors hover:bg-(--color-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-ring)"
        >
          {selected ? (
            <>
              <TokenIcon symbol={selected.symbol} size={24} />
              <span className="font-mono tracking-tight">{selected.symbol}</span>
            </>
          ) : (
            <span className="text-(--color-muted-fg)">Select token</span>
          )}
          <ChevronDown className="h-4 w-4 opacity-60" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Select a token</DialogTitle>
          <DialogDescription>
            {tokens.length.toLocaleString()} tokens available · prices via Switcheo
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4">
          <label className="sr-only" htmlFor="token-search">
            Search tokens
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--color-muted-fg)"
            />
            <input
              id="token-search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by symbol (e.g. ETH)"
              className="h-11 w-full rounded-[var(--radius)] border border-(--color-border) bg-(--color-input) pl-9 pr-3 text-sm outline-none transition-colors focus:border-(--color-ring) focus:ring-2 focus:ring-(--color-ring)/30"
              aria-controls="token-list"
            />
          </div>
        </div>

        <div id="token-list" className="px-2 pb-4">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-(--color-muted-fg)">
              No tokens match &ldquo;{debouncedQuery}&rdquo;.
            </p>
          ) : (
            <List
              rowCount={filtered.length}
              rowHeight={ROW_HEIGHT}
              rowComponent={TokenRow}
              rowProps={{
                tokens: filtered,
                selectedSymbol: selected?.symbol,
                disabledSymbol,
                onSelect: handleSelect,
              }}
              style={{ height: listHeight }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
