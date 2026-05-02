import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

const ADMIN_COOKIE = "eduvianai_admin_session";

// Hosts the app legitimately serves traffic from. Anything else is treated
// as a cross-origin attempt for CSRF purposes.
const ALLOWED_HOSTS = new Set<string>([
  "www.eduvianai.com",
  "eduvianai.com",
  "localhost:3000",
  "127.0.0.1:3000",
]);

const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Routes exempt from the same-origin CSRF check.
 * - /api/admin/session: cross-origin not possible because it requires a Bearer JWT.
 * - /api/health, /api/email/welcome called server-to-server from /api/auth — same-origin,
 *   but listed here for clarity if anything else internal needs to skip.
 */
const CSRF_EXEMPT = new Set<string>([
  "/api/admin/session",
]);

function csrfReject(reason: string) {
  return NextResponse.json({ error: "Forbidden", reason }, { status: 403 });
}

/**
 * Origin/Referer-based CSRF defense (OWASP-recommended primary control).
 * Modern browsers refuse to let cross-origin JS forge Origin/Referer, so a
 * strict same-origin check here blocks the cross-site POST that classic
 * CSRF relies on. Cheaper than synchronizer tokens and breaks nothing on
 * the client side, since all our fetches are same-origin.
 */
function csrfCheck(request: NextRequest): NextResponse | null {
  if (!STATE_CHANGING.has(request.method)) return null;

  const { pathname } = request.nextUrl;
  if (CSRF_EXEMPT.has(pathname)) return null;
  if (!pathname.startsWith("/api/")) return null;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // At least one must be present and same-origin.
  let host: string | null = null;
  if (origin) {
    try {
      host = new URL(origin).host;
    } catch {
      return csrfReject("bad_origin");
    }
  } else if (referer) {
    try {
      host = new URL(referer).host;
    } catch {
      return csrfReject("bad_referer");
    }
  } else {
    // No Origin and no Referer on a state-changing request — treat as
    // suspicious. Genuine browser POSTs always include at least one.
    return csrfReject("missing_origin");
  }

  if (!ALLOWED_HOSTS.has(host)) {
    return csrfReject("cross_origin");
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF gate runs first for every state-changing /api/* call.
  const csrfFail = csrfCheck(request);
  if (csrfFail) return csrfFail;

  // The session endpoint itself must be reachable without a session cookie —
  // POST creates it (chicken-and-egg), DELETE clears it on logout.
  if (pathname === "/api/admin/session") return NextResponse.next();

  // Protect /admin/* sub-routes (login page at /admin stays open)
  const isProtectedAdmin = pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");

  if (isProtectedAdmin || isAdminApi) {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE);
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
  matcher: [
    // Admin gate (existing).
    "/admin/:path*",
    "/api/admin/:path*",
    // CSRF gate — every API route. The handler returns early on GET.
    "/api/:path*",
  ],
};
