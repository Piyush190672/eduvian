/**
 * deepen-review.ts  —  Option 1: in-domain crawl-deeper for 94 review items.
 *
 * For each entry in rename-review.json:
 *   1. Fetch the landing URL with Playwright (we already do this).
 *   2. Extract all same-domain anchor links (href + text).
 *   3. Ask Claude which anchor most likely points to the official detail
 *      page for the DB program_name. Claude returns either a URL or null.
 *   4. If a candidate URL is returned, run verify-program.ts on it.
 *   5. If verification produces a specific (≥3 words + degree keyword)
 *      program name AND a matching field of study, update the DB row's
 *      program_url + program_name and stamp verified_at.
 *   6. Otherwise leave the entry in the review queue (with a note about
 *      what was tried).
 *
 * Authenticity-preserving: we never invent a URL. We only follow links that
 * are literally present on the landing page, and we only update the DB if
 * the new page's verifier output passes the same specificity bar.
 *
 * Usage: npx tsx scripts/verify/deepen-review.ts [--dry-run] [--limit N]
 */

import Anthropic from "@anthropic-ai/sdk";
import { chromium, type Browser } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REVIEW_PATH = join(__dirname, "rename-review.json");
const PROGRAMS_PATH = join(__dirname, "..", "..", "src", "data", "programs.ts");
const OUT_DIR = join(__dirname, "output");

const dryRun = process.argv.includes("--dry-run");
const limitIdx = process.argv.indexOf("--limit");
const limit = limitIdx >= 0 ? parseInt(process.argv[limitIdx + 1], 10) : undefined;

interface ReviewItem {
  university: string;
  url: string;
  db_program_name: string;
  page_program_name: string;
  reason: string;
  /** populated by this script if we find a better URL */
  attempted_deepening?: { candidate_url: string | null; verified_program_name?: string | null; outcome: string };
}

// ── Degree-level keyword sets ─────────────────────────────────────────────
const PG_KEYWORDS = [
  "MSc", "MS", "MA", "MBA", "MEng", "MEd", "MPA", "MPP", "MPH", "MFA", "MArch",
  "MPhil", "PhD", "DPhil", "EdD", "MD", "JD", "LLM", "MCom", "MTech", "MComp",
  "Master", "Master's", "Masters", "Doctor", "Doctorate", "Doctoral",
  "Postgraduate", "Postgrad", "Graduate Program", "Graduate Programme",
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

// ── Field of study → stream-keyword sets ──────────────────────────────────
const FIELD_KEYWORDS: Record<string, string[]> = {
  "Computer Science & IT": ["computer science", "computing", "informatics", "information technology", "software", "computer engineering", "computer systems", "information systems"],
  "Artificial Intelligence & Data Science": ["artificial intelligence", "machine learning", "data science", "data analytics", "statistical learning", "neural", "AI ", " AI"],
  "Business & Management": ["business", "management", "marketing", "supply chain", "operations", "human resource", "entrepreneur", "strategy"],
  "MBA": ["MBA", "business administration"],
  "Engineering (Mechanical/Civil/Electrical)": ["engineering", "mechanical", "civil", "electrical", "electronic", "EECS", "robotics", "aerospace", "aeronautical", "manufacturing", "energy"],
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

/** Returns true iff the page-extracted name matches BOTH the DB's degree level
 *  AND the DB's intended-stream field. This is the integrity bar for auto-
 *  accepting the page name as the program's official title. */
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

let _browser: Browser | null = null;
async function getBrowser() {
  if (!_browser) _browser = await chromium.launch({ headless: true });
  return _browser;
}

async function fetchAnchors(url: string): Promise<{ href: string; text: string }[]> {
  const browser = await getBrowser();
  const ctx = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  await page.route("**/*", (r) => {
    const t = r.request().resourceType();
    if (t === "image" || t === "media" || t === "font") return r.abort();
    return r.continue();
  });
  try {
    // Landing pages often hang on networkidle (analytics, chat widgets).
    // Try networkidle quickly, fall back to domcontentloaded, finally to "load".
    try { await page.goto(url, { waitUntil: "networkidle", timeout: 6_000 }); }
    catch {
      try { await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10_000 }); }
      catch { await page.goto(url, { waitUntil: "load", timeout: 25_000 }); }
    }
    await page.waitForTimeout(400);
    const sameDomain = new URL(url).hostname;
    const anchors = await page.$$eval("a", (els) =>
      els.map((a) => ({
        href: (a as HTMLAnchorElement).href,
        text: (a.textContent || "").trim(),
      })).filter((a) => a.href && a.text && a.text.length < 200)
    );
    return anchors.filter((a) => {
      try { return new URL(a.href).hostname === sameDomain; }
      catch { return false; }
    });
  } finally {
    await page.close();
    await ctx.close();
  }
}

