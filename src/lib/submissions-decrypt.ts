/**
 * H7 Phase B reader helper.
 *
 * Every API route that reads a submissions row should pull both
 * `profile` (plaintext JSONB) and `profile_encrypted` (AES-256-GCM blob)
 * from the table, then call decryptProfile() to get the canonical
 * StudentProfile back.
 *
 * Behaviour:
 *  - Prefer profile_encrypted when present.
 *  - Fall back to plaintext profile if encrypted is missing OR fails to
 *    decrypt (key rotated mid-flight, ciphertext corruption, etc.).
 *  - Falls back to null only if both are missing.
 *
 * Once we ship Phase C and drop the plaintext column, the fallback path
 * becomes unreachable for new rows — but we keep it so that if someone
 * tampers with the DB or restores from a pre-Phase-A backup, we still
 * serve whatever can be served.
 */

import type { StudentProfile } from "./types";
import { decryptJson } from "./pii-crypto";

export interface SubmissionRowShape {
  profile?: unknown;
  profile_encrypted?: string | null;
}

export function decryptProfile(row: SubmissionRowShape): StudentProfile | null {
  if (row?.profile_encrypted) {
    try {
      return decryptJson<StudentProfile>(row.profile_encrypted);
    } catch (e) {
      console.warn("decryptProfile: profile_encrypted failed to decrypt; falling back to plaintext", e);
      // fall through
    }
  }
  if (row?.profile && typeof row.profile === "object") {
    return row.profile as StudentProfile;
  }
  return null;
}

/**
 * The full list of columns every reader should pull when it wants the
 * decrypted profile. Use as `.select(SUBMISSION_PROFILE_COLUMNS)`.
 *
 * Avoids the silent-bug where a route forgets profile_encrypted in its
 * SELECT and silently keeps reading plaintext only.
 */
export const SUBMISSION_PROFILE_COLUMNS = "profile, profile_encrypted, email_hash";
