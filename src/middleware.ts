import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

const COOKIE_NAME = "eduvianai_admin_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // The session endpoint itself must be reachable without a session cookie —
  // POST creates it (chicken-and-egg), DELETE clears it on logout.
  if (pathname === "/api/admin/session") return NextResponse.next();

  // Protect /admin/* sub-routes (login page at /admin stays open)
  const isProtectedAdmin = pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");

  if (isProtectedAdmin || isAdminApi) {
    const sessionCookie = request.cookies.get(COOKIE_NAME);
    const valid = sessionCookie?.value
      ? await verifySessionToken(sessionCookie.value)
      : false;

    if (!valid) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
