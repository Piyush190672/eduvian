// Stage 2 merge: read scorecard-usa-results.json and rewrite
// src/data/universities.ts to contain one University row per
// canonical USA university, sorted alphabetically.
//
// Kept separate from fetch-scorecard-usa.ts so the API spend (zero) and
// the file rewrite are reviewable independently — same pattern as the
// existing verify pipeline (verify-batch.ts → merge.ts).

import * as fs from "node:fs/promises";
import * as path from "node:path";

interface RowOnDisk {
  id: string;
  name: string;
  country: string;
  scorecard_id?: number;
  scorecard_name?: string;
  scorecard_city?: string | null;
  scorecard_state?: string | null;
  acceptance_rate: number | null;
  median_earnings_6yr_usd: number | null;
  median_earnings_10yr_usd: number | null;
  school_type: string | null;
  setting: string | null;
  enrollment_undergrad: number | null;
  data_source: string;
  data_extracted_at: string;
}

function formatField<T>(key: string, val: T | null | undefined): string {
  if (val === null || val === undefined) return `    ${key}: null,`;
  if (typeof val === "string") return `    ${key}: ${JSON.stringify(val)},`;
  return `    ${key}: ${val as unknown as string},`;
}

function emitEntry(r: RowOnDisk): string {
  const lines = [
    "  {",
    formatField("id", r.id),
    formatField("name", r.name),
    formatField("country", r.country),
    formatField("acceptance_rate", r.acceptance_rate),
    formatField("median_earnings_6yr_usd", r.median_earnings_6yr_usd),
    formatField("median_earnings_10yr_usd", r.median_earnings_10yr_usd),
    formatField("school_type", r.school_type),
    formatField("setting", r.setting),
    formatField("enrollment_undergrad", r.enrollment_undergrad),
    formatField("data_source", r.data_source),
    formatField("data_extracted_at", r.data_extracted_at),
    "  },",
  ];
  return lines.join("\n");
}

async function main() {
  const root = path.resolve(__dirname);
  const resultsPath = path.join(root, "scorecard-usa-results.json");
  const targetPath = path.resolve(__dirname, "..", "..", "src", "data", "universities.ts");

  const raw = JSON.parse(await fs.readFile(resultsPath, "utf-8")) as Record<string, RowOnDisk>;
  const rows = Object.values(raw).sort((a, b) => a.name.localeCompare(b.name));

  const fileBody =
    `// University-level sidecar table.
//
// Stays SEPARATE from programs.ts on purpose: every Program has the same
// Cornell acceptance rate, the same Yale median earnings, the same MIT
// setting — denormalising those fields onto each Program row would mean
// ~17 copies per university and a drift risk on every re-verify pass.
// One row per ~545 unique universities lives here instead.
//
// Stage 2 (14 May 2026): ${rows.length} USA universities backfilled from
// U.S. Department of Education College Scorecard public API. Future
// stages: HESA / Discover Uni for UK, QS profile + US News Global for
// non-US / non-UK.

import type { University } from "@/lib/types";

export const UNIVERSITIES: University[] = [
${rows.map(emitEntry).join("\n")}
];
`;
  await fs.writeFile(targetPath, fileBody);
  console.log(`Wrote ${rows.length} universities to ${targetPath}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
