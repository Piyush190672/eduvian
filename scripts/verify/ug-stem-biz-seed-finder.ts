/**
 * ug-stem-biz-seed-finder.ts
 *
 * Variant of websearch-seed-finder.ts focused on:
 *   - Bachelor's / undergraduate program-detail URLs (NOT master's)
 *   - The 9 STEM + Business/Commerce/Economics fields only
 *
 * Why this exists: the original finder defaults to "the most representative
 * master's-level program (or bachelor's, if no master's)". Top-500 unis are
 * already over-represented at PG level in our DB; the gap is UG. Asking for
 * UG explicitly per uni × per relevant field is the cheapest path to closing it.
 *
 * Authenticity: same rules as the original. Web search returns real URLs only;
 * each result still gets verified by verify-program.ts before landing.
 *
 * Usage:
 *   npx tsx scripts/verify/ug-stem-biz-seed-finder.ts \
 *     --universities scripts/verify/catalogs/ug-stem-biz-pilot-top30.json \
 *     --out scripts/verify/seeds/ug-stem-biz-pilot.json
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "node:fs";

const TARGET_FIELDS = [
  "Computer Science & IT",
  "Artificial Intelligence",
  "Engineering (Mechanical/Civil/Electrical)",
  "Architecture",
  "Biotechnology & Life Sciences",
  "Natural Sciences",
  "Environmental & Sustainability Studies",
  "Business & Management",
  "Economics & Finance",
] as const;

interface UniInput {
  university: string;
  country: string;
  city: string;
  qs_ranking: number | null;
}
interface SeedOut {
  university: string;
  country: string;
  city: string;
  qs_ranking: number | null;
  field_of_study: string;
  program_url: string;
  degree_level: "undergraduate";
}

const PROMPT = (uni: UniInput) => `You are building a list of undergraduate program-detail URLs for a single university.

UNIVERSITY: ${uni.university}
COUNTRY: ${uni.country}
CITY: ${uni.city}
QS RANK: ${uni.qs_ranking ?? "unranked"}

For EACH of these 9 fields of study, use web_search to find ONE canonical UNDERGRADUATE program-detail URL on the university's own domain. Bachelor's / BSc / BA / BEng / BBA / undergraduate-degree pages — NOT master's, NOT PhD, NOT diploma, NOT certificate, NOT short-courses, NOT graduate-school catalog indexes.

FIELDS:
${TARGET_FIELDS.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Rules:
- Skip a field if the university doesn't have a clear flagship undergraduate program in it (e.g., LSE has no engineering UG — skip).
- Skip if you can't find a confident URL — empty result is far better than a wrong URL.
- One URL per field. Pick the most representative bachelor's-level program; prefer single-named majors over combined/joint degrees.
- Only return URLs whose host belongs to the university (e.g., *.mit.edu for MIT).
- The URL must point to a SPECIFIC undergraduate program detail page, not a department landing or a generic catalog index, and not a postgraduate page.
- If the page clearly says "Master's" / "MSc" / "MA" / "Graduate" — REJECT. Re-search if needed.

Return ONLY a JSON array of objects, no prose, no code fences:
[
  { "field_of_study": "<one of the 9 fields verbatim>", "program_url": "<absolute URL>" }
]`;

async function findUrlsForUni(client: Anthropic, uni: UniInput): Promise<SeedOut[]> {
  const r = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 9 } as unknown as Anthropic.Messages.Tool],
    messages: [{ role: "user", content: PROMPT(uni) }],
  });
  const text = r.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < 0) {
    console.error(`  [no JSON array found in response]`);
    return [];
  }
  let arr: Array<{ field_of_study?: string; program_url?: string }>;
  try {
    arr = JSON.parse(text.slice(start, end + 1));
  } catch {
    console.error(`  [JSON parse error]`);
    return [];
  }
  const out: SeedOut[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    if (!item.field_of_study || !item.program_url) continue;
    if (!(TARGET_FIELDS as readonly string[]).includes(item.field_of_study)) continue;
    if (!item.program_url.startsWith("http")) continue;
    const key = `${item.field_of_study}|${item.program_url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      university: uni.university,
      country: uni.country,
      city: uni.city,
      qs_ranking: uni.qs_ranking,
      field_of_study: item.field_of_study,
      program_url: item.program_url,
      degree_level: "undergraduate",
    });
  }
  return out;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1); }
  const argv = process.argv.slice(2);
  const get = (k: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
  const inPath = get("universities");
  const outPath = get("out");
  if (!inPath || !outPath) { console.error("Need --universities <file> --out <file>"); process.exit(1); }

  const unis: UniInput[] = JSON.parse(readFileSync(inPath, "utf8"));
  console.log(`UG STEM/Biz seed-finding for ${unis.length} universities…`);
  const client = new Anthropic();
  const all: SeedOut[] = [];
  for (const [i, u] of unis.entries()) {
    process.stdout.write(`[${i + 1}/${unis.length}] ${u.university}\n`);
    try {
      const seeds = await findUrlsForUni(client, u);
      all.push(...seeds);
      process.stdout.write(`  -> ${seeds.length} fields\n`);
      writeFileSync(outPath, JSON.stringify(all, null, 2));
    } catch (e) {
      console.error(`  ERROR: ${(e as Error).message.slice(0, 120)}`);
    }
  }
  console.log(`\nDone. ${all.length} seed URLs written to ${outPath}`);
}

main();
