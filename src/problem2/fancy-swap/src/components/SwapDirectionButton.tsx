import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
};

export const SwapDirectionButton = ({ onClick, disabled, className }: Props) => (
  <motion.button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label="Swap input and output tokens"
    whileTap={{ scale: 0.92 }}
    whileHover={disabled ? undefined : { rotate: 180 }}
    transition={{ type: "spring", stiffness: 260, damping: 18 }}
    className={cn(
      "flex h-10 w-10 items-center justify-center rounded-full border-4 border-(--color-bg) bg-(--color-card) text-(--color-fg) shadow-md transition-colors",
      "hover:bg-(--color-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-ring)",
      disabled && "opacity-50",
      className,
    )}
  >
    <ArrowDown className="h-4 w-4" />
  </motion.button>
);
