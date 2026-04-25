/**
 * HMAC-signed session tokens for admin authentication.
 * Uses Web Crypto API so it works in both Node (route handlers)
 * and Edge runtimes (middleware).
 *
 * Token format: base64url(payload).HMAC-SHA256(base64url(payload))
 * Payload: { iat: <epoch-ms>, exp: <epoch-ms> }
 */

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_SESSION_SECRET environment variable is not set");
  }
  return secret ?? "dev-only-secret-not-for-production";
}

// ── base64url helpers (Edge-compatible) ───────────────────────────────────
function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function stringToBase64Url(str: string): string {
  return bytesToBase64Url(new TextEncoder().encode(str));
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function base64UrlToString(b64url: string): string {
  return new TextDecoder().decode(base64UrlToBytes(b64url));
}

// ── HMAC via Web Crypto ───────────────────────────────────────────────────
async function hmacSign(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bytesToBase64Url(new Uint8Array(sig));
}

function timingSafeEqualStr(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Create a new signed session token. */
export async function createSessionToken(): Promise<string> {
  const payload = JSON.stringify({ iat: Date.now(), exp: Date.now() + SESSION_TTL_MS });
  const b64 = stringToBase64Url(payload);
  const sig = await hmacSign(b64);
  return `${b64}.${sig}`;
}

/** Verify a session token. Returns true if valid and not expired. */
export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return false;
    const b64 = token.slice(0, dot);
    const sig = token.slice(dot + 1);

    const expected = await hmacSign(b64);
    if (!timingSafeEqualStr(expected, sig)) return false;

    const payload = JSON.parse(base64UrlToString(b64));
    return typeof payload.exp === "number" && Date.now() < payload.exp;
  } catch {
    return false;
  }
}
