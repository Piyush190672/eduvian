import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { apiErrorResponse } from "@/lib/api-error";
import { INDEXED_PROGRAMS } from "@/data/programs-indexed";

// Static data — cache per lambda instance; response is client-cacheable.
export const dynamic = "force-dynamic";

/**
 * GET /api/programs — slim program search for client components.
 *
 * Replaces the pattern of client components importing the full 10MB
 * programs.ts for autocomplete / lookup (options, ROI calculator,
 * application tracker, parent-decision, LOR builder, SOP assistant).
 *
 * Query params:
 *   q          free-text across university + program name (min 2 chars)
 *   university exact university_name — returns that university's programs
 *   country    exact country name filter
 *   field      exact field_of_study filter
 *   level      degree_level filter (undergraduate | postgraduate)
 *   limit      max rows (default 20, cap 100; university mode cap 300)
 *
 * Returns ONLY display-slim fields — never the full record — so the
 * proprietary dataset can't be bulk-extracted through this surface.
 * Rate-limited per IP as an additional scraping brake.
 */

interface SlimProgram {
  id: string;
  university_name: string;
  program_name: string;
  country: string;
  city: string | null;
  degree_level: string;
  field_of_study: string;
  qs_ranking: number | null;
  duration_months: number | null;
  annual_tuition_usd: number | null;
  annual_tuition_currency: string | null;
  annual_tuition_amount: number | null;
  tuition_fee_source: string | null;
  avg_living_cost_usd: number | null;
  living_cost_source: string | null;
  verified_at: string | null;
  application_deadline: string | null;
  min_ielts: number | null;
  program_url: string | null;
  apply_url: string | null;
}

function slim(p: (typeof INDEXED_PROGRAMS)[number]): SlimProgram {
  return {
    id: p.id,
    university_name: p.university_name,
    program_name: p.program_name,
    country: p.country,
    city: p.city ?? null,
    degree_level: p.degree_level,
    field_of_study: p.field_of_study,
    qs_ranking: p.qs_ranking ?? null,
    duration_months: (p as { duration_months?: number | null }).duration_months ?? null,
    annual_tuition_usd: p.annual_tuition_usd ?? null,
    annual_tuition_currency: (p as { annual_tuition_currency?: string | null }).annual_tuition_currency ?? null,
    annual_tuition_amount: (p as { annual_tuition_amount?: number | null }).annual_tuition_amount ?? null,
    tuition_fee_source: (p as { tuition_fee_source?: string | null }).tuition_fee_source ?? null,
    avg_living_cost_usd: p.avg_living_cost_usd ?? null,
    living_cost_source: (p as { living_cost_source?: string | null }).living_cost_source ?? null,
    verified_at: (p as { verified_at?: string | null }).verified_at ?? null,
    application_deadline: (p as { application_deadline?: string | null }).application_deadline ?? null,
    min_ielts: (p as { min_ielts?: number | null }).min_ielts ?? null,
    program_url: p.program_url ?? null,
    apply_url: (p as { apply_url?: string | null }).apply_url ?? null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = await checkRateLimit(`programs-search:${ip}`, 120, 3600);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } },
      );
    }

    const sp = req.nextUrl.searchParams;
    const q = (sp.get("q") ?? "").trim().toLowerCase();
    const university = (sp.get("university") ?? "").trim();
    const country = (sp.get("country") ?? "").trim();
    const field = (sp.get("field") ?? "").trim();
    const level = (sp.get("level") ?? "").trim();
    const deadlineOnly = sp.get("deadline") === "1";

    const uniMode = university.length > 0;
    const cap = uniMode ? 300 : 100;
    const limit = Math.min(Math.max(parseInt(sp.get("limit") ?? "20", 10) || 20, 1), cap);

    // Browse mode (no text query) is allowed when at least one structured
    // filter narrows the scan — used by the admin table. A bare unfiltered
    // call still requires a 2+ char query so the endpoint can't be used as
    // a bulk dump (belt: the 100-row cap + rate limit above).
    const hasStructuredFilter = Boolean(country || field || level || deadlineOnly);
    if (!uniMode && q.length < 2 && !hasStructuredFilter) {
      return NextResponse.json({ results: [] });
    }

    const results: SlimProgram[] = [];
    for (const p of INDEXED_PROGRAMS) {
      if (uniMode && p.university_name !== university) continue;
      if (country && p.country !== country) continue;
      if (field && p.field_of_study !== field) continue;
      if (level && p.degree_level !== level) continue;
      if (deadlineOnly && !(p as { application_deadline?: string | null }).application_deadline) continue;
      if (!uniMode && q) {
        const hay = `${p.university_name} ${p.program_name} ${p.country}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      results.push(slim(p));
      if (results.length >= limit) break;
    }

    return NextResponse.json(
      { results },
      // Static-data lookups are safely cacheable at the edge for an hour.
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } },
    );
  } catch (err) {
    return apiErrorResponse(err, { route: "programs" }, "Search failed");
  }
}
