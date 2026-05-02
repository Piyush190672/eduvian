/**
 * Opaque server-side user sessions.
 *
 * The cookie value is a UUID that maps to a row in `user_sessions` —
 * email is stored only server-side, not embedded in the cookie. Replaces
 * the prior HMAC-signed JWT-style payload that exposed the email in
 * base64url form to anyone who could read the browser cookie store.
 *
 * The `eduvianai_user` cookie name and 30-day TTL are unchanged. Existing
 * cookies in users' browsers no longer validate (different shape), so all
 * users will be transparently logged out and prompted to sign back in.
 */

import type { NextRequest } from "next/server";
import { createServiceClient } from "./supabase";

const USER_COOKIE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const USER_COOKIE_NAME = "eduvianai_user";
export const USER_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
};

// UUID v4 shape — quick filter so we never query Postgres with a string
// that will explode the `uuid` column cast (legacy HMAC tokens contain a
// dot and arbitrary length).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface CreateSessionMeta {
  ip?: string;
  userAgent?: string;
}

/** Insert a new session and return its UUID — caller stores it in the cookie. */
export async function createUserToken(
  email: string,
  meta: CreateSessionMeta = {}
): Promise<string> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error("Database unavailable for session creation");

  const expiresAt = new Date(Date.now() + USER_COOKIE_TTL_MS).toISOString();
  const { data, error } = await supabase
    .from("user_sessions")
    .insert({
      email: email.toLowerCase().trim(),
      expires_at: expiresAt,
      user_agent: meta.userAgent ?? null,
      ip: meta.ip ?? null,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(`Failed to create session: ${error?.message ?? "no row returned"}`);
  }
  return String(data.id);
}

/** Resolve a session UUID to the bound email, or null if missing/expired/invalid. */
export async function verifyUserToken(token: string): Promise<{ email: string } | null> {
  if (!token || !UUID_RE.test(token)) return null;
  const supabase = createServiceClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("user_sessions")
      .select("email, expires_at")
      .eq("id", token)
      .maybeSingle();
    if (error || !data) return null;
    const exp = new Date(data.expires_at as string).getTime();
    if (!Number.isFinite(exp) || exp < Date.now()) return null;
    const email = String(data.email ?? "");
    return email ? { email } : null;
  } catch {
    return null;
  }
}

/** Read & verify the user cookie from a NextRequest. */
export async function getUserFromRequest(
  req: NextRequest
): Promise<{ email: string } | null> {
  const token = req.cookies.get(USER_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyUserToken(token);
}

/** Delete a single session — used on logout. Best-effort; never throws. */
export async function revokeUserSession(token: string): Promise<void> {
  if (!token || !UUID_RE.test(token)) return;
  const supabase = createServiceClient();
  if (!supabase) return;
  try {
    await supabase.from("user_sessions").delete().eq("id", token);
  } catch {
    /* ignore */
  }
}
