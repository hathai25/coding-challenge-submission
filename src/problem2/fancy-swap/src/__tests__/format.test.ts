import { describe, it, expect } from "vitest";
import { formatToken, formatUsd } from "@/lib/format";

describe("formatToken", () => {
  it.each([
    [null, "-"],
    [undefined, "-"],
    [NaN, "-"],
    [0, "0"],
    [1, "1"],
    [1.23456, "1.2346"],
    [0.0001234, "0.0001234"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatToken(input)).toBe(expected);
  });
});

describe("formatUsd", () => {
  it("uses standard currency formatting for >= $1", () => {
    expect(formatUsd(1_234.567)).toBe("$1,234.57");
  });
  it("uses high-precision formatting for tiny values", () => {
    // precise formatter caps at 6 fraction digits, so the trailing 4 is dropped
    expect(formatUsd(0.0001234)).toBe("$0.000123");
  });
  it("returns em-dash for invalid input", () => {
    expect(formatUsd(null)).toBe("-");
    expect(formatUsd(NaN)).toBe("-");
  });
});
