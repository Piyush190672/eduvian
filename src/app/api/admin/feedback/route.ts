import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { apiErrorResponse } from "@/lib/api-error";
import { logAdminAction, sessionActorFromHeaders } from "@/lib/admin-audit";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/feedback
 *
 * Reads the feedback_surveys table for the admin dashboard. Returns:
 *   - total           : count of all responses
 *   - average         : average rating (1-5)
 *   - bySurface       : per-surface breakdown { surface, count, average, dist }
 *   - distribution    : overall 5-bucket rating histogram
 *   - recent          : 20 most recent rows with comment / surface / rating / created_at
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`admin-feedback:${ip}`, 100, 3600);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const actor = sessionActorFromHeaders(req.headers);
  logAdminAction({
    actor: actor ?? "unknown",
    actor_kind: "session_hash",
    action: "feedback.read",
    ip,
    ua: req.headers.get("user-agent"),
  });

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({
      total: 0, average: 0, bySurface: [], distribution: [0, 0, 0, 0, 0], recent: [],
    });
  }

  try {
    const { data, error } = await supabase
      .from("feedback_surveys")
      .select("rating, surface, comment, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const rows = (data ?? []) as Array<{
      rating: number;
      surface: string;
      comment: string | null;
      created_at: string;
    }>;

    const total = rows.length;
    const sum = rows.reduce((a, r) => a + r.rating, 0);
    const average = total > 0 ? sum / total : 0;

    const distribution = [0, 0, 0, 0, 0];
    for (const r of rows) distribution[r.rating - 1]++;

    const bySurfaceMap = new Map<string, { count: number; sum: number; dist: number[] }>();
    for (const r of rows) {
      const e = bySurfaceMap.get(r.surface) ?? { count: 0, sum: 0, dist: [0, 0, 0, 0, 0] };
      e.count++;
      e.sum += r.rating;
      e.dist[r.rating - 1]++;
      bySurfaceMap.set(r.surface, e);
    }
    const bySurface = [...bySurfaceMap.entries()]
      .map(([surface, v]) => ({
        surface,
        count: v.count,
        average: v.sum / v.count,
        dist: v.dist,
      }))
      .sort((a, b) => b.count - a.count);

    const recent = rows.slice(0, 20);
    return NextResponse.json({ total, average, distribution, bySurface, recent });
  } catch (e) {
    return apiErrorResponse(e, { route: "/api/admin/feedback" });
  }
}
