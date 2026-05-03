/**
 * Email OTP primitives — generate, hash, verify.
 *
 * Code is HMAC-SHA256 hashed before storage, keyed on PII_HASH_SECRET
 * (same secret already used for emailHash in pii-crypto.ts). The hash
 * input includes the email address so a leaked code for one user can't
 * be replayed for another.
 *
 * Numbers are tunable in OTP_CONFIG; the route layer enforces them.
 */

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const OTP_CONFIG = {
  /** Code lifetime in seconds. */
  expirySeconds: 300, // 5 min
  /** Min seconds between resend requests for the same email. */
  resendCooldownSeconds: 60,
  /** Max wrong submissions before lockout. */
  maxAttempts: 5,
  /** Cooldown after maxAttempts hit, in seconds. */
  lockoutSeconds: 15 * 60,
  /** Per-IP send-otp request cap, sliding window. */
  ipSendLimit: 10,
  ipSendWindowSeconds: 60 * 60,
};

/** Six-digit, zero-padded. */
export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function getSecret(): Buffer {
  const hex = process.env.PII_HASH_SECRET;
  if (!hex || hex.length !== 64) {
    throw new Error("PII_HASH_SECRET missing or not 32-byte hex");
  }
  return Buffer.from(hex, "hex");
}

/** HMAC-SHA256(secret, "<email>:<code>"). Hex string. */
export function hashOtpCode(code: string, email: string): string {
  const norm = email.toLowerCase().trim();
  return createHmac("sha256", getSecret())
    .update(`${norm}:${code}`)
    .digest("hex");
}

/** Constant-time compare so wrong codes don't leak timing data. */
export function verifyOtpCode(
  submittedCode: string,
  email: string,
  storedHash: string,
): boolean {
  if (!/^[0-9]{6}$/.test(submittedCode)) return false;
  const got = Buffer.from(hashOtpCode(submittedCode, email), "hex");
  let expected: Buffer;
  try {
    expected = Buffer.from(storedHash, "hex");
  } catch {
    return false;
  }
  if (got.length !== expected.length) return false;
  return timingSafeEqual(got, expected);
}
