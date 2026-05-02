import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { createServiceClient } from "@/lib/supabase";
import { apiErrorResponse } from "@/lib/api-error";

// Reads the session cookie — must be evaluated per-request, never statically.
export const dynamic = "force-dynamic";

/**
 * DPDPA s.13 / GDPR Art.15 — right of access.
 * Returns every piece of data we hold tied to the calling user's email.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in to view your data." }, { status: 401 });
    }
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const email = user.email;

    const [studentRes, submissionsRes, toolUsageRes] = await Promise.all([
      supabase.from("students").select("*").eq("email", email),
      supabase
        .from("submissions")
        .select("token, profile, profile_category, total_matched, created_at, updated_at")
        .filter("profile->>email", "eq", email),
      supabase
        .from("tool_usage")
        .select("tool, cost_estimate_cents, created_at")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

    return NextResponse.json({
      email,
      generated_at: new Date().toISOString(),
      student: studentRes.data ?? [],
      submissions: submissionsRes.data ?? [],
      tool_usage: toolUsageRes.data ?? [],
    });
  } catch (err) {
    return apiErrorResponse(err, { route: "account/access" }, "Could not fetch your data");
  }
}
