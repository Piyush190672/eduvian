import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

const COOKIE_NAME = "eduvianai_admin_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin/* sub-routes except the login page itself (/admin)
  const isProtectedAdmin =
    pathname.startsWith("/admin/") ||
    (pathname === "/admin" && false); // login page stays open

  // Protect all /api/admin/* routes (these were previously unprotected)
  const isAdminApi = pathname.startsWith("/api/admin/");

  if (isProtectedAdmin || isAdminApi) {
    const sessionCookie = request.cookies.get(COOKIE_NAME);
    const valid = sessionCookie?.value
      ? verifySessionToken(sessionCookie.value)
      : false;

    if (!valid) {
      if (isAdminApi) {
        // Return JSON 401 for API routes
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      // Redirect to login for UI routes
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
