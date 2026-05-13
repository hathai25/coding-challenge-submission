import * as React from "react";
import { cn } from "@/lib/utils";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
  value: string;
  onValueChange?: (value: string) => void;
  readOnly?: boolean;
};

/**
 * Numeric input that:
 *  - Accepts only digits + a single decimal point.
 *  - Strips thousands separators on paste.
 *  - Keeps a wide, tabular-nums display so amounts line up.
 */
export const AmountInput = React.forwardRef<HTMLInputElement, Props>(
  ({ value, onValueChange, className, readOnly, ...rest }, ref) => {
    const handleChange = (next: string) => {
      if (!onValueChange) return;
      const cleaned = next.replace(/,/g, "").replace(/[^\d.]/g, "");
      const parts = cleaned.split(".");
      const normalised =
        parts.length <= 1 ? cleaned : `${parts[0]}.${parts.slice(1).join("")}`;
      onValueChange(normalised);
    };

    return (
      <input
        ref={ref}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        readOnly={readOnly}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onPaste={(e) => {
          if (readOnly) return;
          e.preventDefault();
          handleChange(e.clipboardData.getData("text"));
        }}
        placeholder="0"
        className={cn(
          "w-full bg-transparent text-right text-3xl font-semibold tracking-tight tabular-nums outline-none placeholder:text-(--color-muted-fg)",
          readOnly && "cursor-default",
          className,
        )}
        {...rest}
      />
    );
  },
);
AmountInput.displayName = "AmountInput";
