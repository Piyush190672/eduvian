import { NextResponse } from "next/server";
import { createSessionToken } from "@/lib/session";

const COOKIE_NAME = "eduvianai_admin_session";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// POST — called after successful Supabase auth to set the session cookie
export async function POST() {
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
