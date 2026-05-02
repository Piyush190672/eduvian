import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, USER_COOKIE_NAME } from "@/lib/user-cookie";
import { createServiceClient } from "@/lib/supabase";
import { apiErrorResponse } from "@/lib/api-error";

// Reads the session cookie — must be evaluated per-request, never statically.
export const dynamic = "force-dynamic";

/**
 * DPDPA s.13 / GDPR Art.17 — right to erasure.
 *
 * Permanently deletes every personally-identifiable record we hold for the
 * calling user across: students, submissions (looked up by JSONB email),
 * user_sessions, and tool_usage. Clears the session cookie before
 * responding so the browser is logged out immediately.
 *
 * The client must POST { confirm: "DELETE" } so an accidental call (or a
 * forged request that somehow slipped past CSRF) cannot trigger erasure.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in to delete your data." }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { confirm?: string };
    if (body.confirm !== "DELETE") {
      return NextResponse.json(
        { error: 'Confirmation required. POST {"confirm":"DELETE"}.' },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const email = user.email;

    // Run in parallel — each is independent. Errors are collected, not thrown,
    // so a partial failure still removes whatever it can.
    const [students, submissions, sessions, toolUsage] = await Promise.all([
      supabase.from("students").delete().eq("email", email),
      supabase.from("submissions").delete().filter("profile->>email", "eq", email),
      supabase.from("user_sessions").delete().eq("email", email),
      supabase.from("tool_usage").delete().eq("email", email),
    ]);

    const errors = [students.error, submissions.error, sessions.error, toolUsage.error].filter(Boolean);
    if (errors.length) {
      console.error("account/delete partial failure:", errors);
      return NextResponse.json(
        {
          error: "Some data could not be deleted. Contact privacy@eduvianai.com.",
          partial: true,
        },
        { status: 500 },
      );
    }

    const res = NextResponse.json({ ok: true, email });
    // Clear the cookie even though the session row is now gone.
    res.cookies.set(USER_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (err) {
    return apiErrorResponse(err, { route: "account/delete" }, "Could not delete your data");
  }
}
