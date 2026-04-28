/**
 * repair-corruption.ts
 *
 * Parse src/data/programs.ts, identify each top-level object inside the
 * PROGRAMS array, validate it as a syntactically well-formed JS object
 * literal, and rewrite the file emitting only valid entries. Drops
 * corruption created by botched stamp/rename insertions in earlier
 * pipeline runs.
 *
 * Authenticity: this NEVER invents data. If an entry is invalid we drop it
 * cleanly. The corrupted entries listed below are saved to a separate file
 * for the audit trail.
 */
import { readFileSync, writeFileSync } from "node:fs";
import vm from "node:vm";

const PATH = "/Users/piyushkumar/Playground/eduvian/src/data/programs.ts";
const text = readFileSync(PATH, "utf8");

const arrOpen = text.indexOf("[", text.indexOf("PROGRAMS"));
const arrClose = text.lastIndexOf("]) as ProgramEntry[]");
if (arrOpen < 0 || arrClose < 0) { console.error("Could not locate PROGRAMS array"); process.exit(1); }

const header = text.slice(0, arrOpen + 1);
const trailer = text.slice(arrClose);

// Walk the array body, splitting into top-level objects (depth 1).
const body = text.slice(arrOpen + 1, arrClose);
const entries: { src: string; valid: boolean; reason?: string }[] = [];
let depth = 0, start = -1, inStr = false, esc = false;
const between: string[] = []; // comments/whitespace between entries
let lastEnd = 0;

for (let i = 0; i < body.length; i++) {
  const c = body[i];
  if (esc) { esc = false; continue; }
  if (c === "\\") { esc = true; continue; }
  if (c === '"') { inStr = !inStr; continue; }
  if (inStr) continue;
  if (c === "{") {
    if (depth === 0) {
      between.push(body.slice(lastEnd, i));
      start = i;
    }
    depth++;
  } else if (c === "}") {
    depth--;
    if (depth === 0 && start !== -1) {
      const src = body.slice(start, i + 1);
      // Validate by attempting to evaluate as JS object literal in a sandbox.
      let valid = false; let reason: string | undefined;
      try {
        // Wrap in `(...)` so it's an expression
        const ctx: Record<string, unknown> = {};
        vm.runInNewContext(`__obj = ${src}`, ctx, { timeout: 100 });
        const obj = ctx.__obj as Record<string, unknown>;
        if (obj && typeof obj === "object" && obj.university_name && obj.program_name && obj.program_url) {
          valid = true;
        } else { reason = "missing required fields"; }
      } catch (e) { reason = `parse error: ${(e as Error).message.slice(0, 80)}`; }
      entries.push({ src, valid, reason });
      lastEnd = i + 1;
      start = -1;
    }
  }
}
const tail = body.slice(lastEnd);

const valid = entries.filter((e) => e.valid);
const dropped = entries.filter((e) => !e.valid);

console.log(`Total entries: ${entries.length}`);
console.log(`Valid:         ${valid.length}`);
console.log(`Dropped:       ${dropped.length}`);

// Sample dropped entries
for (const d of dropped.slice(0, 5)) {
  console.log(`  drop reason: ${d.reason}`);
  console.log(`  preview: ${d.src.slice(0, 120)}...`);
}

// Save dropped for audit trail
const droppedReport = dropped.map((d, i) => ({ idx: i, reason: d.reason, src: d.src.slice(0, 600) }));
writeFileSync("/Users/piyushkumar/Playground/eduvian/scripts/verify/corruption-dropped.json", JSON.stringify(droppedReport, null, 2));

// Reassemble: header + (between[0] + entry[0] + between[1] + entry[1] + ...) + tail + trailer
let body2 = "";
let bi = 0;
for (const e of valid) {
  body2 += between[bi] ?? "";
  bi++;
  body2 += e.src;
  body2 += ",";
}
// Skip between segments for dropped entries (already deeper than bi)
// Actually we need to skip between segments that belonged to dropped entries.
// Simpler approach: rebuild between with valid-only filter — but order needs care.
// Reset & rebuild:
body2 = "";
bi = 0;
for (let k = 0; k < entries.length; k++) {
  const e = entries[k];
  if (e.valid) {
    body2 += between[k] ?? "";
    body2 += e.src + ",";
  }
  // else: skip both the between and the entry (the comment may belong to the next entry; risk minor: lose a header above a dropped entry)
}
body2 += "\n";

const out = header + body2 + trailer;
writeFileSync(PATH, out);
console.log(`\nWrote cleaned file: ${out.length} chars (was ${text.length}).`);
