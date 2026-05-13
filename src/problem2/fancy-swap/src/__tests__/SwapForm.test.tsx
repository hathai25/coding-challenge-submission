import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SwapForm } from "@/components/SwapForm";
import type { Token } from "@/types/token";

const tokens: Token[] = [
  { symbol: "ETH", priceUsd: 2_000, lastUpdated: "2024-01-01" },
  { symbol: "USDC", priceUsd: 1, lastUpdated: "2024-01-01" },
  { symbol: "WBTC", priceUsd: 40_000, lastUpdated: "2024-01-01" },
];

const setup = () => {
  const user = userEvent.setup();
  render(<SwapForm tokens={tokens} />);
  return { user };
};

describe("<SwapForm />", () => {
  it("renders ETH → USDC by default and computes output as user types", async () => {
    const { user } = setup();

    // Default ETH (from) and USDC (to)
    expect(screen.getByLabelText(/You pay: ETH/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/You receive: USDC/i)).toBeInTheDocument();

    const payInput = screen.getByLabelText(/You pay amount/i);
    await user.type(payInput, "1.5");

    // Output renders 3,000 USDC (1.5 ETH * 2000 USD/ETH ÷ 1 USD/USDC)
    const receiveInput = screen.getByLabelText(/You receive amount/i);
    expect(receiveInput).toHaveValue("3,000");
  });

  it("shows an error and disables submit when amount is empty", async () => {
    const { user } = setup();
    const submit = screen.getByRole("button", { name: /confirm swap/i });
    expect(submit).toBeDisabled();

    const input = screen.getByLabelText(/You pay amount/i);
    await user.type(input, "1");
    expect(submit).toBeEnabled();

    await user.clear(input);
    // Submit becomes disabled again
    expect(submit).toBeDisabled();
  });

  it("flips tokens via the direction button", async () => {
    const { user } = setup();
    const flipButton = screen.getByRole("button", {
      name: /swap input and output tokens/i,
    });

    await user.click(flipButton);

    expect(screen.getByLabelText(/You pay: USDC/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/You receive: ETH/i)).toBeInTheDocument();
  });

  it("MAX button fills in the from-token balance", async () => {
    const { user } = setup();
    const maxButton = screen.getByLabelText(/Use maximum balance/i);
    await user.click(maxButton);

    const input = screen.getByLabelText(/You pay amount/i) as HTMLInputElement;
    expect(input.value).not.toBe("");
    expect(Number(input.value.replace(/,/g, ""))).toBeGreaterThan(0);
  });

  it("shows balance exceeded error when amount > balance", async () => {
    const { user } = setup();
    const input = screen.getByLabelText(/You pay amount/i);
    await user.type(input, "999999999");
    const submit = screen.getByRole("button", { name: /confirm swap/i });
    expect(submit).toBeDisabled();
    expect(
      await screen.findByText(/Amount exceeds your balance/i),
    ).toBeInTheDocument();
  });

  it("renders the exchange rate row", () => {
    setup();
    // Rate is wrapped in a polite live region; assert by content
    expect(screen.getByText(/Rate/i)).toBeInTheDocument();
    // 1 ETH ≈ 2,000 USDC
    const rateValue = screen.getByText(/1 ETH/);
    expect(within(rateValue.parentElement!).getByText(/2,000/)).toBeInTheDocument();
  });
});
