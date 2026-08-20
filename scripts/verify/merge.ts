/**
 * merge.ts
 *
 * Reads all verified JSON files from scripts/verify/output/ and appends them as
 * ProgramEntry objects to src/data/programs.ts (right before the closing `])`).
 *
 * Skips entries that already exist in programs.ts (matched by a 3-key
 * tuple — university_name + program_name + degree_level — all case-
 * insensitive after whitespace trim).
 *
 * History (14 May 2026):
 *
 * Previous (uni + program_name) case-SENSITIVE key let "AI Track" vs
 * "AI track" duplicate through (real user report). Cleanup: 96 historical
 * duplicates removed by scripts/verify/dedupe-programs.py.
 *
 * Briefly tried tighter 4-key (adding field_of_study) and 5-key (adding
 * specialization) but both produced false-positive re-inserts on re-
 * verification: the verifier returns slightly different metadata on re-
 * runs (Brown's "MS in Computer Science" → spec "General CS" → "General";
 * Oregon State's "Architectural Engineering" → fos "Architecture" →
 * "Arts, Design & Architecture"). 250-300 false positives at 4-key, 367
 * at 5-key. The 3-key fold accepts a known trade-off: ~5 same-name-
 * different-faculty cases get incorrectly conflated (most notably
 * Universiti Putra Malaysia's "Master by Coursework" offered by both
 * Science and Business faculties — same name, distinct programs). Of
 * those 5 cases in the current DB, 4 look like field-tagging artefacts
 * (CS vs AI&DS at the same uni) and only Putra is unambiguous. The
 * scripts/verify/dedupe-programs.py safety net catches anything that
 * slips through; re-run it periodically.
 *
 * Idempotency fix (14 Jul 2026): the key extractor used `"([^"]*)"`, which
 * truncated at an escaped quote — 8 entries (Sciences Po BASC, IMT
 * Atlantique, Kiel, Halle-Wittenberg, Augsburg, Nantes) therefore keyed on a
 * prefix and re-inserted on every run. Key logic now lives in merge-keys.ts
 * with regression tests in tests/merge-keys.test.ts.
 *
 * Usage: npx tsx scripts/verify/merge.ts
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { buildExistingKeys, makeKey } from "./merge-keys";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "output");
const PROGRAMS_PATH = join(__dirname, "..", "..", "src", "data", "programs.ts");

const files = readdirSync(OUT_DIR).filter((f) => f.endsWith(".json"));
console.log(`Found ${files.length} verified outputs.`);

let programsTs = readFileSync(PROGRAMS_PATH, "utf8");
const closeIdx = programsTs.lastIndexOf("]) as ProgramEntry[]");
if (closeIdx === -1) {
  console.error("Could not find closing bracket in programs.ts");
  process.exit(1);
}

// Existing-key set (see merge-keys.ts). The escape-aware extractor there
// fixed the idempotency bug where 8 entries carrying \" in program_name
// re-inserted on every run. (14 Jul 2026)
const existing = buildExistingKeys(programsTs);

// Only these 12 countries are in scope. Programs from any other country (e.g.
// ETH Zurich → Switzerland) must NOT be merged regardless of how they ended
// up in /output/, otherwise the homepage country count drifts away from 12.
const TARGET_COUNTRIES = new Set([
  "USA", "UK", "Australia", "Canada", "New Zealand", "Ireland",
  "Germany", "France", "UAE", "Singapore", "Malaysia", "Netherlands",
]);

const toInsert: string[] = [];
let skipped = 0;
let outOfScope = 0;
for (const f of files) {
  const v = JSON.parse(readFileSync(join(OUT_DIR, f), "utf8"));
  if (!TARGET_COUNTRIES.has(v.country)) { outOfScope++; continue; }
  const key = makeKey(v.university_name, v.program_name, v.degree_level);
  if (existing.has(key)) { skipped++; continue; }

  const block = `  {
    university_name: ${JSON.stringify(v.university_name)},
    country: ${JSON.stringify(v.country)}, city: ${JSON.stringify(v.city)}, qs_ranking: ${v.qs_ranking ?? "null"},
    program_name: ${JSON.stringify(v.program_name)}, degree_level: ${JSON.stringify(v.degree_level)},
    duration_months: ${v.duration_months ?? "null"}, field_of_study: ${JSON.stringify(v.field_of_study)}, specialization: ${JSON.stringify(v.specialization ?? "General")},
    annual_tuition_usd: ${v.annual_tuition_usd ?? "null"}, annual_tuition_amount: ${v.annual_tuition_amount ?? "null"}, annual_tuition_currency: ${v.annual_tuition_currency ? JSON.stringify(v.annual_tuition_currency) : "null"},
    avg_living_cost_usd: ${v.avg_living_cost_usd ?? "null"}, avg_living_cost_amount: ${v.avg_living_cost_amount ?? "null"}, avg_living_cost_currency: ${v.avg_living_cost_currency ? JSON.stringify(v.avg_living_cost_currency) : "null"},
    intake_semesters: ${JSON.stringify(v.intake_semesters)}, application_deadline: ${JSON.stringify(v.application_deadline)},
    min_gpa: ${v.min_gpa ?? "null"}, min_percentage: ${v.min_percentage ?? "null"}, min_ielts: ${v.min_ielts ?? "null"}, min_toefl: ${v.min_toefl ?? "null"}, min_pte: ${v.min_pte ?? "null"}, min_duolingo: ${v.min_duolingo ?? "null"},
    min_gre: ${v.min_gre ?? "null"}, min_gmat: ${v.min_gmat ?? "null"}, min_sat: ${v.min_sat ?? "null"}, work_exp_required_years: ${v.work_exp_required_years ?? "null"},
    program_url: ${JSON.stringify(v.program_url)},
    apply_url: ${JSON.stringify(v.apply_url)},
    verified_at: ${JSON.stringify(v.verified_at)}, verification_source_url: ${JSON.stringify(v.verification_source_url)},
  },
`;
  toInsert.push(block);
}

if (toInsert.length === 0) {
  console.log(`Nothing to insert. Skipped ${skipped} duplicates.`);
  process.exit(0);
}

// Ensure the last existing entry ends with a comma so we can safely append.
let before = programsTs.slice(0, closeIdx).replace(/\s*$/, "");
if (!before.endsWith(",")) before += ",";
const after = programsTs.slice(closeIdx);
const merged = before + "\n\n  // ─── Verified additions (auto-merged) ──────────────\n" + toInsert.join("") + after;
writeFileSync(PROGRAMS_PATH, merged);
console.log(`Inserted ${toInsert.length} verified programs. Skipped ${skipped} duplicates, ${outOfScope} out-of-scope countries.`);

// Auto-run reclassify-cs-streams.py so newly merged rows get classified
// into the 4-way CS / AI / Data Science / Cybersecurity split. Failure
// is non-fatal — merge already succeeded; the user can re-run the
// classifier manually if needed. (Handoff #17 item #22 closed 15 May 2026.)
try {
  const r = spawnSync("python3", [join(__dirname, "reclassify-cs-streams.py")], {
    stdio: "inherit",
  });
  if (r.status !== 0) {
    console.warn(`[merge] reclassify-cs-streams.py exited with code ${r.status} — re-run manually if needed.`);
  }
} catch (e) {
  console.warn(`[merge] could not auto-run reclassify-cs-streams.py:`, e);
}
