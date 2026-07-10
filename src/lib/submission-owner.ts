import type { NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { emailHash } from "@/lib/pii-crypto";
import type { StudentProfile } from "@/lib/types";

/**
 * Ownership + PII redaction for token-keyed submission surfaces
 * (Phase 1 item 5, 10 July 2026).
 *
 * The results token is deliberately shareable — students forward their
 * /results/[token] link to parents, and the emailed PDF carries it too.
 * That stays. What changes: contact PII (email, phone) is only returned
 * to the OWNER (session email_hash matches the submission's), and
 * shortlist writes require ownership. A shared link keeps working as a
 * read-only view with masked contact details.
 */

/**
 * True when the requester's session email hashes to the submission's
 * email_hash. Rows without an email_hash (in-memory dev fallback) are
 * treated as owned by any authenticated user — they only exist in
 * dev/preview where Supabase isn't configured.
 */
export async function isSubmissionOwner(
  req: NextRequest,
  submissionEmailHash: string | null | undefined,
): Promise<boolean> {
  const user = await getUserFromRequest(req);
  if (!user?.email) return false;
  if (!submissionEmailHash) return true; // dev fallback rows carry no hash
  try {
    return emailHash(user.email.toLowerCase().trim()) === submissionEmailHash;
  } catch {
    return false;
  }
}

/**
 * True when the email belongs to a registered student. Drives the
 * results-teaser gate (Phase 2 #7, 10 July 2026): submissions from
 * emails with no account show only a top-5 teaser to non-owner viewers
 * until the submitter registers (OTP verifies the email, the session
 * hash then matches, and the full list unlocks). Fails OPEN — if the
 * lookup is unavailable we show the full list rather than lock paying
 * attention out of legitimate users.
 */
export async function isEmailRegistered(email: string | undefined | null): Promise<boolean> {
  if (!email || !email.includes("@")) return true;
  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    if (!supabase) return true;
    const { data, error } = await supabase
      .from("students")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();
    if (error) return true;
    return !!data;
  } catch {
    return true;
  }
}

/** "kpiyush@yahoo.com" → "k•••@yahoo.com" (keeps domain for recognisability). */
export function maskEmail(email: string | undefined | null): string {
  if (!email || !email.includes("@")) return "•••";
  const [local, domain] = email.split("@");
  const head = local.slice(0, 1);
  return `${head}•••@${domain}`;
}

/** "+919811897478" → "+91••••••7478" (keeps country code + last 4). */
export function maskPhone(phone: string | undefined | null): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  if (trimmed.length <= 4) return "••••";
  const keepHead = trimmed.startsWith("+") ? 3 : 0;
  const head = trimmed.slice(0, keepHead);
  const tail = trimmed.slice(-4);
  return `${head}${"•".repeat(Math.max(2, trimmed.length - keepHead - 4))}${tail}`;
}

/**
 * Copy of the profile with contact PII masked — served to non-owner
 * viewers of a shared results link / PDF. Academic and preference
 * fields stay intact (they're the substance being shared).
 */
export function redactProfileContact(profile: StudentProfile): StudentProfile {
  return {
    ...profile,
    email: maskEmail(profile.email),
    phone: maskPhone(profile.phone),
  };
}
