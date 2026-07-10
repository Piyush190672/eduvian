import { NextRequest, NextResponse } from "next/server";
import { recommendPrograms, teaserSlice } from "@/lib/scoring";
import { INDEXED_PROGRAMS } from "@/data/programs-indexed";
import { submissionStore } from "@/lib/store";
import type { Program } from "@/lib/types";
import { decryptProfile } from "@/lib/submissions-decrypt";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isSubmissionOwner, isEmailRegistered, redactProfileContact } from "@/lib/submission-owner";
import { resultsPatchSchema, zodErrorMessage } from "@/lib/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  // M8: cap result reads (60/h per IP). Token-gated, but rate-cap is
  // belt-and-suspenders against token-guessing fishing.
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`results-get:${ip}`, 60, 3600);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } });

  const { token } = params;

  // Try Supabase
  let submission = null;
  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("token", token)
        .single();
      if (!error && data) submission = data;
    }
  } catch {
    // fall through
  }

  // Fall back to in-memory
  if (!submission) {
    submission = submissionStore.get(token) ?? null;
  }

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // H7 Phase C: plaintext profile column is gone. The only source of
  // profile data is profile_encrypted. If decryption returns null, the
  // row is unservable — return 410 Gone rather than passing undefined
  // into the scoring pipeline (which crashed on qs_ranking_preference
  // before this guard, Sentry 8bfc0387).
  const decryptedProfile = decryptProfile(submission as { profile_encrypted?: string | null });
  if (!decryptedProfile) {
    return NextResponse.json(
      { error: "This submission's profile data is unavailable. Please re-submit your profile." },
      { status: 410 }
    );
  }

  // Ownership gate on contact PII (Phase 1 item 5): the token link is
  // deliberately shareable (parents open it on their own devices), but
  // only the submission owner — session email_hash matches — gets the
  // raw email/phone back. Everyone else sees a masked view; the
  // academic + preference content being shared stays intact.
  const owner = await isSubmissionOwner(
    req,
    (submission as { email_hash?: string | null }).email_hash,
  );
  submission.profile = owner ? decryptedProfile : redactProfileContact(decryptedProfile);
  for (const k of ["profile_encrypted", "email_hash"] as const) {
    if (k in (submission as Record<string, unknown>)) {
      delete (submission as Record<string, unknown>)[k];
    }
  }

  // Canonical id-stamped list — stable content-hash ids, computed once
  // per lambda instance (see src/data/programs-indexed.ts).
  let programs: Program[] = INDEXED_PROGRAMS;

  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await supabase.from("programs").select("*").eq("is_active", true);
      if (data && data.length > 0) programs = data as Program[];
    }
  } catch {
    // use static
  }

  // pages=2 → up to 40 programs in the same per-tier ratio. The /results
  // client renders the first 20 and reveals 21-40 via the "Next Best 20"
  // button. No extra API round-trip needed.
  const scored = recommendPrograms(submission.profile, programs, 2);

  // Registration gate, moved AFTER the form (Phase 2 #7, 10 July 2026):
  // anyone can submit a profile and see a top-5 teaser, but the full
  // list unlocks only once the submitting email has a REGISTERED
  // account. Keyed on registration, NOT session ownership — /api/submit
  // hands every guest submitter an owner session cookie, so an
  // ownership-keyed gate would never bind on the submitting device.
  // The truncation happens HERE, server-side — a client-side blur would
  // ship the full data anyway. Shared links of claimed (registered)
  // submissions are untouched, so the parent-share flow keeps working.
  if (!(await isEmailRegistered(decryptedProfile.email))) {
    const preview = teaserSlice(scored, 5);
    return NextResponse.json({
      submission,
      programs: preview,
      viewer: "locked",
      locked_count: scored.length - preview.length,
      total_matches: scored.length,
      // Full per-tier totals so the locked UI can show the TRUE match
      // count ("12 matches — showing 5 free") instead of pretending
      // only the teaser exists.
      tier_counts: {
        safe: scored.filter((p) => p.tier === "safe").length,
        reach: scored.filter((p) => p.tier === "reach").length,
        ambitious: scored.filter((p) => p.tier === "ambitious").length,
      },
    });
  }

  return NextResponse.json({
    submission,
    programs: scored,
    viewer: owner ? "owner" : "shared",
    total_matches: scored.length,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  // M8: cap shortlist updates (60/h per IP) — write path, must cap.
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`results-patch:${ip}`, 60, 3600);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } });

  const { token } = params;

  // M3: validate the write payload — ids must match the stable
  // content-hash or legacy positional formats, max 80 entries.
  const parsed = resultsPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: zodErrorMessage(parsed.error) }, { status: 400 });
  }
  const { shortlisted_ids } = parsed.data;

  // Ownership gate (Phase 1 item 5): shortlist writes were previously
  // keyed on the token alone — anyone holding a shared link could
  // silently overwrite the student's saved shortlist. Now the session
  // email_hash must match the submission's.
  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    if (supabase) {
      const { data: sub } = await supabase
        .from("submissions")
        .select("email_hash")
        .eq("token", token)
        .single();
      if (!sub) {
        return NextResponse.json({ error: "Submission not found" }, { status: 404 });
      }
      const owner = await isSubmissionOwner(req, (sub as { email_hash?: string | null }).email_hash);
      if (!owner) {
        return NextResponse.json(
          { error: "Only the profile owner can change the shortlist. Sign in with the account that created this profile." },
          { status: 403 },
        );
      }
      await supabase
        .from("submissions")
        .update({ shortlisted_ids })
        .eq("token", token);
    }
  } catch {
    // fall through
  }

  // Update in-memory (dev fallback — owner check requires a session)
  const existing = submissionStore.get(token);
  if (existing) {
    const owner = await isSubmissionOwner(req, (existing as { email_hash?: string | null }).email_hash);
    if (!owner) {
      return NextResponse.json({ error: "Only the profile owner can change the shortlist." }, { status: 403 });
    }
    submissionStore.set(token, { ...existing, shortlisted_ids });
  }

  return NextResponse.json({ ok: true });
}