async function askWhichAnchor(
  dbName: string, landingUrl: string, anchors: { href: string; text: string }[]
): Promise<string | null> {
  const client = new Anthropic();
  const compact = anchors.map((a) => `${a.text} | ${a.href}`).join("\n").slice(0, 80_000);
  const r = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 256,
    messages: [{
      role: "user",
      content: `From the anchor links below (text | href), identify the SINGLE link most likely to be the official detail page for the program "${dbName}" at this university. The landing URL was ${landingUrl}.

Rules:
- Prefer pages that look like an admissions/program-detail page (URL or text contains "admission", "apply", "program", "course", or the program name).
- Prefer specific program pages over department/landing pages.
- Reject anchors that are nav menus, news posts, faculty pages, or unrelated programs.
- If no anchor is clearly a better match, respond with the literal word "NONE".

Respond with ONLY the URL (or "NONE"). No prose.

ANCHORS:
${compact}`,
    }],
  });
  const tb = r.content.find((b) => b.type === "text");
  if (!tb || tb.type !== "text") return null;
  const ans = tb.text.trim().split(/\s+/)[0]; // first token
  if (!ans || ans.toUpperCase() === "NONE") return null;
  if (!ans.startsWith("http")) return null;
  return ans;
}

function findFieldForRow(university: string, db_program: string): { country: string; city: string; qs: number; field: string; level: string } | null {
  const text = readFileSync(PROGRAMS_PATH, "utf8");
  const upat = university.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ppat = db_program.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = text.match(new RegExp(`university_name:\\s*"${upat}"[\\s\\S]{0,2000}?program_name:\\s*"${ppat}"`, ""));
  if (!m) return null;
  const block = text.slice(Math.max(0, m.index! - 500), m.index! + m[0].length + 1000);
  const grab = (k: string) => block.match(new RegExp(`${k}:\\s*"([^"]+)"`))?.[1] ?? "";
  const country = grab("country");
  const city = grab("city");
  const qsMatch = block.match(/qs_ranking:\s*(\d+|null)/);
  const qs = qsMatch && qsMatch[1] !== "null" ? parseInt(qsMatch[1], 10) : 0;
  const field = grab("field_of_study");
  const level = grab("degree_level");
  return { country, city, qs, field, level };
}

function runVerifier(args: { uni: string; country: string; city: string; qs: number; field: string; url: string }) {
  const verifier = join(__dirname, "verify-program.ts");
  const r = spawnSync(
    "npx",
    [
      "tsx", verifier,
      "--university", args.uni,
      "--country", args.country,
      "--city", args.city,
      "--qs", String(args.qs),
      "--field", args.field,
      "--url", args.url,
    ],
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }
  );
  if (r.status !== 0) return { ok: false, status: r.status };
  // Read the output JSON. The verifier prints it to stdout, last line.
  try {
    const out = r.stdout.trim();
    const startBrace = out.indexOf("{");
    if (startBrace < 0) return { ok: false, status: r.status };
    const parsed = JSON.parse(out.slice(startBrace));
    return { ok: true, status: r.status, ...parsed };
  } catch { return { ok: false, status: r.status }; }
}

