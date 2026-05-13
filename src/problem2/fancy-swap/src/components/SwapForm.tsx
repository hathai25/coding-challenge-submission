import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";

import { AmountInput } from "@/components/AmountInput";
import { TokenSelect } from "@/components/TokenSelect";
import { SwapDirectionButton } from "@/components/SwapDirectionButton";
import { Button } from "@/components/ui/button";
import { computeOutput, getRate } from "@/lib/swap-math";
import { formatToken, formatUsd } from "@/lib/format";
import { mockBalance } from "@/lib/tokens";
import type { Token } from "@/types/token";

type Props = {
  tokens: Token[];
};

const schema = z.object({
  amount: z
    .string()
    .min(1, "Enter an amount")
    .refine((v) => Number(v) > 0, "Amount must be greater than zero"),
});
type FormValues = z.infer<typeof schema>;

const findTokenBySymbol = (tokens: Token[], symbol: string | undefined) =>
  symbol ? (tokens.find((t) => t.symbol === symbol) ?? null) : null;

export const SwapForm = ({ tokens }: Props) => {
  const [fromSymbol, setFromSymbol] = useState<string | undefined>(undefined);
  const [toSymbol, setToSymbol] = useState<string | undefined>(undefined);

  // Pick sensible defaults once tokens load.
  useEffect(() => {
    if (tokens.length === 0) return;
    setFromSymbol((curr) => curr ?? tokens.find((t) => t.symbol === "ETH")?.symbol ?? tokens[0]?.symbol);
    setToSymbol((curr) =>
      curr ?? tokens.find((t) => t.symbol === "USDC")?.symbol ?? tokens[1]?.symbol ?? tokens[0]?.symbol,
    );
  }, [tokens]);

  const from = findTokenBySymbol(tokens, fromSymbol);
  const to = findTokenBySymbol(tokens, toSymbol);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "" },
    mode: "onChange",
  });

  const amountStr = watch("amount");
  const amountNum = Number(amountStr) || 0;

  const rate = useMemo(() => (from && to ? getRate(from, to) : null), [from, to]);
  const output = useMemo(() => computeOutput(amountNum, rate), [amountNum, rate]);

  const fromBalance = from ? mockBalance(from.symbol) : 0;
  const exceedsBalance = amountNum > fromBalance && amountNum > 0;
  const sameToken = from && to && from.symbol === to.symbol;
  const noQuote = from && to && rate === null;

  const handleFlip = () => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
  };

  const handleMax = () => {
    if (!from) return;
    setValue("amount", String(mockBalance(from.symbol)), { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    if (!from || !to || rate === null) return;
    // Simulate a network round-trip
    await new Promise((r) => window.setTimeout(r, 1200));
    toast.success("Swap confirmed", {
      description: `${values.amount} ${from.symbol} → ${formatToken(output)} ${to.symbol}`,
    });
  };

  const submitDisabled =
    !from ||
    !to ||
    sameToken ||
    noQuote ||
    exceedsBalance ||
    amountNum <= 0 ||
    isSubmitting;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-[calc(var(--radius)+8px)] border border-(--color-border) bg-(--color-card) p-5 shadow-xl shadow-black/5"
      noValidate
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">Swap</h2>
      </div>

      <Pane
        label="You pay"
        token={from}
        otherSymbol={to?.symbol}
        amount={amountStr}
        onAmountChange={(v) => setValue("amount", v, { shouldValidate: true })}
        onTokenChange={(t) => setFromSymbol(t.symbol)}
        tokens={tokens}
        balance={fromBalance}
        onMax={handleMax}
      />

      <div className="relative -my-3 flex h-0 items-center justify-center">
        <SwapDirectionButton onClick={handleFlip} disabled={!from || !to} />
      </div>

      <Pane
        label="You receive"
        token={to}
        otherSymbol={from?.symbol}
        amount={output === null ? "" : output === 0 ? "" : formatToken(output)}
        readOnly
        onAmountChange={() => {}}
        onTokenChange={(t) => setToSymbol(t.symbol)}
        tokens={tokens}
      />

      <RateRow from={from} to={to} rate={rate} />

      <input type="hidden" {...register("amount")} />

      <AnimatePresence initial={false}>
        {(errors.amount?.message || exceedsBalance || sameToken || noQuote) && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-3 text-sm text-(--color-destructive)"
            role="alert"
          >
            {sameToken
              ? "Pick two different tokens."
              : noQuote
              ? "No quote available for this pair."
              : exceedsBalance
              ? "Amount exceeds your balance."
              : errors.amount?.message}
          </motion.p>
        )}
      </AnimatePresence>

      <Button
        type="submit"
        size="lg"
        disabled={submitDisabled}
        className="mt-5 w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Confirming…
          </>
        ) : (
          "Confirm swap"
        )}
      </Button>
    </form>
  );
};

type PaneProps = {
  label: string;
  token: Token | null;
  otherSymbol: string | undefined;
  amount: string;
  readOnly?: boolean;
  onAmountChange: (v: string) => void;
  onTokenChange: (t: Token) => void;
  tokens: Token[];
  balance?: number;
  onMax?: () => void;
};

const Pane = ({
  label,
  token,
  otherSymbol,
  amount,
  readOnly,
  onAmountChange,
  onTokenChange,
  tokens,
  balance,
  onMax,
}: PaneProps) => {
  const usd = token && amount ? Number(amount) * token.priceUsd : null;
  return (
    <div className="rounded-[var(--radius)] bg-(--color-muted) p-4">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-(--color-muted-fg)">
        <span>{label}</span>
        {balance != null && token && (
          <button
            type="button"
            onClick={onMax}
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-(--color-accent)"
            aria-label={`Use maximum balance of ${formatToken(balance)} ${token.symbol}`}
          >
            <Wallet className="h-3 w-3" />
            <span className="tabular-nums">{formatToken(balance)}</span>
            <span className="ml-1 rounded bg-(--color-card) px-1 text-[10px] font-bold uppercase tracking-wider">
              max
            </span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <AmountInput
          value={amount}
          readOnly={readOnly}
          onValueChange={readOnly ? undefined : onAmountChange}
          aria-label={`${label} amount`}
        />
        <TokenSelect
          label={label}
          selected={token}
          tokens={tokens}
          disabledSymbol={otherSymbol}
          onSelect={onTokenChange}
        />
      </div>
      <div className="mt-1 text-right text-xs text-(--color-muted-fg) tabular-nums" aria-live="polite">
        {formatUsd(usd)}
      </div>
    </div>
  );
};

const RateRow = ({
  from,
  to,
  rate,
}: {
  from: Token | null;
  to: Token | null;
  rate: number | null;
}) => {
  if (!from || !to) return null;
  return (
    <div
      aria-live="polite"
      className="mt-3 flex items-center justify-between rounded-[var(--radius)] bg-(--color-bg) px-4 py-2 text-xs text-(--color-muted-fg)"
    >
      <span>Rate</span>
      <span className="font-mono tabular-nums text-(--color-fg)">
        {rate === null
          ? "Unavailable"
          : `1 ${from.symbol} ≈ ${formatToken(rate)} ${to.symbol}`}
      </span>
    </div>
  );
};
