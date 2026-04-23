/**
 * HMAC-signed session tokens for admin authentication.
 * Works in serverless environments (no server-side storage needed).
 *
 * Token format: base64url(payload).HMAC-SHA256(base64url(payload))
 * Payload: { iat: <epoch-ms>, exp: <epoch-ms> }
 */

import { createHmac, timingSafeEqual } from "crypto";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    // Fail loud in production — this env var must be set
    throw new Error("ADMIN_SESSION_SECRET environment variable is not set");
  }
  return secret ?? "dev-only-secret-not-for-production";
}

/** Create a new signed session token. */
export function createSessionToken(): string {
  const payload = JSON.stringify({ iat: Date.now(), exp: Date.now() + SESSION_TTL_MS });
  const b64 = Buffer.from(payload).toString("base64url");
  const sig  = createHmac("sha256", getSecret()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

/** Verify a session token. Returns true if valid and not expired. */
export function verifySessionToken(token: string): boolean {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;

    const b64 = token.slice(0, dot);
    const sig  = token.slice(dot + 1);

    // Constant-time signature comparison to prevent timing attacks
    const expected = createHmac("sha256", getSecret()).update(b64).digest("base64url");
    const expectedBuf = Buffer.from(expected);
    const actualBuf   = Buffer.from(sig);
    if (expectedBuf.length !== actualBuf.length) return false;
    if (!timingSafeEqual(expectedBuf, actualBuf)) return false;

    // Check expiry
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8"));
    return typeof payload.exp === "number" && Date.now() < payload.exp;
  } catch {
    return false;
  }
}
