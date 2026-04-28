/**
 * stamp-landing-correct.ts  —  Option A finalizer.
 *
 * For review items where deepen-review concluded the LANDING URL is the
 * correct program page (outcomes: no_better_anchor, claude_returned_same_url),
 * stamp verified_at on the DB row without changing the DB program_name. The
 * URL was confirmed by the original verifier as a real program page in the
 * right field (`page_says_field_matches_intended: true`); only its title was
 * too generic to auto-rewrite.
 *
 * Removes successfully-stamped items from rename-review.json.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REVIEW_PATH = join(__dirname, "rename-review.json");
const OUT_DIR = join(__dirname, "output");
const PROGRAMS_PATH = join(__dirname, "..", "..", "src", "data", "programs.ts");

// Outcomes where the landing URL has been confirmed correct (no better page
// could be found by either in-domain crawl OR web search). For these the URL
// is verified; we simply preserve the DB program_name (more useful than the
// generic page title).
const ELIGIBLE = new Set([
  "no_better_anchor",
  "claude_returned_same_url",
  "websearch_returned_same_url",
]);

interface ReviewItem {
  university: string; url: string;
  db_program_name: string; page_program_name: string;
  reason?: string;
  attempted_deepening?: { candidate_url: string | null; verified_program_name?: string | null; outcome: string };
}

const review: ReviewItem[] = JSON.parse(readFileSync(REVIEW_PATH, "utf8"));
console.log(`Loaded ${review.length} review items.`);

// Index verified outputs by (uni, program_url)
const outputs = new Map<string, { verified_at: string; verification_source_url: string }>();
for (const f of readdirSync(OUT_DIR).filter((x) => x.endsWith(".json"))) {
  const v = JSON.parse(readFileSync(join(OUT_DIR, f), "utf8"));
  if (v.university_name && v.program_url && v.verified_at) {
    outputs.set(`${v.university_name}|${v.program_url}`, {
      verified_at: v.verified_at,
      verification_source_url: v.verification_source_url || v.program_url,
    });
  }
}

let text = readFileSync(PROGRAMS_PATH, "utf8");

const stamped: ReviewItem[] = [];
const remaining: ReviewItem[] = [];

for (const r of review) {
  // Match against either the deepen outcome OR the web-search outcome — both
  // can confirm the original URL as correct.
  const deepen = r.attempted_deepening?.outcome ?? "";
  // @ts-expect-error attempted_websearch added by investigate-gaps.ts
  const websearch = r.attempted_websearch?.outcome ?? "";
  if (!ELIGIBLE.has(deepen) && !ELIGIBLE.has(websearch)) { remaining.push(r); continue; }
  const v = outputs.get(`${r.university}|${r.url}`);
  if (!v) { remaining.push(r); continue; }
  const upat = r.university.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ppat = r.db_program_name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`university_name:\\s*"${upat}"[\\s\\S]{0,3000}?program_name:\\s*"${ppat}"`, "");
  const m = text.match(re);
  if (!m) { remaining.push(r); continue; }
  let s = m.index!;
  while (s > 0 && text[s] !== "{") s--;
  // String-aware walker (braces inside quoted strings must not affect depth).
  let depth = 1, e = s + 1, inStr = false, esc = false;
  while (e < text.length && depth) {
    const c = text[e];
    if (esc) { esc = false; e++; continue; }
    if (c === "\\") { esc = true; e++; continue; }
    if (c === '"') { inStr = !inStr; e++; continue; }
    if (!inStr) { if (c === "{") depth++; else if (c === "}") depth--; }
    e++;
  }
  const block = text.slice(s, e);
  if (block.includes("verified_at:")) { stamped.push(r); continue; } // already stamped
  const closeIdx = block.lastIndexOf("}");
  const before = block.slice(0, closeIdx).replace(/[\s,]*$/, "");
  const after = block.slice(closeIdx);
  const insert = `,\n    verified_at: ${JSON.stringify(v.verified_at)}, verification_source_url: ${JSON.stringify(v.verification_source_url)},\n  `;
  const newBlock = before + insert + after;
  text = text.slice(0, s) + newBlock + text.slice(e);
  stamped.push(r);
}

writeFileSync(PROGRAMS_PATH, text);
writeFileSync(REVIEW_PATH, JSON.stringify(remaining, null, 2));
console.log(`Stamped ${stamped.length} entries (URL confirmed correct, DB name preserved).`);
console.log(`Remaining in review: ${remaining.length}`);
