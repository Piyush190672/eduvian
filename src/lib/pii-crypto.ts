/**
 * AES-256-GCM encryption helpers for PII at rest.
 *
 * Strategy:
 * - PII_ENCRYPTION_KEY (32 bytes hex) drives the cipher.
 * - PII_HASH_SECRET (32 bytes hex) drives the deterministic email hash
 *   used for equality lookups (e.g. /api/auth login by email).
 *
 * Why a separate hash secret: the encryption key is used for randomised
 * AES-GCM, which produces a different ciphertext for the same plaintext
 * every call — perfect for confidentiality, useless for SELECT WHERE
 * email = ?. We pair encrypted columns with a deterministic
 * HMAC-SHA256(email) column for indexed lookups. The hash secret keeps
 * an attacker who only sees the DB from running a rainbow-table attack
 * against email hashes.
 *
 * Stored ciphertext format (single bytea):
 *   v(1 byte) | iv(12 bytes) | tag(16 bytes) | ciphertext(N bytes)
 * v = 1 today.
 *
 * Rotation path: bump v, decrypt-on-read accepts both versions, encrypt-on-
 * write uses the new one, run a re-encrypt sweep when ready.
 */

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  type CipherGCMTypes,
} from "node:crypto";

const VERSION_BYTE = 1;
const IV_LEN = 12;
const TAG_LEN = 16;
const ALGO: CipherGCMTypes = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.PII_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("PII_ENCRYPTION_KEY missing or not 32-byte hex");
  }
  return Buffer.from(hex, "hex");
}

function getHashSecret(): Buffer {
  const hex = process.env.PII_HASH_SECRET;
  if (!hex || hex.length !== 64) {
    throw new Error("PII_HASH_SECRET missing or not 32-byte hex");
  }
  return Buffer.from(hex, "hex");
}

/** Returns a base64-encoded blob suitable for storing in a TEXT column. */
export function encryptString(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // [v(1)][iv(12)][tag(16)][ct(N)]
  const blob = Buffer.concat([Buffer.from([VERSION_BYTE]), iv, tag, ct]);
  return blob.toString("base64");
}

export function decryptString(blob: string): string {
  const buf = Buffer.from(blob, "base64");
  if (buf.length < 1 + IV_LEN + TAG_LEN) {
    throw new Error("ciphertext blob too short");
  }
  const v = buf[0];
  if (v !== VERSION_BYTE) {
    throw new Error(`unknown ciphertext version: ${v}`);
  }
  const iv = buf.subarray(1, 1 + IV_LEN);
  const tag = buf.subarray(1 + IV_LEN, 1 + IV_LEN + TAG_LEN);
  const ct = buf.subarray(1 + IV_LEN + TAG_LEN);
  const key = getKey();
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

export function encryptJson(value: unknown): string {
  return encryptString(JSON.stringify(value));
}

export function decryptJson<T = unknown>(blob: string): T {
  return JSON.parse(decryptString(blob)) as T;
}

/**
 * Deterministic, indexable hash of an email. Lowercases + trims first so
 * "Foo@Bar.com " and "foo@bar.com" produce the same hash.
 */
export function emailHash(email: string): string {
  const norm = email.toLowerCase().trim();
  return createHmac("sha256", getHashSecret()).update(norm).digest("hex");
}

/** Quick env-presence check for routes that want to short-circuit cleanly. */
export function isEncryptionConfigured(): boolean {
  return (
    typeof process.env.PII_ENCRYPTION_KEY === "string" &&
    process.env.PII_ENCRYPTION_KEY.length === 64 &&
    typeof process.env.PII_HASH_SECRET === "string" &&
    process.env.PII_HASH_SECRET.length === 64
  );
}
