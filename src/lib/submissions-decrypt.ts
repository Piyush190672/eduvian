/**
 * H7 reader helper — Phase C edition (plaintext column dropped).
 *
 * Every API route that reads a submissions row pulls
 * `profile_encrypted` (AES-256-GCM blob) and calls decryptProfile() to
 * get the canonical StudentProfile back. The plaintext `profile` JSONB
 * column was removed in migration 20260505-h7-phase-c-drop-plaintext.sql.
 *
 * Behaviour:
 *  - Decrypt profile_encrypted when present.
 *  - Return null if it's missing or decryption fails. There is no
 *    plaintext fallback — pre-Phase-A rows that never got backfilled
 *    are unrecoverable by design (this is the H7 promise: at-rest PII
 *    is encrypted, period).
 */

import type { StudentProfile } from "./types";
import { decryptJson } from "./pii-crypto";

export interface SubmissionRowShape {
  /** legacy field — accepted on the type for back-compat with callers
   *  that still type-cast their row shape this way; never read at runtime. */
  profile?: unknown;
  profile_encrypted?: string | null;
}

export function decryptProfile(row: SubmissionRowShape): StudentProfile | null {
  if (row?.profile_encrypted) {
    try {
      return decryptJson<StudentProfile>(row.profile_encrypted);
    } catch (e) {
      console.warn("decryptProfile: profile_encrypted failed to decrypt", e);
      return null;
    }
  }
  return null;
}

/**
 * The columns every reader should pull when it wants the decrypted
 * profile. Use as `.select(SUBMISSION_PROFILE_COLUMNS)`.
 */
export const SUBMISSION_PROFILE_COLUMNS = "profile_encrypted, email_hash";
