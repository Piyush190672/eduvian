import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { createServiceClient } from "@/lib/supabase";
import { emailHash, encryptJson, decryptJson } from "@/lib/pii-crypto";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { apiErrorResponse } from "@/lib/api-error";

export const dynamic = "force-dynamic";

/**
 * Profile draft — autosaved by /profile as the user fills the multi-step
 * form. Lets a user start on desktop and continue on mobile (or vice
 * versa) without re-typing.
 *
 *   GET /api/profile-draft
 *     → { profile: <decrypted draft> | null, updated_at: ISOString | null }
 *
 *   PUT /api/profile-draft   { profile: Partial<StudentProfile> }
 *     → { ok: true, updated_at: ISOString }
 *     Idempotent upsert keyed on email_hash. The whole profile blob
 *     is replaced on every write — clients send the full current
 *     form state, not a delta. Rate-limited: 60 writes / 10 min / IP
 *     (one ~every 10 seconds at most; clients should debounce).
 *
 * Auth: eduvianai_user cookie required. Anon traffic → 401.
 * PII: blob encrypted with the same H7 AES-256-GCM scheme as the
 * submissions table.
 */

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  try {
    const { data, error } = await supabase
      .from("profile_drafts")
      .select("profile_encrypted, updated_at")
      .eq("email_hash", emailHash(user.email))
      .maybeSingle();
    if (error) return apiErrorResponse(error, { route: "/api/profile-draft GET" });
    if (!data?.profile_encrypted) {
      return NextResponse.json({ profile: null, updated_at: null }, { status: 200 });
    }
    try {
      const profile = decryptJson(data.profile_encrypted as string);
      return NextResponse.json({ profile, updated_at: data.updated_at }, { status: 200 });
    } catch {
      return NextResponse.json({ profile: null, updated_at: null }, { status: 200 });
    }
  } catch (e) {
    return apiErrorResponse(e, { route: "/api/profile-draft GET" });
  }
}

export async function DELETE(req: NextRequest) {
  // Called by /profile after a successful POST /api/submit so the now-
  // obsolete draft doesn't shadow the freshly-submitted profile when the
  // user revisits the form (e.g. to edit).
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  try {
    const { error } = await supabase
      .from("profile_drafts")
      .delete()
      .eq("email_hash", emailHash(user.email));
    if (error) return apiErrorResponse(error, { route: "/api/profile-draft DELETE" });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return apiErrorResponse(e, { route: "/api/profile-draft DELETE" });
  }
}

export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`profile-draft:${ip}`, 60, 600);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  let profile: unknown;
  try {
    const body = await req.json();
    profile = body?.profile;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!profile || typeof profile !== "object") {
    return NextResponse.json({ error: "profile must be an object" }, { status: 400 });
  }

  try {
    const eh = emailHash(user.email);
    const blob = encryptJson(profile);
    const updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("profile_drafts")
      .upsert(
        { email_hash: eh, profile_encrypted: blob, updated_at },
        { onConflict: "email_hash" },
      );
    if (error) return apiErrorResponse(error, { route: "/api/profile-draft PUT" });

    return NextResponse.json({ ok: true, updated_at }, { status: 200 });
  } catch (e) {
    return apiErrorResponse(e, { route: "/api/profile-draft PUT" });
  }
}
