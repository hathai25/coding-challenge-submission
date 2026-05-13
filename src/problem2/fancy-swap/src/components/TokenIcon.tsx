import { useState } from "react";
import { tokenIconUrl } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  className?: string;
  size?: number;
};

export const TokenIcon = ({ symbol, className, size = 28 }: Props) => {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-(--color-accent) text-(--color-accent-fg) font-semibold",
          className,
        )}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {symbol.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={tokenIconUrl(symbol)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setErrored(true)}
      className={cn("shrink-0 rounded-full bg-(--color-muted)", className)}
    />
  );
};
