/**
 * Micro-benchmark for the four `number`-returning variants.
 *
 * Run with: `npm run bench`
 *
 * Prints a markdown table of ns-per-call so you can paste it into a PR or
 * README without reformatting.
 */

import { performance } from "node:perf_hooks";
import {
  sum_to_n_iterative,
  sum_to_n_formula,
  sum_to_n_reduce,
  sum_to_n_recursive,
} from "./sum_to_n.ts";

type Fn = (n: number) => number;

const NS = ["iterative", "formula", "reduce", "recursive"] as const;
const FNS: Record<(typeof NS)[number], Fn> = {
  iterative: sum_to_n_iterative,
  formula: sum_to_n_formula,
  reduce: sum_to_n_reduce,
  recursive: sum_to_n_recursive,
};

const N_VALUES = [1_000, 100_000, 10_000_000] as const;
const TARGET_MS = 200;

const time = (fn: Fn, n: number): number => {
  // warm-up
  for (let i = 0; i < 3; i++) fn(n);

  let iters = 1;
  let elapsed = 0;
  while (elapsed < TARGET_MS) {
    iters *= 2;
    const start = performance.now();
    for (let i = 0; i < iters; i++) fn(n);
    elapsed = performance.now() - start;
  }
  return (elapsed * 1e6) / iters; // ns per call
};

const fmt = (ns: number): string => {
  if (ns < 1) return `${ns.toFixed(3)} ns`;
  if (ns < 1_000) return `${ns.toFixed(1)} ns`;
  if (ns < 1_000_000) return `${(ns / 1_000).toFixed(1)} µs`;
  return `${(ns / 1_000_000).toFixed(2)} ms`;
};

const safeFor = (variant: string, n: number): boolean => {
  // The recursive variant overflows the call stack well before 10M.
  if (variant === "recursive" && n > 10_000) return false;
  return true;
};

const main = (): void => {
  const headerCells = ["variant", ...N_VALUES.map((n) => `n = ${n.toLocaleString()}`)];
  console.log(`| ${headerCells.join(" | ")} |`);
  console.log(`|${headerCells.map(() => "---").join("|")}|`);

  for (const name of NS) {
    const cells: string[] = [`\`${name}\``];
    for (const n of N_VALUES) {
      cells.push(safeFor(name, n) ? fmt(time(FNS[name], n)) : "n/a (stack overflow)");
    }
    console.log(`| ${cells.join(" | ")} |`);
  }
};

main();
