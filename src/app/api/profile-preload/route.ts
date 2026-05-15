import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { createServiceClient } from "@/lib/supabase";
import { decryptProfile, SUBMISSION_PROFILE_COLUMNS } from "@/lib/submissions-decrypt";
import { emailHash } from "@/lib/pii-crypto";
import { apiErrorResponse } from "@/lib/api-error";

// Per-request — session cookie drives the lookup.
export const dynamic = "force-dynamic";

/**
 * GET /api/profile-preload
 *
 * Authenticated. Returns the signed-in user's MOST RECENT submission
 * profile, decrypted, so the /profile page can pre-fill the form with
 * everything (degree level, intended field, scores, country prefs,
 * budget, …) instead of just the five personal fields the localStorage
 * session carried.
 *
 * Does NOT include any submission metadata — only the raw profile blob.
 * Empty / 404 if the user has no submissions yet (a brand-new user
 * filling the form for the first time).
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  try {
    const { data, error } = await supabase
      .from("submissions")
      .select(SUBMISSION_PROFILE_COLUMNS)
      .eq("email_hash", emailHash(user.email))
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) return apiErrorResponse(error, { route: "/api/profile-preload" });
    if (!data?.length) return NextResponse.json({ profile: null }, { status: 200 });

    const profile = decryptProfile(data[0]);
    if (!profile) return NextResponse.json({ profile: null }, { status: 200 });
    return NextResponse.json({ profile }, { status: 200 });
  } catch (e) {
    return apiErrorResponse(e, { route: "/api/profile-preload" });
  }
}
