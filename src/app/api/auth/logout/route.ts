import { NextRequest, NextResponse } from "next/server";
import { USER_COOKIE_NAME, USER_COOKIE_OPTS, revokeUserSession } from "@/lib/user-cookie";
import { apiErrorResponse } from "@/lib/api-error";

// Reads + mutates the session cookie — must run per-request.
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/logout
 *
 * Revokes the user's session (deletes the row in `user_sessions`) and
 * clears the `eduvianai_user` cookie. CSRF-protected at the middleware
 * layer like every other state-changing /api/* route. Idempotent — safe
 * to call even when the user isn't signed in.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(USER_COOKIE_NAME)?.value;
    if (token) await revokeUserSession(token);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(USER_COOKIE_NAME, "", { ...USER_COOKIE_OPTS, maxAge: 0 });
    return res;
  } catch (err) {
    return apiErrorResponse(err, { route: "auth/logout" }, "Logout failed");
  }
}
