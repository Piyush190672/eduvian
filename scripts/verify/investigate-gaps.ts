/**
 * investigate-gaps.ts  —  Option C: web-search-backed URL discovery for the
 * residual review items the in-domain crawl-deeper couldn't resolve.
 *
 * For each item:
 *   1. Ask Claude (with web search) to find the OFFICIAL URL for the program
 *      "{db_program_name} at {university}".
 *   2. Run verify-program.ts on the discovered URL.
 *   3. Accept iff the page name matches DB level + field via
 *      matchesLevelAndField (same bar as elsewhere).
 *   4. If accepted: rewrite name + URL + stamp verified_at.
 *      If page name fails the bar but verifier exited 0: upgrade URL + stamp,
 *      keep DB name.
 *      Otherwise: leave in review with notes.
 *
 * Authenticity-preserving: web search returns URLs we never invent. The
 * verifier still extracts only fields literally on the page. Names auto-
 * applied only when level+field both match.
 *
 * Usage: npx tsx scripts/verify/investigate-gaps.ts [--dry-run] [--limit N]
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REVIEW_PATH = join(__dirname, "rename-review.json");
const PROGRAMS_PATH = join(__dirname, "..", "..", "src", "data", "programs.ts");

const dryRun = process.argv.includes("--dry-run");
const lIdx = process.argv.indexOf("--limit");
const limit = lIdx >= 0 ? parseInt(process.argv[lIdx + 1], 10) : undefined;

// ── Same matchesLevelAndField as the rest of the pipeline ──────────────────
const PG = ["MSc","MS","MA","MBA","MEng","MEd","MPA","MPP","MPH","MFA","MArch","MPhil","PhD","DPhil","EdD","MD","JD","LLM","MCom","MTech","MComp","Master","Master's","Masters","Doctor","Doctorate","Doctoral","Postgraduate","Postgrad"];
const UG = ["BSc","BS","BA","BEng","BBA","BFA","BCom","BTech","LLB","MBBS","Bachelor","Bachelors","Bachelor's","Undergraduate","Undergrad"];
const reKw = (k: string[]) => new RegExp(`\\b(${k.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "i");
const PG_RE = reKw(PG), UG_RE = reKw(UG);
const FIELDS: Record<string, string[]> = {
  "Computer Science & IT": ["computer science","computing","informatics","information technology","software","computer engineering","information systems"],
  "Artificial Intelligence & Data Science": ["artificial intelligence","machine learning","data science","data analytics","statistical learning","neural"],
  "Business & Management": ["business","management","marketing","supply chain","operations","entrepreneur"],
  "MBA": ["MBA","business administration"],
  "Engineering (Mechanical/Civil/Electrical)": ["engineering","mechanical","civil","electrical","electronic","EECS","robotics","aerospace","aeronautical","manufacturing"],
  "Biotechnology & Life Sciences": ["biotechnology","biotech","life sciences","biology","biological","biomedical","biochemistry","genetics","molecular"],
  "Medicine & Public Health": ["medicine","medical","public health","healthcare","clinical","pharmacy","epidemiology","health science","MBBS","MD"],
  "Law": ["law","legal","jurisprudence","LLM","LLB","JD","juris doctor"],
  "Arts, Design & Architecture": ["art","arts","design","architecture","fine art","MFA","MArch"],
  "Social Sciences & Humanities": ["sociology","anthropology","philosophy","history","humanities","political science","international relations","psychology"],
  "Economics & Finance": ["economics","economic","finance","financial"],
  "Media & Communications": ["media","communications","journalism","communication","broadcasting"],
  "Environmental & Sustainability Studies": ["environmental","sustainability","climate","ecology","conservation"],
  "Natural Sciences": ["physics","chemistry","mathematics","mathematic","natural science","earth science","geology","astronomy"],
  "Nursing & Allied Health": ["nursing","allied health","physiotherapy","occupational therapy","midwifery","nutrition"],
  "Agriculture & Veterinary Sciences": ["agriculture","agricultural","veterinary","food science","horticulture"],
  "Hospitality & Tourism": ["hospitality","tourism","hotel","leisure"],
};
function matchesLevelAndField(name: string | null | undefined, level: string, field: string): boolean {
  if (!name) return false;
  const norm = name.replace(/(\b[A-Z])\.(?=[A-Z])/g, "$1").replace(/\.(?=[a-z\s]|$)/g, "");
  const re = level === "postgraduate" ? PG_RE : level === "undergraduate" ? UG_RE : null;
  if (!re || !re.test(norm)) return false;
  const kws = FIELDS[field];
  if (!kws) return false;
  const lower = norm.toLowerCase();
  return kws.some((k) => lower.includes(k.toLowerCase().trim()));
}

// ── Lookup row context (level/field) from DB ───────────────────────────────
function findRowContext(university: string, db_program: string) {
  const text = readFileSync(PROGRAMS_PATH, "utf8");
  const upat = university.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ppat = db_program.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = text.match(new RegExp(`university_name:\\s*"${upat}"[\\s\\S]{0,3000}?program_name:\\s*"${ppat}"`, ""));
  if (!m) return null;
  let s = m.index!;
  while (s > 0 && text[s] !== "{") s--;
  // String-aware walker (prevents corruption when URLs/strings contain braces).
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
  const grab = (k: string) => block.match(new RegExp(`${k}:\\s*"([^"]+)"`))?.[1] ?? "";
  const qsM = block.match(/qs_ranking:\s*(\d+|null)/);
  return {
    blockStart: s, blockEnd: e, block,
    country: grab("country"), city: grab("city"),
    qs: qsM && qsM[1] !== "null" ? parseInt(qsM[1], 10) : 0,
    field: grab("field_of_study"), level: grab("degree_level"),
  };
}

// ── Web search via Claude to find canonical URL ────────────────────────────
async function findUrlViaWebSearch(client: Anthropic, university: string, program: string, level: string, field: string): Promise<string | null> {
  const r = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 1024,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 } as unknown as Anthropic.Messages.Tool],
    messages: [{
      role: "user",
      content: `Find the official program page URL for:
- Program: ${program}
- University: ${university}
- Level: ${level}
- Field: ${field}

Use web search. Return ONLY the URL of the canonical course/program detail page on the university's own domain (preferring admissions/program pages over department landing pages). If you cannot find one with high confidence, respond with the literal word "NONE". No prose.`,
    }],
  });
  // Find last text block which should contain the URL
  for (let i = r.content.length - 1; i >= 0; i--) {
    const b = r.content[i];
    if (b.type !== "text") continue;
    const t = b.text.trim();
    if (!t) continue;
    if (t.toUpperCase() === "NONE") return null;
    const url = t.split(/\s+/).find((w) => w.startsWith("http"));
    if (url) return url.replace(/[)\].,;]+$/, "");
  }
  return null;
}

function runVerifier(args: { uni: string; country: string; city: string; qs: number; field: string; url: string }) {
  const verifier = join(__dirname, "verify-program.ts");
  const r = spawnSync(
    "npx",
    ["tsx", verifier,
      "--university", args.uni, "--country", args.country, "--city", args.city,
      "--qs", String(args.qs), "--field", args.field, "--url", args.url],
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }
  );
  if (r.status !== 0) return { ok: false, status: r.status };
  try {
    const out = r.stdout.trim();
    const startBrace = out.indexOf("{");
    if (startBrace < 0) return { ok: false, status: r.status };
    return { ok: true, status: r.status, ...JSON.parse(out.slice(startBrace)) };
  } catch { return { ok: false, status: r.status }; }
}

interface ReviewItem {
  university: string; url: string;
  db_program_name: string; page_program_name: string;
  reason?: string;
  attempted_deepening?: { candidate_url: string | null; verified_program_name?: string | null; outcome: string };
  attempted_websearch?: { candidate_url: string | null; outcome: string };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1); }
  const items: ReviewItem[] = JSON.parse(readFileSync(REVIEW_PATH, "utf8"));
  const work = limit ? items.slice(0, limit) : items;
  console.log(`Investigating ${work.length} gap items...`);

  const client = new Anthropic();
  let text = readFileSync(PROGRAMS_PATH, "utf8");
  const updated: ReviewItem[] = [];
  let resolved = 0, urlOnly = 0;

  for (const [i, item] of work.entries()) {
    process.stdout.write(`[${i + 1}/${work.length}] ${item.university} :: ${item.db_program_name}\n`);
    const ctx = findRowContext(item.university, item.db_program_name);
    if (!ctx) { updated.push({ ...item, attempted_websearch: { candidate_url: null, outcome: "row_not_found" } }); continue; }

    let url: string | null = null;
    try { url = await findUrlViaWebSearch(client, item.university, item.db_program_name, ctx.level, ctx.field); }
    catch (e) { updated.push({ ...item, attempted_websearch: { candidate_url: null, outcome: `search_error:${(e as Error).message.slice(0,80)}` } }); continue; }

    if (!url || url === item.url) {
      updated.push({ ...item, attempted_websearch: { candidate_url: url, outcome: url ? "websearch_returned_same_url" : "websearch_returned_none" } });
      process.stdout.write(`    -> ${url ? "same_url" : "websearch_NONE"}\n`);
      continue;
    }

    const v = runVerifier({ uni: item.university, country: ctx.country, city: ctx.city, qs: ctx.qs, field: ctx.field, url });
    if (v.ok && matchesLevelAndField(v.program_name, ctx.level, ctx.field)) {
      // Apply patch: rewrite name + url + stamp
      let newBlock = ctx.block
        .replace(/program_name:\s*"[^"]+"/, `program_name: ${JSON.stringify(v.program_name)}`)
        .replace(/program_url:\s*"[^"]+"/, `program_url: ${JSON.stringify(url)}`);
      if (!newBlock.includes("verified_at:")) {
        const ci = newBlock.lastIndexOf("}");
        const before = newBlock.slice(0, ci).replace(/[\s,]*$/, "");
        const after = newBlock.slice(ci);
        newBlock = before + `,\n    verified_at: ${JSON.stringify(v.verified_at)}, verification_source_url: ${JSON.stringify(v.verification_source_url)},\n  ` + after;
      }
      text = text.slice(0, ctx.blockStart) + newBlock + text.slice(ctx.blockEnd);
      resolved++;
      process.stdout.write(`    -> resolved (${url})\n`);
    } else if (v.ok && v.program_name) {
      // URL upgrade only — keep DB name, stamp + new URL
      let newBlock = ctx.block.replace(/program_url:\s*"[^"]+"/, `program_url: ${JSON.stringify(url)}`);
      if (!newBlock.includes("verified_at:")) {
        const ci = newBlock.lastIndexOf("}");
        const before = newBlock.slice(0, ci).replace(/[\s,]*$/, "");
        const after = newBlock.slice(ci);
        newBlock = before + `,\n    verified_at: ${JSON.stringify(v.verified_at)}, verification_source_url: ${JSON.stringify(v.verification_source_url)},\n  ` + after;
      }
      text = text.slice(0, ctx.blockStart) + newBlock + text.slice(ctx.blockEnd);
      urlOnly++;
      process.stdout.write(`    -> url_only (${url})\n`);
    } else {
      updated.push({ ...item, attempted_websearch: { candidate_url: url, outcome: `verifier_status=${v.status}` } });
      process.stdout.write(`    -> verifier_status=${v.status} (${url})\n`);
    }
  }

  if (dryRun) {
    console.log(`\nDRY RUN: would resolve ${resolved}, url-only ${urlOnly}, leave ${updated.length} in review`);
    return;
  }
  writeFileSync(PROGRAMS_PATH, text);
  writeFileSync(REVIEW_PATH, JSON.stringify(updated, null, 2));
  console.log(`\nResolved (name+url): ${resolved}`);
  console.log(`URL upgraded only:   ${urlOnly}`);
  console.log(`Still in review:     ${updated.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
