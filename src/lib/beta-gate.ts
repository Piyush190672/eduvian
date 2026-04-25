/**
 * Server-side beta gate.
 *
 * Caps:
 *   - 100 unique users per calendar month (UTC)
 *   - Per-user per-tool monthly caps (PER_USER_MONTHLY_CAPS)
 *   - Global monthly spend cap in cents (MAX_MONTHLY_SPEND_CENTS)
 *
 * Owner emails listed in BETA_OWNER_EMAILS (comma-separated) bypass everything.
 */

export const PER_USER_MONTHLY_CAPS: Record<string, number> = {
  "sop-assistant": 5,
  "cv-assessment": 3,
  "application-check": 3,
  "lor-coach-generate": 1,
  "lor-coach-assess": 5,
  "interview-feedback": 10,
  "score-english": 10,
  "chat": 50,
  "extract-text": 20,
};

export const MONTHLY_UNIQUE_USER_CAP = 100;

/** Hard global ceiling on monthly Anthropic spend, in cents. Default $50. */
export const MAX_MONTHLY_SPEND_CENTS = parseInt(
  process.env.MAX_MONTHLY_SPEND_CENTS ?? "5000",
  10
);

/** Per-tool cost estimates in cents (post-caching ballpark). */
export const TOOL_COST_CENTS: Record<string, number> = {
  "sop-assistant": 3,
  "cv-assessment": 2,
  "application-check": 2,
  "lor-coach-generate": 12,
  "lor-coach-assess": 3,
  "interview-feedback": 1,
  "score-english": 1,
  "chat": 1,
  "extract-text": 0,
};

export interface GateResult {
  allowed: boolean;
  reason?: "beta_full" | "tool_cap_exceeded" | "no_user" | "spend_cap_exceeded";
  message?: string;
  remaining?: number;
}

/** Start of the current calendar month, UTC, as ISO string. */
function startOfMonthUTC(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function getOwnerEmails(): string[] {
  const raw = process.env.BETA_OWNER_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isOwnerEmail(email: string): boolean {
  if (!email) return false;
  return getOwnerEmails().includes(email.toLowerCase().trim());
}

export async function checkBetaAccess(
  email: string | null,
  tool: keyof typeof PER_USER_MONTHLY_CAPS
): Promise<GateResult> {
  if (!email) {
    return {
      allowed: false,
      reason: "no_user",
      message: "Please register to use the beta.",
    };
  }

  const normalized = email.toLowerCase().trim();

  // Owner bypass
  if (isOwnerEmail(normalized)) {
    return { allowed: true };
  }

  const cap = PER_USER_MONTHLY_CAPS[tool];

  // Lazy-import Supabase so this module stays Edge-friendly when unused.
  let supabase: Awaited<ReturnType<typeof import("@/lib/supabase").createServiceClient>> = null;
  try {
    const mod = await import("@/lib/supabase");
    supabase = mod.createServiceClient();
  } catch {
    supabase = null;
  }

  // If Supabase is unavailable we fail OPEN — better to serve users than to
  // hard-fail the entire beta during a transient outage. Owner spend is still
  // bounded by Anthropic's own per-key quotas.
  if (!supabase) {
    return { allowed: true, remaining: cap };
  }

  const startOfMonth = startOfMonthUTC();

  try {
    // ── 1. Unique-user count + spend total for the month ──────────────────
    const { data: monthRows, error: monthErr } = await supabase
      .from("tool_usage")
      .select("email, cost_estimate_cents")
      .gte("created_at", startOfMonth);

    if (monthErr) throw monthErr;

    const rows = (monthRows ?? []) as { email: string; cost_estimate_cents: number | null }[];
    const distinct = new Set(rows.map((r) => r.email.toLowerCase()));
    const userAlreadyCounted = distinct.has(normalized);
    const monthlyUniques = distinct.size;

    const monthlySpendCents = rows.reduce(
      (sum, r) => sum + (r.cost_estimate_cents ?? 0),
      0
    );

    // ── Global spend cap (hard stop) ──────────────────────────────────────
    if (monthlySpendCents >= MAX_MONTHLY_SPEND_CENTS) {
      return {
        allowed: false,
        reason: "spend_cap_exceeded",
        message:
          "Beta spend cap reached for this month. Resets on the 1st.",
      };
    }

    if (!userAlreadyCounted && monthlyUniques >= MONTHLY_UNIQUE_USER_CAP) {
      return {
        allowed: false,
        reason: "beta_full",
        message:
          "We're in beta — only 100 users per month and this month's slots are full. Please try again next month.",
      };
    }

    // ── 2. Per-tool cap for this user ─────────────────────────────────────
    const { count, error: countErr } = await supabase
      .from("tool_usage")
      .select("id", { count: "exact", head: true })
      .eq("email", normalized)
      .eq("tool", tool)
      .gte("created_at", startOfMonth);

    if (countErr) throw countErr;

    const used = count ?? 0;
    if (used >= cap) {
      return {
        allowed: false,
        reason: "tool_cap_exceeded",
        message: `You've used your monthly quota for this tool (${cap}/month). Quota resets on the 1st.`,
        remaining: 0,
      };
    }

    return { allowed: true, remaining: cap - used };
  } catch (err) {
    console.error("checkBetaAccess error:", err);
    // Fail open on transient errors.
    return { allowed: true, remaining: cap };
  }
}

export async function logToolUsage(
  email: string,
  tool: string,
  ip?: string
): Promise<void> {
  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    if (!supabase) return;
    await supabase.from("tool_usage").insert({
      email: email.toLowerCase().trim(),
      tool,
      ip: ip ?? null,
      cost_estimate_cents: TOOL_COST_CENTS[tool] ?? 0,
    });
  } catch (err) {
    console.error("logToolUsage error:", err);
    // Never throw — logging is best-effort.
  }
}
