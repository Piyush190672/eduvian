import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all admin sub-routes (but not the login page itself)
  const isProtectedAdmin =
    pathname.startsWith("/admin/") ||
    (pathname === "/admin" && false); // /admin itself is the login page — leave it open

  if (isProtectedAdmin) {
    const session = request.cookies.get("eduvianai_admin_session");
    if (!session?.value) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
