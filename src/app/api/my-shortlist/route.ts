import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { createServiceClient } from "@/lib/supabase";
import { emailHash } from "@/lib/pii-crypto";
import { apiErrorResponse } from "@/lib/api-error";
import { PROGRAMS } from "@/data/programs";

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

    // Program ids are computed `prog_${index}` against PROGRAMS — same
    // mapping as /api/results/[token]. Resolve back to metadata for the
    // dropdown payload. Anything that no longer resolves (program
    // removed in a later data refresh) is silently dropped.
    const items: ShortlistItem[] = [];
    for (const id of ids) {
      const idx = parseInt(id.replace(/^prog_/, ""), 10);
      if (!Number.isFinite(idx) || idx < 0 || idx >= PROGRAMS.length) continue;
      const p = PROGRAMS[idx];
      items.push({
        id,
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
