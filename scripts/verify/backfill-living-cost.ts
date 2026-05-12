/**
 * backfill-living-cost.ts — fill missing avg_living_cost_usd in programs.ts
 *
 * One-shot data fix. 62% of programs (4,957 of 8,007 on 12 May 2026) had
 * avg_living_cost_usd = 0 or null, which silently undercounted the total
 * annual cost the budget hard filter uses. This script substitutes the
 * country-level median computed from the rows that DO have a value.
 *
 * Country medians (from the existing populated rows on 12 May 2026):
 *   USA 18000 · UK 14000 · Canada 14000 · Germany 12000 · Australia 17000
 *   France 18000 · Malaysia 7000 · UAE 16000 · Netherlands 14000
 *   New Zealand 14000 · Ireland 16000 · Singapore 20000
 *
 * Rerunnable: rows that already carry a positive value are left alone.
 *
 * Usage:
 *   npx tsx scripts/verify/backfill-living-cost.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROGRAMS_PATH = join(__dirname, "..", "..", "src", "data", "programs.ts");

// Country → median annual living cost in USD. Computed from the existing
// non-zero / non-null values across all 8,007 programs on 12 May 2026.
const COUNTRY_LIVING_COST_USD: Record<string, number> = {
  USA: 18000,
  UK: 14000,
  Canada: 14000,
  Germany: 12000,
  Australia: 17000,
  France: 18000,
  Malaysia: 7000,
  UAE: 16000,
  Netherlands: 14000,
  "New Zealand": 14000,
  Ireland: 16000,
  Singapore: 20000,
};

function main() {
  const text = readFileSync(PROGRAMS_PATH, "utf8");

  // Iterate program blocks by balanced braces. Blocks are flat (no nested
  // objects), so simple { … } depth tracking is enough.
  let updated = 0;
  let skippedAlreadySet = 0;
  let skippedUnknownCountry = 0;
  let out = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] !== "{") {
      out += text[i];
      i++;
      continue;
    }
    // Find matching closing brace
    let depth = 0;
    let end = -1;
    for (let j = i; j < text.length; j++) {
      const c = text[j];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) { end = j; break; }
      }
    }
    if (end < 0) {
      // Unmatched — bail out, write the rest unchanged.
      out += text.slice(i);
      break;
    }
    const block = text.slice(i, end + 1);
    // Only treat as a program block if it has the marker field.
    if (!block.includes("program_name:")) {
      out += block;
      i = end + 1;
      continue;
    }
    const countryMatch = block.match(/country:\s*"([^"]+)"/);
    const livingMatch  = block.match(/avg_living_cost_usd:\s*([\d.]+|null)/);
    if (!countryMatch || !livingMatch) {
      out += block;
      i = end + 1;
      continue;
    }
    const country = countryMatch[1];
    const livingRaw = livingMatch[1];
    const livingNum = livingRaw === "null" ? 0 : parseFloat(livingRaw);
    if (livingNum > 0) {
      skippedAlreadySet++;
      out += block;
      i = end + 1;
      continue;
    }
    const fallback = COUNTRY_LIVING_COST_USD[country];
    if (typeof fallback !== "number") {
      skippedUnknownCountry++;
      console.warn(`[backfill-living-cost] No fallback for country: ${country}`);
      out += block;
      i = end + 1;
      continue;
    }
    const replaced = block.replace(
      /avg_living_cost_usd:\s*(?:[\d.]+|null)/,
      `avg_living_cost_usd: ${fallback}`,
    );
    out += replaced;
    updated++;
    i = end + 1;
  }

  writeFileSync(PROGRAMS_PATH, out);
  console.log(`Done.`);
  console.log(`  Updated:                ${updated}`);
  console.log(`  Skipped (already set):  ${skippedAlreadySet}`);
  console.log(`  Skipped (no country):   ${skippedUnknownCountry}`);
}

main();
