/**
 * verify-batch.ts
 *
 * Reads a seed JSON file and runs verify-program.ts for each entry. Logs
 * successes / rejections / errors. Outputs go into scripts/verify/output/.
 *
 * Seed file shape:
 *   [
 *     {
 *       "university": "University of Cambridge",
 *       "country": "UK",
 *       "city": "Cambridge",
 *       "qs_ranking": 5,
 *       "field_of_study": "Artificial Intelligence & Data Science",
 *       "program_url": "https://www.mlmi.eng.cam.ac.uk/"
 *     }
 *   ]
 *
 * Usage:
 *   npx tsx scripts/verify/verify-batch.ts scripts/verify/seeds/qs-2026-tier-1.json
 */

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface SeedEntry {
  university: string;
  country: string;
  city: string;
  qs_ranking: number;
  field_of_study: string;
  program_url: string;
}

const seedPath = process.argv[2];
if (!seedPath) {
  console.error("Usage: verify-batch.ts <seed.json>");
  process.exit(1);
}

const seeds: SeedEntry[] = JSON.parse(readFileSync(seedPath, "utf8"));
console.log(`Loaded ${seeds.length} seed entries from ${seedPath}`);

const verifier = join(__dirname, "verify-program.ts");
const results = { ok: 0, rejected: 0, error: 0 };

for (const [i, seed] of seeds.entries()) {
  console.log(`\n[${i + 1}/${seeds.length}] ${seed.university} — ${seed.field_of_study}`);
  const r = spawnSync(
    "npx",
    [
      "tsx",
      verifier,
      "--university", seed.university,
      "--country", seed.country,
      "--city", seed.city,
      "--qs", String(seed.qs_ranking),
      "--field", seed.field_of_study,
      "--url", seed.program_url,
    ],
    { stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" }
  );
  if (r.status === 0) results.ok++;
  else if (r.status === 3 || r.status === 4) results.rejected++;
  else results.error++;
}

console.log(`\n──────────────────────────────────`);
console.log(`OK:       ${results.ok}`);
console.log(`Rejected: ${results.rejected}  (page didn't match field or no program_name)`);
console.log(`Error:    ${results.error}     (HTTP/parse/api error)`);
