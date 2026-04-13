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

// universities grouped by country  {country -> sorted string[]}
const _byCountry: Record<string, Set<string>> = {};

for (const p of PROGRAMS) {
  if (!p || !p.university_name) continue; // guard against sparse/undefined entries
  uniSet.add(p.university_name);
  countrySet.add(p.country);
  fieldSet.add(p.field_of_study);
  if (!_byCountry[p.country]) _byCountry[p.country] = new Set();
  _byCountry[p.country].add(p.university_name);
}

export const universitiesByCountry: Record<string, string[]> = {};
for (const [country, unis] of Object.entries(_byCountry)) {
  universitiesByCountry[country] = [...unis].sort();
}

// ── Exported stats ─────────────────────────────────────────────────────────

export const DB_STATS = {
  /** Total program rows */
  totalPrograms: PROGRAMS.length,
  /** Unique universities */
  totalUniversities: uniSet.size,
  /** Unique countries */
  totalCountries: countrySet.size,
  /** Unique fields of study */
  totalFields: fieldSet.size,
  /** Display strings — update automatically */
  programsLabel: `${PROGRAMS.length.toLocaleString()}+`,
  universitiesLabel: `${uniSet.size}+`,
  countriesLabel: `${countrySet.size}`,
  fieldsLabel: `${fieldSet.size}`,
} as const;
