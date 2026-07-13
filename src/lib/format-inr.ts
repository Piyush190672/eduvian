// INR display conversion for parent-facing cost surfaces (Wave 2, redesign).
// Static mid-market rate, set 13 July 2026 per founder — update periodically
// alongside the pipeline FX table. Display-only: never used in scoring,
// filtering, or stored data.
export const USD_TO_INR = 94;
export const USD_TO_INR_ASOF = "July 2026";

// Indian-convention compact format: ₹92L, ₹3.2Cr. Below 1 lakh, grouped
// digits (₹94,000). Negative values keep the sign ahead of ₹.
export function formatInr(usd: number): string {
  const inr = usd * USD_TO_INR;
  const abs = Math.abs(inr);
  const sign = inr < 0 ? "−" : "";
  if (abs >= 1e7) {
    const cr = abs / 1e7;
    return `${sign}₹${cr >= 10 ? Math.round(cr) : cr.toFixed(1)}Cr`;
  }
  if (abs >= 1e5) return `${sign}₹${Math.round(abs / 1e5)}L`;
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
}