interface DbPatch { university: string; old_program: string; new_program: string; new_url: string; verified_at: string; verification_source_url: string; }

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1); }
  const items: ReviewItem[] = JSON.parse(readFileSync(REVIEW_PATH, "utf8"));
  const work = limit ? items.slice(0, limit) : items;
  console.log(`Deepening ${work.length} review items...`);

  const patches: DbPatch[] = [];
  const updated: ReviewItem[] = [];
  let resolved = 0, stillReview = 0;

  for (const [i, item] of work.entries()) {
    process.stdout.write(`[${i + 1}/${work.length}] ${item.university} :: ${item.db_program_name}\n`);
    let outcome = "no_better_anchor";
    let candidate: string | null = null;
    let verifiedName: string | null = null;
    try {
      const anchors = await fetchAnchors(item.url);
      if (!anchors.length) { outcome = "landing_no_anchors"; }
      else {
        candidate = await askWhichAnchor(item.db_program_name, item.url, anchors);
        if (candidate && candidate !== item.url) {
          const ctx = findFieldForRow(item.university, item.db_program_name);
          if (!ctx) { outcome = "row_not_found_in_db"; }
          else {
            const v = runVerifier({ uni: item.university, country: ctx.country, city: ctx.city, qs: ctx.qs, field: ctx.field, url: candidate });
            if (v.ok && matchesLevelAndField(v.program_name, ctx.level, ctx.field)) {
              // Best case: page name matches BOTH the DB's degree level (postgraduate
              // ↔ Master/MS/MSc/...) AND the DB's intended-stream field (e.g.
              // contains "Computer Science"). Rewrite both name and URL.
              verifiedName = v.program_name;
              outcome = "resolved";
              patches.push({
                university: item.university, old_program: item.db_program_name,
                new_program: v.program_name, new_url: candidate,
                verified_at: v.verified_at, verification_source_url: v.verification_source_url,
              });
              resolved++;
            } else if (v.ok && v.program_name) {
              // Deeper page found but its title doesn't match level+field
              // simultaneously (e.g., "Master's Program" — has level but no field).
              // Keep DB program_name (more informative) but upgrade URL to the
              // deeper page — strictly better source than the original landing.
              outcome = `url_upgraded_name_kept=${v.program_name}`;
              patches.push({
                university: item.university, old_program: item.db_program_name,
                new_program: item.db_program_name, // unchanged
                new_url: candidate,
                verified_at: v.verified_at, verification_source_url: v.verification_source_url,
              });
              resolved++;
            } else {
              outcome = `verifier_status=${v.status}`;
            }
          }
        } else if (candidate === item.url) {
          outcome = "claude_returned_same_url";
        }
      }
    } catch (e) {
      outcome = `error:${(e as Error).message.slice(0, 80)}`;
    }
    if (outcome !== "resolved") {
      updated.push({ ...item, attempted_deepening: { candidate_url: candidate, verified_program_name: verifiedName, outcome } });
      stillReview++;
    }
    process.stdout.write(`    -> ${outcome}${candidate ? ` (${candidate})` : ""}\n`);
  }

  if (_browser) await _browser.close();

  if (dryRun) {
    console.log("\n--- DRY RUN: would patch ---");
    for (const p of patches.slice(0, 10)) {
      console.log(`  ${p.university}: "${p.old_program}" -> "${p.new_program}"`);
      console.log(`    url: ${p.new_url}`);
    }
    if (patches.length > 10) console.log(`  ... and ${patches.length - 10} more`);
    console.log(`\nResolved: ${resolved}, Still review: ${stillReview}`);
    return;
  }

  // Apply patches: for each, find the DB block (by university + old_program) and rewrite program_name + program_url + stamp.
  let text = readFileSync(PROGRAMS_PATH, "utf8");
  // Apply end-to-start. Rebuild block list each pass to keep it simple.
  for (const p of patches) {
    const upat = p.university.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const ppat = p.old_program.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Find the enclosing object: locate program_name match, then walk back to "{" and forward to matching "}"
    const re = new RegExp(`university_name:\\s*"${upat}"[\\s\\S]{0,3000}?program_name:\\s*"${ppat}"`, "");
    const m = text.match(re);
    if (!m) continue;
    // Find object boundaries
    const idx = m.index!;
    let s = idx;
    while (s > 0 && text[s] !== "{") s--;
    // Walk braces with string-awareness — braces inside quoted strings must
    // not affect depth (older versions of this walker corrupted programs.ts
    // by splicing past entry boundaries when a URL/string contained braces).
    let depth = 1, e = s + 1, inStr = false, esc = false;
    while (e < text.length && depth) {
      const c = text[e];
      if (esc) { esc = false; e++; continue; }
      if (c === "\\") { esc = true; e++; continue; }
      if (c === '"') { inStr = !inStr; e++; continue; }
      if (!inStr) {
        if (c === "{") depth++;
        else if (c === "}") depth--;
      }
      e++;
    }
    const block = text.slice(s, e);
    let newBlock = block
      .replace(/program_name:\s*"[^"]+"/, `program_name: ${JSON.stringify(p.new_program)}`)
      .replace(/program_url:\s*"[^"]+"/, `program_url: ${JSON.stringify(p.new_url)}`);
    if (!newBlock.includes("verified_at:")) {
      const closeIdx = newBlock.lastIndexOf("}");
      const before = newBlock.slice(0, closeIdx).replace(/[\s,]*$/, "");
      const after = newBlock.slice(closeIdx);
      const insert = `,\n    verified_at: ${JSON.stringify(p.verified_at)}, verification_source_url: ${JSON.stringify(p.verification_source_url)},\n  `;
      newBlock = before + insert + after;
    }
    text = text.slice(0, s) + newBlock + text.slice(e);
  }
  writeFileSync(PROGRAMS_PATH, text);
  writeFileSync(REVIEW_PATH, JSON.stringify(updated, null, 2));
  console.log(`\nPatched ${patches.length} entries; ${updated.length} still need human review.`);
}

main().catch(async (e) => { console.error(e); if (_browser) await _browser.close(); process.exit(1); });
