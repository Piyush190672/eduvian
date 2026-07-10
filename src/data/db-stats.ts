/**
 * db-stats.ts
 * Single source of truth for all database statistics.
 * Computed dynamically from PROGRAMS — never needs manual updates.
 */

import { PROGRAMS } from "./programs";

// ── Compute unique sets ────────────────────────────────────────────────────

const uniSet = new Set<string>();
const countrySet = new Set<string>();
const fieldSet = new Set<string>();
// Universities with at least one program carrying `verified_at` — i.e.
// our pipeline confirmed at least one program against the live
// university page. Used to label the "Verified Global Universities"
// stat without overclaiming on the unverified tail.
const verifiedUniSet = new Set<string>();
let verifiedProgramCount = 0;
let maxVerifiedAt = "";

// universities grouped by country  {country -> sorted string[]}
const _byCountry: Record<string, Set<string>> = {};
// program count per country — closes L2 from the security audit, which
// flagged that /api/chat hardcoded these numbers and drifted from the DB.
const _programCountByCountry: Record<string, number> = {};

interface MaybeVerified {
  university_name?: string;
  country?: string;
  field_of_study?: string;
  verified_at?: string | null;
}

for (const p of PROGRAMS as MaybeVerified[]) {
  if (!p || !p.university_name) continue; // guard against sparse/undefined entries
  uniSet.add(p.university_name);
  if (p.country) countrySet.add(p.country);
  if (p.field_of_study) fieldSet.add(p.field_of_study);
  if (p.country) {
    if (!_byCountry[p.country]) _byCountry[p.country] = new Set();
    _byCountry[p.country].add(p.university_name);
    _programCountByCountry[p.country] = (_programCountByCountry[p.country] ?? 0) + 1;
  }
  if (p.verified_at) {
    verifiedProgramCount += 1;
    verifiedUniSet.add(p.university_name);
    // ISO timestamps compare lexicographically — track the newest.
    if (p.verified_at > maxVerifiedAt) maxVerifiedAt = p.verified_at;
  }
}

// Human label for the most recent pipeline verification, e.g. "18 May 2026".
// Computed at build time from the data itself — replaces the hardcoded
// string on the homepage that silently went stale (trust-integrity sweep,
// 10 July 2026).
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function humanDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
const lastVerifiedLabel = maxVerifiedAt ? humanDate(maxVerifiedAt) : "";

export const universitiesByCountry: Record<string, string[]> = {};
for (const [country, unis] of Object.entries(_byCountry)) {
  universitiesByCountry[country] = [...unis].sort();
}

/**
 * Program count per country, ranked DESC. Use this in any place that
 * needs to enumerate countries by depth (e.g., the chat-route system
 * prompt). Avoids hardcoded counts that drift from the DB.
 */
export const programsByCountry: Array<{ country: string; count: number }> =
  Object.entries(_programCountByCountry)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

// ── Exported stats ─────────────────────────────────────────────────────────

export const DB_STATS = {
  /** Total program rows */
  totalPrograms: PROGRAMS.length,
  /** Programs whose fields were confirmed against a live university page */
  totalVerifiedPrograms: verifiedProgramCount,
  /** Unique universities */
  totalUniversities: uniSet.size,
  /** Universities with at least one verified-at-source program */
  totalVerifiedUniversities: verifiedUniSet.size,
  /** Unique countries */
  totalCountries: countrySet.size,
  /** Unique fields of study */
  totalFields: fieldSet.size,
  /** Display strings — update automatically */
  programsLabel: `${PROGRAMS.length.toLocaleString()}+`,
  verifiedProgramsLabel: `${verifiedProgramCount.toLocaleString()}+`,
  universitiesLabel: `${uniSet.size}+`,
  verifiedUniversitiesLabel: `${verifiedUniSet.size}+`,
  countriesLabel: `${countrySet.size}`,
  fieldsLabel: `${fieldSet.size}`,
  /** Most recent verified_at across the DB, e.g. "18 May 2026". */
  lastVerifiedLabel,
} as const;
