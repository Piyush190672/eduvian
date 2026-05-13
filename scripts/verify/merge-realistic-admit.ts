/**
 * merge-realistic-admit.ts
 *
 * Reads the per-university audit JSON produced by
 * realistic-admit-extractor.ts and writes the realistic_min_* fields
 * onto every program at each top-100 university in src/data/programs.ts.
 *
 * One uni → many programs: e.g. MIT has ~30 programs in the DB; all of
 * them get MIT's realistic_min_gpa / realistic_min_gre / etc. applied.
 * Fields are written as new properties, not as a replacement for
 * min_*. The scoring layer chooses realistic_* over min_* when present.
 *
 * Idempotent: re-running overwrites any prior realistic_* with the new
 * audit's values; programs at non-top-100 unis are untouched.
 *
 * Usage:
 *   npx tsx scripts/verify/merge-realistic-admit.ts \
 *     --input scripts/verify/output/realistic-admit-top100.json
 */
import { readFileSync, writeFileSync } from "node:fs";

interface UniAudit {
  university: string;
  realistic_min_gpa: number | null;
  realistic_min_percentage: number | null;
  realistic_min_ielts: number | null;
  realistic_min_toefl: number | null;
  realistic_min_gre: number | null;
  realistic_min_gmat: number | null;
  realistic_min_sat: number | null;
  realistic_source: string | null;
  realistic_extracted_at: string;
}

const PROGRAMS_PATH = "src/data/programs.ts";
const argv = process.argv.slice(2);
const get = (k: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
const inPath = get("input");
if (!inPath) { console.error("Need --input <audit.json>"); process.exit(1); }

const audits: UniAudit[] = JSON.parse(readFileSync(inPath, "utf8"));
const byUni = new Map<string, UniAudit>(audits.map((a) => [a.university, a]));

const src = readFileSync(PROGRAMS_PATH, "utf8");

// Split into entries per `university_name:` anchor — same trick used by
// the earlier psych migration. The first chunk is the file header; the
// rest are one-per-program.
const chunks = src.split(/(?=university_name:)/);
const header = chunks.shift() ?? "";

let touched = 0;

// Build the realistic_* lines for one program, given the uni's audit.
function realisticBlock(a: UniAudit): string {
  const lines: string[] = [];
  const push = (k: string, v: number | null | string) => {
    if (v === null || v === undefined) lines.push(`    ${k}: null,`);
    else if (typeof v === "string") lines.push(`    ${k}: ${JSON.stringify(v)},`);
    else lines.push(`    ${k}: ${v},`);
  };
  push("realistic_min_gpa",        a.realistic_min_gpa);
  push("realistic_min_percentage", a.realistic_min_percentage);
  push("realistic_min_ielts",      a.realistic_min_ielts);
  push("realistic_min_toefl",      a.realistic_min_toefl);
  push("realistic_min_gre",        a.realistic_min_gre);
  push("realistic_min_gmat",       a.realistic_min_gmat);
  push("realistic_min_sat",        a.realistic_min_sat);
  push("realistic_source",         a.realistic_source);
  push("realistic_extracted_at",   a.realistic_extracted_at);
  return lines.join("\n") + "\n";
}

const REALISTIC_BLOCK_RE = /(?:\n\s*realistic_min_gpa:[\s\S]*?realistic_extracted_at:\s*"[^"]*",\n)/;

const rewritten = chunks.map((chunk) => {
  const m = chunk.match(/^university_name:\s*"([^"]+)"/);
  if (!m) return chunk;
  const uni = m[1];
  const audit = byUni.get(uni);
  if (!audit) return chunk; // not a top-100 uni

  // Strip any previously-injected realistic block (idempotent re-run).
  let next = chunk.replace(REALISTIC_BLOCK_RE, "\n");

  // Inject the new realistic block just after the program_url line —
  // a stable, late, every-entry anchor. Same insertion shape used by
  // the BPS migration.
  const block = realisticBlock(audit);
  const before = next;
  next = next.replace(
    /(program_url:\s*"[^"]*",\n)/,
    `$1${block}`,
  );
  if (next !== before) touched++;
  return next;
});

writeFileSync(PROGRAMS_PATH, header + rewritten.join(""));
console.log(`Wrote realistic_* fields to ${touched} program entries across ${byUni.size} universities.`);
