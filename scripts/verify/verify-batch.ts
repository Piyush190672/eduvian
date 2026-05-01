/**
 * verify-batch.ts
 *
 * Reads a seed JSON file and runs verify-program.ts for each entry. Supports
 * concurrent execution (--concurrency N) so a 450-entry batch completes in
 * ~25 min instead of ~3 hours.
 *
 * Concurrency safety: each child process has its own Playwright browser and
 * writes to a unique slug in scripts/verify/output/. No shared state.
 *
 * Seed file shape:
 *   [{ university, country, city, qs_ranking, field_of_study, program_url }]
 *
 * Usage:
 *   npx tsx scripts/verify/verify-batch.ts <seed.json> [--concurrency 5] [--skip-existing]
 *
 * --skip-existing: skips seeds whose (university, program_url) already
 *   produced an /output/ JSON in a prior run — useful for resuming after a kill.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { spawn } from "node:child_process";
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

const argv = process.argv.slice(2);
const seedPath = argv[0];
if (!seedPath) {
  console.error("Usage: verify-batch.ts <seed.json> [--concurrency N] [--skip-existing]");
  process.exit(1);
}
const cIdx = argv.indexOf("--concurrency");
const concurrency = cIdx >= 0 ? Math.max(1, parseInt(argv[cIdx + 1], 10) || 1) : 1;
const skipExisting = argv.includes("--skip-existing");

let seeds: SeedEntry[] = JSON.parse(readFileSync(seedPath, "utf8"));
console.log(`Loaded ${seeds.length} seed entries.`);

if (skipExisting) {
  // Build set of URLs already verified by reading /output/ JSONs
  const outDir = join(__dirname, "output");
  const verifiedUrls = new Set<string>();
  if (existsSync(outDir)) {
    for (const f of readdirSync(outDir)) {
      if (!f.endsWith(".json")) continue;
      try {
        const v = JSON.parse(readFileSync(join(outDir, f), "utf8"));
        if (v.program_url) verifiedUrls.add(v.program_url);
        if (v.verification_source_url) verifiedUrls.add(v.verification_source_url);
      } catch { /* ignore */ }
    }
  }
  const before = seeds.length;
  seeds = seeds.filter((s) => !verifiedUrls.has(s.program_url));
  console.log(`Skipping ${before - seeds.length} already-verified URLs; ${seeds.length} remaining.`);
}

console.log(`Concurrency: ${concurrency}`);
const verifier = join(__dirname, "verify-program.ts");
const stats = { ok: 0, rejected: 0, error: 0 };

function runOne(seed: SeedEntry): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(
      "npx",
      [
        "tsx", verifier,
        "--university", seed.university,
        "--country", seed.country,
        "--city", seed.city,
        "--qs", String(seed.qs_ranking),
        "--field", seed.field_of_study,
        "--url", seed.program_url,
      ],
      { stdio: ["ignore", "ignore", "ignore"] }
    );
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

let nextIdx = 0;
let done = 0;
async function worker() {
  while (true) {
    const i = nextIdx++;
    if (i >= seeds.length) return;
    const status = await runOne(seeds[i]);
    if (status === 0) stats.ok++;
    else if (status === 3 || status === 4) stats.rejected++;
    else stats.error++;
    done++;
    if (done % 10 === 0 || done === seeds.length) {
      process.stdout.write(`[${done}/${seeds.length}] ok=${stats.ok} rejected=${stats.rejected} err=${stats.error}\n`);
    }
  }
}

async function main() {
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  console.log(`\n──────────────────────────────────`);
  console.log(`OK:       ${stats.ok}`);
  console.log(`Rejected: ${stats.rejected}`);
  console.log(`Error:    ${stats.error}`);
}
main();
