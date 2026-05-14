// Stage 2 of the data-enrichment plan: fetch US universities' acceptance
// rate, median earnings, school type, setting, and undergrad enrolment
// from the U.S. Department of Education College Scorecard public API.
//
// Source: api.data.gov/ed/collegescorecard (free, public, no scraping).
// Coverage: ~6,000 US institutions in Scorecard; we only need the ~134
// unique USA universities currently in programs.ts.
//
// Inputs:
//   scripts/universities/usa-catalog.json — array of canonical names
//     pulled from programs.ts (one row per unique USA university).
//
// Outputs:
//   scripts/universities/scorecard-usa-results.json — raw fetch results
//     keyed by canonical name. Hand-merged into src/data/universities.ts
//     by a separate merge step so the diff stays reviewable.
//   scripts/universities/scorecard-usa-misses.json — names where the
//     Scorecard search returned 0 or low-confidence matches; surfaced
//     for manual review (rename, drop, or accept the closest match).
//
// API key: pass via API_DATA_GOV_KEY env. DEMO_KEY works for low-volume
// runs (134 schools fit comfortably) but rate-limited; signup at
// https://api.data.gov/signup/ gives a 1000/hr personal key.
//
// Usage:
//   API_DATA_GOV_KEY=... npx tsx scripts/universities/fetch-scorecard-usa.ts

import * as fs from "node:fs/promises";
import * as path from "node:path";

const API_BASE = "https://api.data.gov/ed/collegescorecard/v1/schools.json";
const FIELDS = [
  "id",
  "school.name",
  "school.city",
  "school.state",
  "school.ownership",                                       // 1=public 2=NFP 3=FP
  "school.locale",                                          // 11..43 NCES locale code
  "latest.admissions.admission_rate.overall",               // 0..1
  "latest.earnings.6_yrs_after_entry.median",               // USD
  "latest.earnings.10_yrs_after_entry.median",              // USD
  "latest.student.size",                                    // total
  "latest.student.enrollment.undergrad_12_month",           // UG headcount
].join(",");

interface ScorecardSchool {
  id: number;
  "school.name": string;
  "school.city"?: string;
  "school.state"?: string;
  "school.ownership"?: number;
  "school.locale"?: number;
  "latest.admissions.admission_rate.overall"?: number | null;
  "latest.earnings.6_yrs_after_entry.median"?: number | null;
  "latest.earnings.10_yrs_after_entry.median"?: number | null;
  "latest.student.size"?: number | null;
  "latest.student.enrollment.undergrad_12_month"?: number | null;
}

interface ScorecardResponse {
  metadata: { total: number; page: number; per_page: number };
  results: ScorecardSchool[];
}

// Map NCES locale code → our coarse {urban, suburban, town, rural} bucket.
// "town" collapses into "suburban" per our schema (no separate town value).
function localeToSetting(code: number | undefined): "urban" | "suburban" | "rural" | null {
  if (code === undefined || code === null) return null;
  if (code >= 11 && code <= 13) return "urban";
  if (code >= 21 && code <= 23) return "suburban";
  if (code >= 31 && code <= 33) return "suburban"; // town → suburban
  if (code >= 41 && code <= 43) return "rural";
  return null;
}

