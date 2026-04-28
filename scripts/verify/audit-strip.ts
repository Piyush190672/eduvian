/**
 * audit-strip.ts
 *
 * Reads scripts/verify/reverify-report.jsonl and removes from src/data/programs.ts
 * every entry whose re-verification reason is one of the strip-eligible categories
 * (default: field_mismatch, no_program_name).
 *
 * Fetch/API errors are retained — they may be transient.
 *
 * Usage: npx tsx scripts/verify/audit-strip.ts [--dry-run] [--include fetch_or_api_error]
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = join(__dirname, "reverify-report.jsonl");
const PROGRAMS_PATH = join(__dirname, "..", "..", "src", "data", "programs.ts");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const includeIdx = args.indexOf("--include");
const extraReasons = includeIdx >= 0 ? args.slice(includeIdx + 1).filter((a) => !a.startsWith("--")) : [];

// Default: strip only entries with confirmed-dead URLs (no extractable program name).
// field_mismatch is downgraded to "needs human review" — too many false positives
// from department landing pages. Pass --include field_mismatch to strip those too.
const STRIP_REASONS = new Set(["no_program_name", ...extraReasons]);

if (!existsSync(REPORT_PATH)) {
  console.error("No reverify report found. Run re-verify.ts first."); process.exit(1);
}
const lines = readFileSync(REPORT_PATH, "utf8").trim().split("\n").filter(Boolean);
const stripKeys = new Set<string>();
for (const ln of lines) {
  const r = JSON.parse(ln);
  if (STRIP_REASONS.has(r.reason)) {
    stripKeys.add(`${r.university}|${r.program}`);
  }
}
console.log(`Will strip ${stripKeys.size} entries (reasons: ${[...STRIP_REASONS].join(", ")})`);
if (stripKeys.size === 0) process.exit(0);

const text = readFileSync(PROGRAMS_PATH, "utf8");
let depth = 0, start = -1, inStr = false, esc = false;
const arrOpen = text.indexOf("[", text.indexOf("PROGRAMS"));
const ranges: [number, number, string][] = []; // [start, end, key]
for (let i = arrOpen + 1; i < text.length; i++) {
  const c = text[i];
  if (esc) { esc = false; continue; }
  if (c === "\\") { esc = true; continue; }
  if (c === '"') { inStr = !inStr; continue; }
  if (inStr) continue;
  if (c === "{") { if (depth === 0) start = i; depth++; }
  else if (c === "}") {
    depth--;
    if (depth === 0 && start !== -1) {
      let end = i + 1;
      // include trailing comma + whitespace
      while (end < text.length && (text[end] === "," || text[end] === " ")) end++;
      if (text[end] === "\n") end++;
      const block = text.slice(start, end);
      const u = block.match(/university_name:\s*"([^"]+)"/)?.[1];
      const p = block.match(/program_name:\s*"([^"]+)"/)?.[1];
      if (u && p) ranges.push([start, end, `${u}|${p}`]);
      start = -1;
    }
  }
}

const toStrip = ranges.filter((r) => stripKeys.has(r[2]));
console.log(`Located ${toStrip.length}/${stripKeys.size} target blocks in programs.ts`);
if (dryRun) {
  for (const r of toStrip.slice(0, 10)) console.log(`  ${r[2]}`);
  if (toStrip.length > 10) console.log(`  ... and ${toStrip.length - 10} more`);
  process.exit(0);
}

// Apply removals from end to start so offsets stay valid
toStrip.sort((a, b) => b[0] - a[0]);
let out = text;
for (const [s, e] of toStrip) out = out.slice(0, s) + out.slice(e);
writeFileSync(PROGRAMS_PATH, out);
console.log(`Removed ${toStrip.length} entries.`);
