import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { createServiceClient } from "@/lib/supabase";
import { apiErrorResponse } from "@/lib/api-error";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { hashPassword, verifyPassword, validatePasswordStrength } from "@/lib/password";

// Reads + mutates the session-gated student row. Must evaluate per-request.
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/set-password
 *
 * Authenticated endpoint that lets a signed-in user set or change their
 * password. The session cookie (eduvianai_user) is the auth gate — only
 * the user identified by that cookie can change their own password.
 *
 * Body:
 *   { new_password: string;          // required — must pass validatePasswordStrength
 *     current_password?: string;     // required only when a password is already set }
 *
 * Behaviour:
 *   - First-time set       : new_password only, no current_password needed.
 *   - Change / re-set      : current_password must verify against the stored hash.
 *   - Wrong current_password → 401 (constant-time inside verifyPassword).
 *
 * Rate-limited at 10 attempts / hour per IP — the M8 sweep didn't reach
 * this endpoint (it didn't exist) so it's bucketed alongside other
 * destructive PII writes.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = await checkRateLimit(`auth-set-password:${ip}`, 10, 3600);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
      );
    }

    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in to set a password." }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      new_password?: string;
      current_password?: string;
    };
    const { new_password, current_password } = body;

    const strengthErr = validatePasswordStrength(new_password);
    if (strengthErr) {
      return NextResponse.json({ error: strengthErr }, { status: 400 });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    // Fetch current hash so we can enforce current_password on change.
    const { data: existing, error: lookupErr } = await supabase
      .from("students")
      .select("password_hash")
      .eq("email", user.email)
      .single();
    if (lookupErr) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const existingHash = (existing as { password_hash?: string | null } | null)?.password_hash;
    if (existingHash) {
      if (!current_password) {
        return NextResponse.json(
          { error: "Current password is required to change your password." },
          { status: 400 },
        );
      }
      const ok = await verifyPassword(current_password, existingHash);
      if (!ok) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
      }
      if (current_password === new_password) {
        return NextResponse.json(
          { error: "New password must be different from the current one." },
          { status: 400 },
        );
      }
    }

    const hash = await hashPassword(new_password as string);
    const { error: updErr } = await supabase
      .from("students")
      .update({ password_hash: hash, password_set_at: new Date().toISOString() })
      .eq("email", user.email);
    if (updErr) {
      // Retry without the new columns in case the SQL migration hasn't been
      // applied yet — surfaces a clear error instead of a 500.
      return NextResponse.json(
        { error: "Password storage isn't ready yet. Please contact support." },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true, first_time: !existingHash });
  } catch (err) {
    return apiErrorResponse(err, { route: "auth/set-password" }, "Failed to set password");
  }
}
