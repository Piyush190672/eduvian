/**
 * Password hashing + verification — Node scrypt, no third-party dependency.
 *
 * Hash format (PHC-inspired, our own string layout):
 *   scrypt$<N>$<r>$<p>$<saltHex>$<keyHex>
 *
 * scrypt is in Node core (crypto.scrypt) and is intentionally memory-hard;
 * the parameters below match the OWASP password-storage cheat sheet
 * recommendation (N=2^15, r=8, p=1, 32-byte salt, 64-byte key) for new
 * deployments at the time of writing. If we ever need to bump them, the
 * verify() path reads the parameters out of the stored hash so older
 * hashes stay valid until the user logs in and we transparently rehash.
 */

import crypto from "node:crypto";

const SCRYPT_N = 32768;        // 2^15 — memory cost
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN  = 64;
const SALT_LEN = 32;

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 256;

/** Generate a fresh hash for a plaintext password. */
export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LEN);
  const key: Buffer = await new Promise((resolve, reject) => {
    crypto.scrypt(plain, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 128 * 1024 * 1024 }, (err, derived) => {
      if (err) reject(err); else resolve(derived as Buffer);
    });
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("hex")}$${key.toString("hex")}`;
}

/**
 * Constant-time verify against a stored hash. Returns false on any malformed
 * hash, scrypt error, or mismatch — never throws into the caller so a
 * malformed DB row can't crash auth.
 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  if (typeof plain !== "string" || typeof stored !== "string") return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = parseInt(parts[1], 10);
  const r = parseInt(parts[2], 10);
  const p = parseInt(parts[3], 10);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;
  let salt: Buffer, expected: Buffer;
  try {
    salt = Buffer.from(parts[4], "hex");
    expected = Buffer.from(parts[5], "hex");
  } catch {
    return false;
  }
  if (salt.length === 0 || expected.length === 0) return false;
  try {
    const derived: Buffer = await new Promise((resolve, reject) => {
      crypto.scrypt(plain, salt, expected.length, { N, r, p, maxmem: 128 * 1024 * 1024 }, (err, key) => {
        if (err) reject(err); else resolve(key as Buffer);
      });
    });
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * Validate password strength. Returns null when OK, an error string otherwise.
 *
 * Keeping rules minimal in v1: length only. Composition rules (mixed case,
 * digits, symbols) have weak evidence vs. length per the latest NIST 800-63B
 * guidance; we may revisit if we add a strength meter to the UI.
 */
export function validatePasswordStrength(plain: unknown): string | null {
  if (typeof plain !== "string") return "Password is required.";
  if (plain.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (plain.length > MAX_PASSWORD_LENGTH) {
    return "Password is too long.";
  }
  return null;
}
