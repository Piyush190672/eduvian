import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { createServiceClient } from "@/lib/supabase";
import { emailHash } from "@/lib/pii-crypto";
import { apiErrorResponse } from "@/lib/api-error";
import { resolveProgramId } from "@/data/programs-indexed";

// Per-request — session cookie drives the lookup.
export const dynamic = "force-dynamic";

interface ShortlistItem {
  id: string;
  university_name: string;
  program_name: string;
  country: string;
  degree_level: string;
}

/**
 * GET /api/my-shortlist
 *
 * Authenticated. Returns the signed-in user's MOST RECENT submission's
 * shortlisted programs, hydrated with university + course metadata so
 * the /application-check tool can populate its University and Course
 * dropdowns with the same picks the student already bookmarked on the
 * /results page (instead of forcing manual re-entry).
 *
 * Empty array if the user has no submissions or hasn't shortlisted yet.
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const supabase = createServiceClient();
  if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("token, shortlisted_ids, created_at")
      .eq("email_hash", emailHash(user.email))
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) return apiErrorResponse(error, { route: "/api/my-shortlist" });
    if (!data?.length) return NextResponse.json({ items: [] satisfies ShortlistItem[] }, { status: 200 });

    const ids: string[] = data[0].shortlisted_ids ?? [];
    if (ids.length === 0) return NextResponse.json({ items: [] satisfies ShortlistItem[] }, { status: 200 });

    // Ids are stable content-hashes (p_…) as of Phase 1; legacy
    // positional ids (prog_N) resolve best-effort against the current
    // array position. Anything that no longer resolves is dropped.
    const items: ShortlistItem[] = [];
    for (const id of ids) {
      const p = resolveProgramId(id);
      if (!p) continue;
      items.push({
        id: p.id,
        university_name: p.university_name,
        program_name: p.program_name,
        country: p.country,
        degree_level: p.degree_level,
      });
    }

    return NextResponse.json({ items }, { status: 200 });
  } catch (e) {
    return apiErrorResponse(e, { route: "/api/my-shortlist" });
  }
}
