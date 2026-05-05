import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { createServiceClient } from "@/lib/supabase";
import { apiErrorResponse } from "@/lib/api-error";
import { emailHash } from "@/lib/pii-crypto";
import { decryptProfile } from "@/lib/submissions-decrypt";

// Reads the session cookie — must be evaluated per-request, never statically.
export const dynamic = "force-dynamic";

/**
 * DPDPA s.13 / GDPR Art.15 — right of access.
 * Returns every piece of data we hold tied to the calling user's email.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in to view your data." }, { status: 401 });
    }
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const email = user.email;
    const hash = emailHash(email);

    // H7 Phase C: plaintext `profile` column was dropped. Lookup is by
    // email_hash only — every row carries one post-backfill.
    const submissionsQuery = supabase
      .from("submissions")
      .select("token, profile_encrypted, email_hash, profile_category, total_matched, created_at, updated_at")
      .eq("email_hash", hash);

    const [studentRes, submissionsRes, toolUsageRes] = await Promise.all([
      supabase.from("students").select("*").eq("email", email),
      submissionsQuery,
      supabase
        .from("tool_usage")
        .select("tool, cost_estimate_cents, created_at")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    // Decrypt and strip the encrypted blob before sending to the user.
    const decryptedSubmissions = (submissionsRes.data ?? []).map((s: Record<string, unknown>) => {
      const decrypted = decryptProfile(s as { profile?: unknown; profile_encrypted?: string | null });
      const out: Record<string, unknown> = { ...s, profile: decrypted };
      delete out.profile_encrypted;
      delete out.email_hash;
      return out;
    });

    return NextResponse.json({
      email,
      generated_at: new Date().toISOString(),
      student: studentRes.data ?? [],
      submissions: decryptedSubmissions,
      tool_usage: toolUsageRes.data ?? [],
    });
  } catch (err) {
    return apiErrorResponse(err, { route: "account/access" }, "Could not fetch your data");
  }
}
