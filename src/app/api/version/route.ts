import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Captured at module load — first time the file is evaluated in a given
// serverless instance. Effectively "since this Lambda's cold start", which
// is a useful proxy for "instance freshness". Doesn't survive redeploys
// (each deploy spawns new Lambdas).
const COLD_START_AT = new Date().toISOString();

/**
 * GET /api/version
 *
 * Deterministic deploy-check endpoint. Returns the commit SHA Vercel built
 * from + the build environment so an external caller (or you, manually)
 * can confirm whether a specific commit has actually shipped without
 * digging through the Vercel dashboard.
 *
 * Example response:
 *   {
 *     "commit": "dbf3c0395f17b97c6f2c84d54a9aceeb8b8a4d4f",
 *     "commit_short": "dbf3c03",
 *     "commit_message": "results: budget-headroom message moves into…",
 *     "branch": "main",
 *     "env": "production",
 *     "node_env": "production",
 *     "cold_start_at": "2026-05-12T10:34:21.219Z",
 *     "now": "2026-05-12T10:35:18.701Z"
 *   }
 *
 * Public endpoint (no auth). All values originate from Vercel's
 * documented build-time env vars — nothing sensitive surfaces.
 * Rate-limited at 60 req/h per IP — high enough for legitimate
 * polling, low enough to disincentivise scraping for fingerprinting.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`version:${ip}`, 60, 3600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } },
    );
  }

  // commit_message + branch removed from the public payload (Phase 1
  // item 5) — this repo's commit messages describe internal changes in
  // detail, which made the endpoint a reconnaissance aid. The SHA alone
  // is enough for an is-this-commit-live check.
  const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  return NextResponse.json(
    {
      commit,
      commit_short: commit ? commit.slice(0, 7) : null,
      env: process.env.VERCEL_ENV ?? null,
      cold_start_at: COLD_START_AT,
      now: new Date().toISOString(),
    },
    {
      headers: {
        // Never cache — the whole point is to know whether the build the
        // caller is talking to is the latest one.
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
