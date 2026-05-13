import { Toaster } from "sonner";
import { AlertCircle } from "lucide-react";
import { SwapForm } from "@/components/SwapForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrices } from "@/hooks/usePrices";

const App = () => {
  const { data: tokens, isPending, isError, error, refetch } = usePrices();

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-2 px-4 py-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-(--color-primary) to-(--color-accent)" />
          <span className="font-mono text-sm font-bold tracking-tight">fancy-swap</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-col">
        {isPending && <LoadingState />}

        {isError && (
          <ErrorState
            message={error?.message ?? "Unable to load prices."}
            onRetry={() => void refetch()}
          />
        )}

        {tokens && tokens.length > 0 && <SwapForm tokens={tokens} />}

        {tokens && tokens.length === 0 && (
          <ErrorState message="No tokens available." onRetry={() => void refetch()} />
        )}
      </main>

      <footer className="text-center text-xs text-(--color-muted-fg)">
        Prices from{" "}
        <a
          className="underline-offset-2 hover:underline"
          href="https://interview.switcheo.com/prices.json"
          rel="noreferrer"
          target="_blank"
        >
          interview.switcheo.com
        </a>{" "}
        · refreshed every 60s
      </footer>

      <Toaster position="top-center" richColors />
    </div>
  );
};

const LoadingState = () => (
  <div
    role="status"
    aria-label="Loading prices"
    className="rounded-[calc(var(--radius)+8px)] border border-(--color-border) bg-(--color-card) p-5"
  >
    <Skeleton className="mb-4 h-6 w-24" />
    <Skeleton className="mb-2 h-24 w-full" />
    <Skeleton className="mb-2 h-24 w-full" />
    <Skeleton className="mt-4 h-11 w-full" />
  </div>
);

const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div
    role="alert"
    className="rounded-[calc(var(--radius)+8px)] border border-(--color-destructive)/40 bg-(--color-card) p-6 text-center"
  >
    <AlertCircle
      className="mx-auto mb-3 h-8 w-8 text-(--color-destructive)"
      aria-hidden="true"
    />
    <p className="mb-4 text-sm">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="text-sm font-medium text-(--color-primary) underline-offset-2 hover:underline"
    >
      Try again
    </button>
  </div>
);

export default App;
