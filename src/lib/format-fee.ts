/**
 * format-fee.ts — Tuition / fee display helpers.
 *
 * When `annual_tuition_usd` is null OR zero, the official program page did
 * not state a verifiable fee. We must NOT show "$0" to the student — that
 * would imply the program is free, which is misleading. Instead, render
 * an explicit "verified fee not available" notice and direct them to the
 * official link.
 */
import { formatCurrency } from "./utils";

export const FEE_UNAVAILABLE_MESSAGE = "Verified fee not available — check University website";
export const FEE_UNAVAILABLE_SHORT = "Fee unavailable — see website";

/** Returns true when no verifiable fee is on file (null, undefined, 0, NaN). */
export function isFeeUnavailable(amount: number | null | undefined): boolean {
  return amount == null || amount === 0 || Number.isNaN(amount);
}

/** Format a tuition amount with the unavailable-fee fallback. */
export function formatFee(amount: number | null | undefined, opts?: { short?: boolean }): string {
  if (isFeeUnavailable(amount)) {
    return opts?.short ? FEE_UNAVAILABLE_SHORT : FEE_UNAVAILABLE_MESSAGE;
  }
  return formatCurrency(amount as number);
}

/** Sum tuition + living, returning null when tuition is unavailable. */
export function totalAnnualCost(tuition: number | null | undefined, living: number | null | undefined): number | null {
  if (isFeeUnavailable(tuition)) return null;
  return (tuition as number) + (living ?? 0);
}

/** Format a total cost line, falling back to the unavailable message when tuition is missing. */
export function formatTotalCost(tuition: number | null | undefined, living: number | null | undefined, opts?: { short?: boolean }): string {
  const total = totalAnnualCost(tuition, living);
  if (total === null) return opts?.short ? FEE_UNAVAILABLE_SHORT : FEE_UNAVAILABLE_MESSAGE;
  return `${formatCurrency(total)}/yr`;
}
