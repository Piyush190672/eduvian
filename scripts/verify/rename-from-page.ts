/**
 * rename-from-page.ts  (Option C: hybrid auto-rewrite + human review)
 *
 * For each verified output JSON whose extracted program_name differs from the
 * stored DB row's program_name (matched by university_name + program_url):
 *
 *   • If the page name is "specific" (≥3 whitespace-delimited words AND
 *     contains a recognised degree-level keyword as a whole word), auto-
 *     rewrite the DB row's program_name to match the page AND stamp
 *     verified_at + verification_source_url.
 *
 *   • Otherwise, append the mismatch to scripts/verify/rename-review.json for
 *     human review. The DB is not modified for these cases.
 *
 * Rationale: the official page is the authoritative source for what the
 * university calls a program. But page text occasionally yields generic
 * titles ("Graduate Programs", "Computer Science") that would degrade the
 * UX if blindly applied — those need a human eye.
 *
 * Usage: npx tsx scripts/verify/rename-from-page.ts [--dry-run]
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "output");
const REVIEW_PATH = join(__dirname, "rename-review.json");
const PROGRAMS_PATH = join(__dirname, "..", "..", "src", "data", "programs.ts");

// ── Degree-level + field-keyword matching ──────────────────────────────────
// New bar (per user direction): page name passes auto-acceptance if it contains
// a degree-level keyword matching the DB row's level AND a field keyword
// matching the DB row's intended-stream field. Example: postgrad + "Computer
// Science & IT" → must contain "Master/MSc/MS/MA/MBA/..." AND "computer science
// /computing/informatics/...". This is more permissive than the prior strict
// ≥3-word rule and aligned with how universities actually title their programs.
const PG_KEYWORDS = [
  "MSc", "MS", "MA", "MBA", "MEng", "MEd", "MPA", "MPP", "MPH", "MFA", "MArch",
  "MPhil", "PhD", "DPhil", "EdD", "MD", "JD", "LLM", "MCom", "MTech", "MComp",
  "Master", "Master's", "Masters", "Doctor", "Doctorate", "Doctoral",
  "Postgraduate", "Postgrad",
];
const UG_KEYWORDS = [
  "BSc", "BS", "BA", "BEng", "BBA", "BFA", "BCom", "BTech", "LLB", "MBBS",
  "Bachelor", "Bachelors", "Bachelor's", "Undergraduate", "Undergrad",
];
function reFromKeywords(kws: string[]) {
  return new RegExp(`\\b(${kws.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "i");
}
const PG_RE = reFromKeywords(PG_KEYWORDS);
const UG_RE = reFromKeywords(UG_KEYWORDS);

const FIELD_KEYWORDS: Record<string, string[]> = {
  "Computer Science & IT": ["computer science", "computing", "informatics", "information technology", "software", "computer engineering", "computer systems", "information systems"],
  "Artificial Intelligence & Data Science": ["artificial intelligence", "machine learning", "data science", "data analytics", "statistical learning", "neural"],
  "Business & Management": ["business", "management", "marketing", "supply chain", "operations", "human resource", "entrepreneur", "strategy"],
  "MBA": ["MBA", "business administration"],
  "Engineering (Mechanical/Civil/Electrical)": ["engineering", "mechanical", "civil", "electrical", "electronic", "EECS", "robotics", "aerospace", "aeronautical", "manufacturing"],
  "Biotechnology & Life Sciences": ["biotechnology", "biotech", "life sciences", "biology", "biological", "bioscience", "biomedical", "biochemistry", "genetics", "molecular"],
  "Medicine & Public Health": ["medicine", "medical", "public health", "healthcare", "clinical", "pharmacy", "pharmaceutical", "epidemiology", "health science", "MBBS", "MD"],
  "Law": ["law", "legal", "jurisprudence", "LLM", "LLB", "JD", "juris doctor"],
  "Arts, Design & Architecture": ["art", "arts", "design", "architecture", "fine art", "MFA", "MArch", "creative"],
  "Social Sciences & Humanities": ["sociology", "anthropology", "philosophy", "history", "humanities", "political science", "international relations", "psychology", "linguistic"],
  "Economics & Finance": ["economics", "economic", "finance", "financial"],
  "Media & Communications": ["media", "communications", "journalism", "communication", "broadcasting"],
  "Environmental & Sustainability Studies": ["environmental", "sustainability", "climate", "ecology", "conservation"],
  "Natural Sciences": ["physics", "chemistry", "mathematics", "mathematic", "natural science", "earth science", "geology", "astronomy"],
  "Nursing & Allied Health": ["nursing", "allied health", "physiotherapy", "occupational therapy", "midwifery", "nutrition", "dietetics"],
  "Agriculture & Veterinary Sciences": ["agriculture", "agricultural", "veterinary", "food science", "horticulture", "animal science"],
  "Hospitality & Tourism": ["hospitality", "tourism", "hotel", "leisure", "event management"],
};

function matchesLevelAndField(name: string | null | undefined, level: string, field: string): boolean {
  if (!name) return false;
  // Normalize periods inside acronyms: "M.Sc" -> "MSc", "Ph.D." -> "PhD".
  const normalized = name.replace(/(\b[A-Z])\.(?=[A-Z])/g, "$1").replace(/\.(?=[a-z\s]|$)/g, "");
  const lvlRe = level === "postgraduate" ? PG_RE : level === "undergraduate" ? UG_RE : null;
  if (!lvlRe || !lvlRe.test(normalized)) return false;
  const fieldKws = FIELD_KEYWORDS[field];
  if (!fieldKws) return false;
  const lower = normalized.toLowerCase();
  return fieldKws.some((kw) => lower.includes(kw.toLowerCase().trim()));
}

interface VerifiedOut {
  university_name: string;
  program_name: string;
  program_url: string;
  verified_at: string;
  verification_source_url: string;
}

interface ReviewItem {
  university: string;
  url: string;
  db_program_name: string;
  page_program_name: string;
  reason: "page_name_too_generic" | "page_name_does_not_match_level_and_field";
}

const dryRun = process.argv.includes("--dry-run");

// Load all verified outputs
const outputs: VerifiedOut[] = [];
for (const f of readdirSync(OUT_DIR).filter((x) => x.endsWith(".json"))) {
  const v = JSON.parse(readFileSync(join(OUT_DIR, f), "utf8"));
  if (v.university_name && v.program_name && v.program_url && v.verified_at) {
    outputs.push(v);
  }
}
console.log(`Loaded ${outputs.length} verified outputs.`);

// Index by (university, program_url)
const byKey = new Map<string, VerifiedOut>();
for (const v of outputs) byKey.set(`${v.university_name}|${v.program_url}`, v);

// Walk programs.ts blocks
let text = readFileSync(PROGRAMS_PATH, "utf8");
const arrOpen = text.indexOf("[", text.indexOf("PROGRAMS"));
type Block = { start: number; end: number; uni: string; prog: string; url: string; level: string; field: string };
const blocks: Block[] = [];
let depth = 0, start = -1, inStr = false, esc = false;
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
      const block = text.slice(start, i + 1);
      const uni = block.match(/university_name:\s*"([^"]+)"/)?.[1] ?? "";
      const prog = block.match(/program_name:\s*"([^"]+)"/)?.[1] ?? "";
      const url = block.match(/program_url:\s*"([^"]+)"/)?.[1] ?? "";
      const level = block.match(/degree_level:\s*"([^"]+)"/)?.[1] ?? "";
      const field = block.match(/field_of_study:\s*"([^"]+)"/)?.[1] ?? "";
      if (uni && prog && url) blocks.push({ start, end: i + 1, uni, prog, url, level, field });
      start = -1;
    }
  }
}

// For each block, see if there's a verified output keyed on (uni, url) with a
// different program_name. If so, decide auto-rewrite vs. review.
const review: ReviewItem[] = [];
type Patch = { start: number; end: number; oldText: string; newText: string };
const patches: Patch[] = [];
let alreadyMatching = 0;

for (const b of blocks) {
  const v = byKey.get(`${b.uni}|${b.url}`);
  if (!v) continue;
  if (v.program_name === b.prog) {
    alreadyMatching++;
    continue;
  }
  // If the DB row is already stamped verified, no rename action needed —
  // the URL is verified and the DB name was deliberately preserved over a
  // generic page title (see stamp-landing-correct.ts).
  const dbBlock = text.slice(b.start, b.end);
  if (dbBlock.includes("verified_at:")) {
    alreadyMatching++;
    continue;
  }
  if (!matchesLevelAndField(v.program_name, b.level, b.field)) {
    review.push({
      university: b.uni, url: b.url,
      db_program_name: b.prog, page_program_name: v.program_name,
      reason: "page_name_does_not_match_level_and_field",
    });
    continue;
  }
  // Auto-rewrite: replace program_name and stamp verified_at + source.
  const block = text.slice(b.start, b.end);
  let newBlock = block.replace(
    /program_name:\s*"[^"]+"/,
    `program_name: ${JSON.stringify(v.program_name)}`
  );
  if (!newBlock.includes("verified_at:")) {
    const closeIdx = newBlock.lastIndexOf("}");
    const before = newBlock.slice(0, closeIdx).replace(/[\s,]*$/, "");
    const after = newBlock.slice(closeIdx);
    const insert = `,\n    verified_at: ${JSON.stringify(v.verified_at)}, verification_source_url: ${JSON.stringify(v.verification_source_url)},\n  `;
    newBlock = before + insert + after;
  }
  patches.push({ start: b.start, end: b.end, oldText: block, newText: newBlock });
}

console.log(`Already matching (skipped): ${alreadyMatching}`);
console.log(`Auto-rewrites: ${patches.length}`);
console.log(`Human review needed: ${review.length}`);

if (dryRun) {
  console.log("\n--- Sample auto-rewrites ---");
  for (const p of patches.slice(0, 5)) {
    const oldName = p.oldText.match(/program_name:\s*"([^"]+)"/)?.[1];
    const newName = p.newText.match(/program_name:\s*"([^"]+)"/)?.[1];
    console.log(`  "${oldName}" -> "${newName}"`);
  }
  console.log("\n--- Sample review items (page name too generic) ---");
  for (const r of review.slice(0, 5)) {
    console.log(`  ${r.university}`);
    console.log(`    DB:   "${r.db_program_name}"`);
    console.log(`    Page: "${r.page_program_name}"  [${r.url}]`);
  }
  process.exit(0);
}

// Apply patches end-to-start to keep offsets valid
patches.sort((a, b) => b.start - a.start);
for (const p of patches) text = text.slice(0, p.start) + p.newText + text.slice(p.end);
writeFileSync(PROGRAMS_PATH, text);
writeFileSync(REVIEW_PATH, JSON.stringify(review, null, 2));
console.log(`\nApplied ${patches.length} auto-rewrites + verified_at stamps.`);
console.log(`Wrote ${review.length} review items -> ${REVIEW_PATH}`);
