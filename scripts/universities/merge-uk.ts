// Merge UK universities from uk-results.json into the existing
// universities.ts (which already holds 218 USA rows from
// merge-scorecard-usa.ts). Appends UK rows preserving the USA ones.
//
// Idempotent — re-runs replace existing UK rows in place rather than
// appending duplicates. Detection key: row.country === "UK" AND
// row.id === slugify(uk_name).
//
// Usage:
//   npx tsx scripts/universities/merge-uk.ts

import * as fs from "node:fs/promises";
import * as path from "node:path";

interface UKRow {
  id: string;
  name: string;
  country: "UK";
  enrollment_undergrad: number | null;
  enrollment_total: number | null;
  graduate_outcome_salary_usd: number | null;
  graduate_outcome_employment_pct: number | null;
  ukprn: number | null;
  student_staff_ratio: number | null;
  nss_satisfaction_pct: number | null;
  tef_rating: string | null;
  russell_group: boolean | null;
  completion_rate_pct: number | null;
  data_source: string;
  data_extracted_at: string;
}

function formatField<T>(key: string, val: T | null | undefined): string {
  if (val === null || val === undefined) return `    ${key}: null,`;
  if (typeof val === "string") return `    ${key}: ${JSON.stringify(val)},`;
  if (typeof val === "boolean") return `    ${key}: ${val},`;
  return `    ${key}: ${val as unknown as string},`;
}

function emitEntry(r: UKRow): string {
  // Schema-uniform with USA rows: include all University interface
  // fields, set the ones not applicable to UK (acceptance_rate, US
  // earnings, school_type, setting) to null so the row shape stays
  // consistent for TypeScript and ComparePanel render.
  const lines = [
    "  {",
    formatField("id", r.id),
    formatField("name", r.name),
    formatField("country", r.country),
    formatField("acceptance_rate", null),
    formatField("median_earnings_6yr_usd", null),
    formatField("median_earnings_10yr_usd", null),
    formatField("school_type", null),
    formatField("setting", null),
    formatField("enrollment_undergrad", r.enrollment_undergrad),
    formatField("enrollment_total", r.enrollment_total),
    formatField("graduate_outcome_salary_usd", r.graduate_outcome_salary_usd),
    formatField("graduate_outcome_employment_pct", r.graduate_outcome_employment_pct),
    formatField("ukprn", r.ukprn),
    formatField("student_staff_ratio", r.student_staff_ratio),
    formatField("nss_satisfaction_pct", r.nss_satisfaction_pct),
    formatField("tef_rating", r.tef_rating),
    formatField("russell_group", r.russell_group),
    formatField("completion_rate_pct", r.completion_rate_pct),
    formatField("data_source", r.data_source),
    formatField("data_extracted_at", r.data_extracted_at),
    "  },",
  ];
  return lines.join("\n");
}

async function main() {
  const root = path.resolve(__dirname);
  const ukResultsPath = path.join(root, "uk-results.json");
  const targetPath = path.resolve(__dirname, "..", "..", "src", "data", "universities.ts");

  const rawObj = JSON.parse(await fs.readFile(ukResultsPath, "utf-8")) as Record<string, UKRow>;
  const rows = Object.values(rawObj).sort((a, b) => a.name.localeCompare(b.name));

  const text = await fs.readFile(targetPath, "utf-8");
  // Strip any existing UK rows. Each UK row has country: "UK" — we
  // can find them by a non-greedy `{ id: ... country: "UK" ... },\n`
  // match. For surgical safety, we walk entries via brace parser.
  // Locate the array opener `= [` (NOT the `[]` in the type annotation).
  const arrayDeclIdx = text.indexOf("UNIVERSITIES: University[] = [");
  if (arrayDeclIdx < 0) throw new Error("couldn't locate UNIVERSITIES declaration");
  const arrayContent = text.indexOf("= [", arrayDeclIdx) + 2; // position of the `[`
  const arrayClose = text.lastIndexOf("];");
  if (arrayContent <= 1 || arrayClose < 0) throw new Error("couldn't locate UNIVERSITIES array bounds");
  const header = text.slice(0, arrayContent + 1);
  const footer = text.slice(arrayClose);
  const body = text.slice(arrayContent + 1, arrayClose);

  // Brace parse to split into entries.
  const entries: string[] = [];
  let i = 0;
  const n = body.length;
  while (i < n) {
    while (i < n && (body[i] === " " || body[i] === "\t" || body[i] === "\n" || body[i] === ",")) i++;
    if (i >= n) break;
    if (body[i] === "/" && body[i + 1] === "/") {
      const nl = body.indexOf("\n", i);
      i = nl >= 0 ? nl + 1 : n;
      continue;
    }
    if (body[i] !== "{") throw new Error(`unexpected ${body[i]} at offset ${i}`);
    const start = i;
    let depth = 0;
    let inStr = false;
    while (i < n) {
      const c = body[i];
      if (inStr) {
        if (c === "\\") { i += 2; continue; }
        if (c === '"') inStr = false;
        i++;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) { i++; break; }
      }
      i++;
    }
    entries.push(body.slice(start, i));
  }
  console.log(`Existing entries in universities.ts: ${entries.length}`);

  // Remove any existing UK entries (idempotency).
  const nonUk = entries.filter((e) => !/country:\s*"UK"/.test(e));
  console.log(`Non-UK entries kept: ${nonUk.length}`);

  // Build new combined body: non-UK + UK rows.
  // Each entry from the brace-parser ends at `}` (no trailing comma).
  // emitEntry already produces `},` at the end. Normalise: ensure each
  // entry ends with `},` then join with `\n`.
  const normalise = (e: string) => (e.trimEnd().endsWith(",") ? e : e.trimEnd() + ",");
  const allEntries: string[] = [
    ...nonUk.map(normalise),
    ...rows.map((r) => emitEntry(r)),  // emitEntry already trailing-comma-correct
  ];

  // Re-render universities.ts: header + newline-separated entries + footer.
  // Each entry block (a multi-line `{ ... },`) is joined by a newline.
  const newBody = "\n" + allEntries.map((e) => e.replace(/^\s*/, "  ")).join("\n") + "\n";
  await fs.writeFile(targetPath, header + newBody + footer);

  const ukCount = rows.length;
  const usCount = nonUk.length;
  console.log(`Wrote ${targetPath} — ${usCount} non-UK + ${ukCount} UK = ${usCount + ukCount} total.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
