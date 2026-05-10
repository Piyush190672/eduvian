/**
 * format-fee.ts — Tuition / fee display helpers.
 *
 * Authenticity rules:
 * 1. The fee shown is the INTERNATIONAL / OVERSEAS / NON-RESIDENT student
 *    fee — never the domestic figure (extractor enforces this at source).
 * 2. When tuition is unavailable, NEVER show "$0" — render an explicit
 *    "verified fee not available" notice and direct the user to the
 *    official link.
 * 3. Display prefers the LOCAL currency the page literally states (e.g.,
 *    £26,600/yr), with the USD-converted amount as a secondary view.
 *    This avoids hiding a precise figure behind a derived (FX-rate)
 *    number.
 */
import { formatCurrency } from "./utils";

export const FEE_UNAVAILABLE_MESSAGE = "Verified fee not available — check University website";
export const FEE_UNAVAILABLE_SHORT = "Fee unavailable — see website";

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: "$", GBP: "£", EUR: "€",
  CAD: "C$", AUD: "A$", NZD: "NZ$",
  SGD: "S$", MYR: "RM", AED: "AED ",
  INR: "₹", CHF: "CHF ", JPY: "¥", CNY: "¥",
};

/** Returns true when no verifiable fee is on file (null, undefined, 0, NaN). */
export function isFeeUnavailable(amount: number | null | undefined): boolean {
  return amount == null || amount === 0 || Number.isNaN(amount);
}

/** Format a number with thousands separators (locale-agnostic for SSR stability). */
function nf(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/** Format an amount + currency code into "£26,600" / "C$45,000" / "$33,782". */
export function formatLocal(amount: number | null | undefined, currency: string | null | undefined): string | null {
  if (isFeeUnavailable(amount) || !currency) return null;
  const code = currency.toUpperCase();
  const sym = CURRENCY_SYMBOL[code] ?? `${code} `;
  return `${sym}${nf(amount as number)}`;
}

/** Tuition / fee block accepting both legacy USD-only and new local-primary shapes. */
export interface FeeShape {
  annual_tuition_usd?: number | null;
  annual_tuition_amount?: number | null;
  annual_tuition_currency?: string | null;
  tuition_fee_source?: "verified" | "estimated" | null;
}

/** Provenance status for the matched-program label.
 *  - verified:     extracted from the official program page (has annual_tuition_amount or _usd > 0, source absent or "verified")
 *  - estimated:    fee was inferred from a credible secondary source (tuition_fee_source === "estimated")
 *  - not_available: no tuition figure on file at all
 */
export type FeeStatus = "verified" | "estimated" | "not_available";

export function getFeeStatus(input: FeeShape | null | undefined): FeeStatus {
  if (!input) return "not_available";
  const hasNumber = !isFeeUnavailable(input.annual_tuition_amount) || !isFeeUnavailable(input.annual_tuition_usd);
  if (!hasNumber) return "not_available";
  return input.tuition_fee_source === "estimated" ? "estimated" : "verified";
}

/** Plain-English status labels (Verified / Estimated / Not available). */
export const FEE_STATUS_LABEL: Record<FeeStatus, string> = {
  verified: "Verified",
  estimated: "Estimated",
  not_available: "Not available",
};

/** Tailwind class shorthand for status pills used on ProgramCard etc. */
export const FEE_STATUS_CLASS: Record<FeeStatus, string> = {
  verified:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  estimated:     "bg-amber-50  text-amber-700   border-amber-200",
  not_available: "bg-rose-50   text-rose-700    border-rose-200",
};

/** Primary tuition string. Prefers local currency; falls back to USD; then unavailable. */
export function formatFee(input: FeeShape | number | null | undefined, opts?: { short?: boolean; withUsd?: boolean }): string {
  // Legacy callers pass a number directly.
  if (typeof input === "number" || input == null) {
    if (isFeeUnavailable(input)) return opts?.short ? FEE_UNAVAILABLE_SHORT : FEE_UNAVAILABLE_MESSAGE;
    return formatCurrency(input as number);
  }
  const local = formatLocal(input.annual_tuition_amount, input.annual_tuition_currency);
  const usd = input.annual_tuition_usd;
  if (local) {
    if (opts?.withUsd && !isFeeUnavailable(usd) && (input.annual_tuition_currency ?? "").toUpperCase() !== "USD") {
      return `${local} (~${formatCurrency(usd as number)} USD)`;
    }
    return local;
  }
  if (!isFeeUnavailable(usd)) return formatCurrency(usd as number);
  return opts?.short ? FEE_UNAVAILABLE_SHORT : FEE_UNAVAILABLE_MESSAGE;
}

/** Sum tuition + living in USD (kept for back-compat with consumers that aggregate). */
export function totalAnnualCost(tuition: number | null | undefined, living: number | null | undefined): number | null {
  if (isFeeUnavailable(tuition)) return null;
  return (tuition as number) + (living ?? 0);
}

/** Format a total cost line in USD, falling back to the unavailable message when tuition is missing. */
export function formatTotalCost(tuition: number | null | undefined, living: number | null | undefined, opts?: { short?: boolean }): string {
  const total = totalAnnualCost(tuition, living);
  if (total === null) return opts?.short ? FEE_UNAVAILABLE_SHORT : FEE_UNAVAILABLE_MESSAGE;
  return `${formatCurrency(total)}/yr`;
}
