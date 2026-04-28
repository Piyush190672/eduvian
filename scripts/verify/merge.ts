/**
 * merge.ts
 *
 * Reads all verified JSON files from scripts/verify/output/ and appends them as
 * ProgramEntry objects to src/data/programs.ts (right before the closing `])`).
 *
 * Skips entries that already exist in programs.ts (matched by
 * university_name + program_name).
 *
 * Usage: npx tsx scripts/verify/merge.ts
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
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

const existing = new Set<string>();
const re = /university_name:\s*"([^"]+)"[\s\S]*?program_name:\s*"([^"]+)"/g;
let m;
while ((m = re.exec(programsTs)) !== null) {
  existing.add(`${m[1]}|${m[2]}`);
}

const toInsert: string[] = [];
let skipped = 0;
for (const f of files) {
  const v = JSON.parse(readFileSync(join(OUT_DIR, f), "utf8"));
  const key = `${v.university_name}|${v.program_name}`;
  if (existing.has(key)) { skipped++; continue; }

  const block = `  {
    university_name: ${JSON.stringify(v.university_name)},
    country: ${JSON.stringify(v.country)}, city: ${JSON.stringify(v.city)}, qs_ranking: ${v.qs_ranking ?? "null"},
    program_name: ${JSON.stringify(v.program_name)}, degree_level: ${JSON.stringify(v.degree_level)},
    duration_months: ${v.duration_months ?? "null"}, field_of_study: ${JSON.stringify(v.field_of_study)}, specialization: ${JSON.stringify(v.specialization ?? "General")},
    annual_tuition_usd: ${v.annual_tuition_usd ?? "null"}, avg_living_cost_usd: ${v.avg_living_cost_usd ?? "null"},
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
console.log(`Inserted ${toInsert.length} verified programs. Skipped ${skipped} duplicates.`);
