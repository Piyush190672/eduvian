import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { apiErrorResponse } from "@/lib/api-error";
import { rankForLens, LENSES, type Lens } from "@/lib/options-lenses";

export const dynamic = "force-dynamic";

/**
 * GET /api/programs/lens?lens=<safer|cheaper|roi|visa-low|scholarship>
 *
 * Server-side "compare-with" lens rankings for /options. The rankings
 * are static-data computations with no per-user inputs — they used to
 * run client-side over the full imported programs.ts, which shipped the
 * 10MB database to the browser (Phase-1 bundle fix, 10 July 2026).
 */
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = await checkRateLimit(`programs-lens:${ip}`, 60, 3600);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } },
      );
    }

    const raw = req.nextUrl.searchParams.get("lens") ?? "safer";
    const lens: Lens = (LENSES as readonly string[]).includes(raw) ? (raw as Lens) : "safer";

    const results = rankForLens(lens);
    return NextResponse.json(
      { lens, results },
      // Static-data ranking — cacheable at the edge.
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" } },
    );
  } catch (err) {
    return apiErrorResponse(err, { route: "programs/lens" }, "Lens ranking failed");
  }
}