function ownershipToType(code: number | undefined): "public" | "private_nonprofit" | "private_forprofit" | null {
  switch (code) {
    case 1: return "public";
    case 2: return "private_nonprofit";
    case 3: return "private_forprofit";
    default: return null;
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchById(id: number, apiKey: string): Promise<ScorecardSchool | null> {
  const params = new URLSearchParams({ api_key: apiKey, id: String(id), fields: FIELDS });
  const url = `${API_BASE}?${params.toString()}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url);
    if (res.ok) {
      const json = (await res.json()) as ScorecardResponse;
      return json.results[0] ?? null;
    }
    if (res.status >= 500) {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      continue;
    }
    console.warn(`  [id ${id}] HTTP ${res.status}`);
    return null;
  }
  return null;
}

async function searchSchool(name: string, apiKey: string): Promise<ScorecardSchool | null> {
  // Scorecard's `school.name` filter does a substring match. We submit the
  // raw name, fetch 20 candidates, then rank: exact case-insensitive match
  // first, then candidates whose name starts with the input, then those
  // containing the input as a whole word. This avoids the trap where a
  // raw substring search returns a noisy sibling ("University of Maryland"
  // → "Loyola University Maryland") simply because the substring hit fires.
  const params = new URLSearchParams({
    api_key: apiKey,
    "school.name": name,
    fields: FIELDS,
    per_page: "20",
  });
  const url = `${API_BASE}?${params.toString()}`;
  let json: ScorecardResponse | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url);
    if (res.ok) {
      json = (await res.json()) as ScorecardResponse;
      break;
    }
    if (res.status >= 500) {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      continue;
    }
    console.warn(`  [${name}] HTTP ${res.status}`);
    return null;
  }
  if (!json || !json.results.length) return null;

  const target = name.toLowerCase().trim();
  // Tier 1: exact match.
  const exact = json.results.find((r) => r["school.name"].toLowerCase().trim() === target);
  if (exact) return exact;
  // Tier 2: starts with our name. Filters "University of Maryland" → "University of Maryland, College Park" while rejecting "Loyola University Maryland".
  const startsWith = json.results.filter((r) =>
    r["school.name"].toLowerCase().trim().startsWith(target)
  );
  if (startsWith.length) {
    // Prefer the largest by enrolment (main campus over satellite).
    startsWith.sort(
      (a, b) =>
        (b["latest.student.size"] ?? 0) - (a["latest.student.size"] ?? 0)
    );
    return startsWith[0];
  }
  // Tier 3: contains the input as a whole word. Same enrolment-size sort.
  const wordRe = new RegExp(`\\b${target.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i");
  const wholeWord = json.results.filter((r) => wordRe.test(r["school.name"]));
  if (wholeWord.length) {
    wholeWord.sort(
      (a, b) =>
        (b["latest.student.size"] ?? 0) - (a["latest.student.size"] ?? 0)
    );
    return wholeWord[0];
  }
  // No defensible match — return null so the row lands in misses for review.
  return null;
}

async function main() {
  const apiKey = process.env.API_DATA_GOV_KEY;
  if (!apiKey) {
    console.error("Set API_DATA_GOV_KEY env var (DEMO_KEY works for low-volume runs).");
    process.exit(1);
  }

  const root = path.resolve(__dirname);
  const catalog: string[] = JSON.parse(
    await fs.readFile(path.join(root, "usa-catalog.json"), "utf-8")
  );
  const overridesRaw = JSON.parse(
    await fs.readFile(path.join(root, "usa-ipeds-overrides.json"), "utf-8")
  ) as Record<string, number | string>;
  const overrides: Record<string, number> = {};
  for (const [k, v] of Object.entries(overridesRaw)) {
    if (!k.startsWith("_") && typeof v === "number") overrides[k] = v;
  }
  console.log(
    `Fetching ${catalog.length} USA universities from Scorecard (${Object.keys(overrides).length} IPEDS overrides applied)...`
  );

  const out: Record<string, unknown> = {};
  const misses: { name: string; reason: string }[] = [];
  for (let i = 0; i < catalog.length; i++) {
    const name = catalog[i];
    try {
      const overrideId = overrides[name];
      const hit = overrideId
        ? await fetchById(overrideId, apiKey)
        : await searchSchool(name, apiKey);
      if (!hit) {
        misses.push({ name, reason: "no Scorecard results" });
        console.log(`  [${i + 1}/${catalog.length}] ${name} → MISS`);
        continue;
      }
      const acceptRaw = hit["latest.admissions.admission_rate.overall"];
      const accept = acceptRaw != null ? Math.round(acceptRaw * 1000) / 10 : null; // 0.367 → 36.7
      const row = {
        id: slugify(name),
        name,
        country: "USA",
        scorecard_id: hit.id,
        scorecard_name: hit["school.name"],
        scorecard_city: hit["school.city"] ?? null,
        scorecard_state: hit["school.state"] ?? null,
        acceptance_rate: accept,
        median_earnings_6yr_usd: hit["latest.earnings.6_yrs_after_entry.median"] ?? null,
        median_earnings_10yr_usd: hit["latest.earnings.10_yrs_after_entry.median"] ?? null,
        school_type: ownershipToType(hit["school.ownership"]),
        setting: localeToSetting(hit["school.locale"]),
        enrollment_undergrad: hit["latest.student.enrollment.undergrad_12_month"] ?? hit["latest.student.size"] ?? null,
        data_source: "U.S. Department of Education College Scorecard (latest)",
        data_extracted_at: new Date().toISOString(),
      };
      out[name] = row;
      console.log(
        `  [${i + 1}/${catalog.length}] ${name} → ${hit["school.name"]} ` +
          `(accept ${accept ?? "—"}%, 6yr $${hit["latest.earnings.6_yrs_after_entry.median"] ?? "—"})`
      );
    } catch (err) {
      misses.push({ name, reason: (err as Error).message });
      console.warn(`  [${name}] error: ${(err as Error).message}`);
    }
    // Gentle rate-limit guard — 134 calls × 100ms = ~13s. Well under api.data.gov's
    // 1000/hour DEMO_KEY limit and harmless on a personal key.
    await new Promise((r) => setTimeout(r, 100));
  }

  await fs.writeFile(
    path.join(root, "scorecard-usa-results.json"),
    JSON.stringify(out, null, 2)
  );
  await fs.writeFile(
    path.join(root, "scorecard-usa-misses.json"),
    JSON.stringify(misses, null, 2)
  );
  console.log(
    `\nDone. ${Object.keys(out).length} hits, ${misses.length} misses. ` +
      `Results → scorecard-usa-results.json, misses → scorecard-usa-misses.json.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
