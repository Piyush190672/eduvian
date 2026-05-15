import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { createServiceClient } from "@/lib/supabase";
import { emailHash } from "@/lib/pii-crypto";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { apiErrorResponse } from "@/lib/api-error";

export const dynamic = "force-dynamic";

const ALLOWED_SURFACES = new Set([
  "results",
  "application-check",
  "interview-prep",
  "visa-coach",
]);

const MAX_COMMENT_LEN = 1000;

/**
 * POST /api/feedback
 *
 * Body:
 *   { rating: 1|2|3|4|5, surface: string, comment?: string }
 *
 * Public — no auth required. Captures the user's session email (when
 * available) via the eduvianai_user cookie so the admin dashboard can
 * tie ratings back to a user if needed. Anonymous traffic is also
 * accepted: email_hash is left null in that case.
 *
 * Rate-limited 5 per 10 minutes per IP to discourage spam.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = await checkRateLimit(`feedback:${ip}`, 5, 600);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many feedback submissions. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    const rating = Number(body?.rating);
    const surface = String(body?.surface ?? "");
    const commentRaw = typeof body?.comment === "string" ? body.comment : "";

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "rating must be an integer 1-5" }, { status: 400 });
    }
    if (!ALLOWED_SURFACES.has(surface)) {
      return NextResponse.json({ error: "invalid surface" }, { status: 400 });
    }
    const comment = commentRaw.trim().slice(0, MAX_COMMENT_LEN) || null;

    const supabase = createServiceClient();
    if (!supabase) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

    const user = await getUserFromRequest(req);
    const email_hash = user?.email ? emailHash(user.email) : null;

    const ua = (req.headers.get("user-agent") ?? "").slice(0, 500);

    const { error } = await supabase
      .from("feedback_surveys")
      .insert({ email_hash, rating, surface, comment, ip, ua });
    if (error) return apiErrorResponse(error, { route: "/api/feedback" });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return apiErrorResponse(e, { route: "/api/feedback" });
  }
}
