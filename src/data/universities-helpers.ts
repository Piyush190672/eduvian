// Canonicalised lookup from a Program.university_name → University row.
//
// Program.university_name strings vary slightly across the verification
// pipeline ("The University of Manchester" vs "University of Manchester",
// "UC Berkeley" vs "University of California, Berkeley"). The normaliser
// strips a small set of common variations before matching so the sidecar
// stays a single row per institution.

import type { University } from "@/lib/types";
import { UNIVERSITIES } from "./universities";

/** Lowercase, strip leading "the ", normalise "&"→"and", collapse whitespace. */
export function normaliseUniversityName(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/^the\s+/, "")
    .replace(/\s*&\s*/g, " and ")
    .replace(/\s+/g, " ");
}

// Built once at module load. ~545 universities expected at full coverage —
// linear scan is fine on every page render too, but a map keeps cost
// constant regardless of growth.
const byNormalisedName: Map<string, University> = (() => {
  const m = new Map<string, University>();
  for (const u of UNIVERSITIES) {
    m.set(normaliseUniversityName(u.name), u);
  }
  return m;
})();

/** Resolve a Program.university_name to a University row, or null if no
 *  sidecar entry exists. Match is case- and whitespace-insensitive and
 *  ignores leading "The " / "&"↔"and". */
export function lookupUniversity(programUniversityName: string): University | null {
  return byNormalisedName.get(normaliseUniversityName(programUniversityName)) ?? null;
}

/** True if the sidecar has any meaningful field set for the given university
 *  (i.e. not just the bare id/name/country stub). Used by UI surfaces to
 *  decide whether to render a section at all. */
export function hasUniversityProfile(programUniversityName: string): boolean {
  const u = lookupUniversity(programUniversityName);
  if (!u) return false;
  return (
    u.acceptance_rate != null ||
    u.median_earnings_6yr_usd != null ||
    u.median_earnings_10yr_usd != null ||
    u.school_type != null ||
    u.setting != null ||
    u.enrollment_undergrad != null
  );
}
