// Merge Stage 4 country results (Canada, Australia, etc.) into the
// existing universities.ts. Mirrors merge-uk.ts. Idempotent — re-runs
// replace existing rows for each country in place. Detection key:
// row.country MATCHES the country of the result file.
//
// Usage:
//   npx tsx scripts/universities/merge-stage4.ts             # merges every stage4-results-*.json
//   npx tsx scripts/universities/merge-stage4.ts canada      # merges only one

import * as fs from "node:fs/promises";
import * as path from "node:path";

interface Stage4Row {
  id: string;
  name: string;
  country: string;
  acceptance_rate: number | null;
  enrollment_undergrad: number | null;
  enrollment_total: number | null;
  graduate_outcome_salary_usd: number | null;
  graduate_outcome_employment_pct: number | null;
  student_staff_ratio: number | null;
  completion_rate_pct: number | null;
  school_type: "public" | "private" | null;
  data_source: string;
  data_extracted_at: string;
}

function formatField<T>(key: string, val: T | null | undefined): string {
  if (val === null || val === undefined) return `    ${key}: null,`;
  if (typeof val === "string") return `    ${key}: ${JSON.stringify(val)},`;
  if (typeof val === "boolean") return `    ${key}: ${val},`;
  return `    ${key}: ${val as unknown as string},`;
}

function emitEntry(r: Stage4Row): string {
  const lines = [
    "  {",
    formatField("id", r.id),
    formatField("name", r.name),
    formatField("country", r.country),
    formatField("acceptance_rate", r.acceptance_rate),
    formatField("median_earnings_6yr_usd", null),
    formatField("median_earnings_10yr_usd", null),
    formatField("school_type", r.school_type),
    formatField("setting", null),
    formatField("enrollment_undergrad", r.enrollment_undergrad),
    formatField("enrollment_total", r.enrollment_total),
    formatField("graduate_outcome_salary_usd", r.graduate_outcome_salary_usd),
    formatField("graduate_outcome_employment_pct", r.graduate_outcome_employment_pct),
    formatField("ukprn", null),
    formatField("student_staff_ratio", r.student_staff_ratio),
    formatField("nss_satisfaction_pct", null),
    formatField("tef_rating", null),
    formatField("russell_group", null),
    formatField("completion_rate_pct", r.completion_rate_pct),
    formatField("data_source", r.data_source),
    formatField("data_extracted_at", r.data_extracted_at),
    "  },",
  ];
  return lines.join("\n");
}

async function main() {
  const onlyArg = process.argv[2]?.toLowerCase();
  const root = path.resolve(__dirname);
  const targetPath = path.resolve(__dirname, "..", "..", "src", "data", "universities.ts");

  // Discover stage4-results-*.json files
  const files = (await fs.readdir(root))
    .filter((f) => f.startsWith("stage4-results-") && f.endsWith(".json"))
    .filter((f) => !onlyArg || f.includes(onlyArg));

  if (files.length === 0) {
    console.log(`No stage4-results-*.json files found${onlyArg ? ` matching "${onlyArg}"` : ""}.`);
    return;
  }

  const allRows: Stage4Row[] = [];
  const countriesInThisRun = new Set<string>();
  for (const f of files) {
    const raw = JSON.parse(await fs.readFile(path.join(root, f), "utf-8")) as Record<string, Stage4Row>;
    for (const r of Object.values(raw)) {
      allRows.push(r);
      countriesInThisRun.add(r.country);
    }
    console.log(`Loaded ${Object.keys(raw).length} rows from ${f}`);
  }
  allRows.sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));

  const text = await fs.readFile(targetPath, "utf-8");
  const arrayDeclIdx = text.indexOf("UNIVERSITIES: University[] = [");
  if (arrayDeclIdx < 0) throw new Error("couldn't locate UNIVERSITIES declaration");
  const arrayContent = text.indexOf("= [", arrayDeclIdx) + 2;
  const arrayClose = text.lastIndexOf("];");
  const header = text.slice(0, arrayContent + 1);
  const footer = text.slice(arrayClose);
  const body = text.slice(arrayContent + 1, arrayClose);

  // Brace-parse existing entries
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
      else if (c === "}") { depth--; if (depth === 0) { i++; break; } }
      i++;
    }
    entries.push(body.slice(start, i));
  }
  console.log(`Existing entries in universities.ts: ${entries.length}`);

  // Drop entries for countries we're re-merging (idempotency)
  const countryPattern = new RegExp(
    `country:\\s*"(${[...countriesInThisRun].map((c) => c.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")).join("|")})"`,
  );
  const kept = entries.filter((e) => !countryPattern.test(e));
  const dropped = entries.length - kept.length;
  console.log(`Dropped ${dropped} existing rows for countries ${[...countriesInThisRun].join(", ")}; ${kept.length} kept.`);

  const normalise = (e: string) => (e.trimEnd().endsWith(",") ? e : e.trimEnd() + ",");
  const allEntries: string[] = [
    ...kept.map(normalise),
    ...allRows.map(emitEntry),
  ];

  const newBody = "\n" + allEntries.map((e) => e.replace(/^\s*/, "  ")).join("\n") + "\n";
  await fs.writeFile(targetPath, header + newBody + footer);

  console.log(`Wrote ${targetPath} — ${kept.length} kept + ${allRows.length} merged = ${kept.length + allRows.length} total.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
