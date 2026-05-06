/**
 * retag-architecture.ts
 *
 * Phase 1 of the Architecture stream split (6 May 2026).
 *
 * Reclassify programs whose program_name or specialization clearly identifies
 * them as Architecture but whose field_of_study is still the legacy compound
 * "Arts, Design & Architecture". Flip those entries to the new dedicated
 * "Architecture" field of study so the post-`5a4fff7f` stream picker has
 * inventory backing it on day one.
 *
 * Authenticity: never invents data. Only flips the field_of_study string when
 * the program_name OR specialization contains "architect" (case-insensitive)
 * AND the current field_of_study is the legacy compound. Programs that are
 * borderline (e.g., Interior Architecture, Landscape Architecture) are
 * included — they are architecture-adjacent and the new stream's RELATED_FIELDS
 * already pulls in Engineering + the legacy compound, so cross-matches work.
 *
 * Pattern: brace walker that tracks strings (per CLAUDE.md hard rule #5).
 *
 * Usage:
 *   npx tsx scripts/verify/retag-architecture.ts            # dry run
 *   npx tsx scripts/verify/retag-architecture.ts --apply    # actually write
 */
import { readFileSync, writeFileSync } from "node:fs";

const PATH = "/Users/piyushkumar/Playground/eduvian/src/data/programs.ts";
const APPLY = process.argv.includes("--apply");

const text = readFileSync(PATH, "utf8");
const arrOpen = text.indexOf("[", text.indexOf("PROGRAMS"));
const arrClose = text.lastIndexOf("]) as ProgramEntry[]");
if (arrOpen < 0 || arrClose < 0) { console.error("Could not locate PROGRAMS array"); process.exit(1); }

const header = text.slice(0, arrOpen + 1);
const trailer = text.slice(arrClose);
const body = text.slice(arrOpen + 1, arrClose);

// Brace walker that tracks string state. Splits the body into top-level
// entries (depth-1 objects) plus the whitespace/commas between them.
type Entry = { src: string; preBetween: string };
const entries: Entry[] = [];
let depth = 0, start = -1, inStr = false, esc = false;
let lastEnd = 0;
for (let i = 0; i < body.length; i++) {
  const c = body[i];
  if (esc) { esc = false; continue; }
  if (c === "\\") { esc = true; continue; }
  if (c === '"') { inStr = !inStr; continue; }
  if (inStr) continue;
  if (c === "{") {
    if (depth === 0) start = i;
    depth++;
  } else if (c === "}") {
    depth--;
    if (depth === 0 && start !== -1) {
      const preBetween = body.slice(lastEnd, start);
      const src = body.slice(start, i + 1);
      entries.push({ src, preBetween });
      lastEnd = i + 1;
      start = -1;
    }
  }
}
const tail = body.slice(lastEnd);

const ARCHITECT_RE = /[Aa]rchitect/;
const LEGACY_TAG = `field_of_study: "Arts, Design & Architecture"`;
const NEW_TAG = `field_of_study: "Architecture"`;

let retagged = 0;
let alreadyArchitecture = 0;
let unchanged = 0;
const samples: string[] = [];

const out: Entry[] = entries.map((e) => {
  const programNameMatch = /program_name:\s*"([^"]*)"/.exec(e.src);
  const specializationMatch = /specialization:\s*"([^"]*)"/.exec(e.src);
  const pname = programNameMatch?.[1] ?? "";
  const spec = specializationMatch?.[1] ?? "";
  const looksLikeArchitecture = ARCHITECT_RE.test(pname) || ARCHITECT_RE.test(spec);

  if (!looksLikeArchitecture) { unchanged++; return e; }
  if (e.src.includes(NEW_TAG)) { alreadyArchitecture++; return e; }
  if (!e.src.includes(LEGACY_TAG)) { unchanged++; return e; }

  retagged++;
  if (samples.length < 5) {
    const uniMatch = /university_name:\s*"([^"]*)"/.exec(e.src);
    samples.push(`  - ${uniMatch?.[1] ?? "?"} — ${pname}`);
  }
  return { ...e, src: e.src.replace(LEGACY_TAG, NEW_TAG) };
});

console.log(`Total entries:                     ${entries.length}`);
console.log(`Re-tagged (legacy → Architecture): ${retagged}`);
console.log(`Already "Architecture":            ${alreadyArchitecture}`);
console.log(`Unchanged:                         ${unchanged}`);
console.log("\nFirst 5 re-tagged samples:");
samples.forEach((s) => console.log(s));

if (!APPLY) {
  console.log("\nDry run (no file written). Re-run with --apply to write.");
  process.exit(0);
}

let body2 = "";
for (const e of out) body2 += e.preBetween + e.src;
body2 += tail;
writeFileSync(PATH, header + body2 + trailer);
console.log(`\nWrote ${PATH}`);
