/**
 * db-stats.ts
 * Single source of truth for all database statistics.
 *
 * Since the Phase-1 bundle fix (10 July 2026) this module reads the tiny
 * AUTO-GENERATED stats literal (db-stats-generated.ts, ~23KB) instead of
 * importing the full 10MB programs.ts. Importing PROGRAMS here compiled
 * the entire program database into a 9.3MB client chunk on every page
 * that rendered a stat label — including the homepage (923kB First-Load
 * JS) — and exposed the whole proprietary dataset in browser devtools.
 *
 * Regeneration: `npx tsx scripts/generate-db-stats.ts`, wired into the
 * `prebuild` npm script. The vitest data-invariant suite fails CI if the
 * committed generated file drifts from the live data.
 */

import { GENERATED_DB_STATS } from "./db-stats-generated";

const g = GENERATED_DB_STATS;

/** Universities grouped by country {country -> sorted names}. */
export const universitiesByCountry: Record<string, readonly string[]> =
  g.universitiesByCountry;

/**
 * Program count per country, ranked DESC. Use this in any place that
 * needs to enumerate countries by depth (e.g., the chat-route system
 * prompt). Avoids hardcoded counts that drift from the DB.
 */
export const programsByCountry: ReadonlyArray<{ country: string; count: number }> =
  g.programsByCountry;

// Human label for the most recent pipeline verification, e.g. "14 May 2026".
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function humanDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export const DB_STATS = {
  /** Total program rows */
  totalPrograms: g.totalPrograms,
  /** Programs whose fields were confirmed against a live university page */
  totalVerifiedPrograms: g.totalVerifiedPrograms,
  /** Unique universities */
  totalUniversities: g.totalUniversities,
  /** Universities with at least one verified-at-source program */
  totalVerifiedUniversities: g.totalVerifiedUniversities,
  /** Unique countries */
  totalCountries: g.totalCountries,
  /** Unique fields of study */
  totalFields: g.totalFields,
  /** Display strings — update automatically on regeneration */
  programsLabel: `${g.totalPrograms.toLocaleString()}+`,
  verifiedProgramsLabel: `${g.totalVerifiedPrograms.toLocaleString()}+`,
  universitiesLabel: `${g.totalUniversities}+`,
  verifiedUniversitiesLabel: `${g.totalVerifiedUniversities}+`,
  countriesLabel: `${g.totalCountries}`,
  fieldsLabel: `${g.totalFields}`,
  /** Most recent verified_at across the DB, e.g. "14 May 2026". */
  lastVerifiedLabel: g.maxVerifiedAt ? humanDate(g.maxVerifiedAt) : "",
} as const;
