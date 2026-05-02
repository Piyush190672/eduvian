import { NextResponse, type NextRequest } from "next/server";
import { createSessionToken } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase";
import { isOwnerEmail } from "@/lib/beta-gate";

const COOKIE_NAME = "eduvianai_admin_session";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// POST — verify Supabase JWT + owner allowlist, then issue admin cookie
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
  if (!m) {
    return NextResponse.json({ ok: false, error: "missing_bearer_token" }, { status: 401 });
  }
  const jwt = m[1];

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "auth_unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data?.user?.email) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  if (!isOwnerEmail(data.user.email)) {
    return NextResponse.json({ ok: false, error: "not_authorized" }, { status: 403 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, { ...COOKIE_OPTS, maxAge: 60 * 60 * 8 }); // 8 h
  return res;
}

// DELETE — called on logout to clear the session cookie
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}
