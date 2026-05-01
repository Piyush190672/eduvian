/**
 * websearch-seed-finder.ts  —  Option B: bypass catalog pages entirely.
 *
 * For each (university, country, city, qs_ranking) in the input list, ask
 * Claude with the web_search tool to find the canonical program-detail URL
 * for as many of the 17 FIELDS_OF_STUDY as the university genuinely offers.
 * Output is a seed JSON file ready for verify-batch.ts.
 *
 * Why this exists: many top universities (Stanford, MIT, Berkeley, JHU,
 * Columbia, etc.) ship their program catalogs as React SPAs whose program
 * indexes hydrate from JS, so static anchor extraction yields 0. Web search
 * sidesteps the catalog page entirely.
 *
 * Authenticity: Claude's web search returns real URLs from real search
 * results — we never invent them. Each URL still goes through verify-program
 * for field extraction; pages that don't match the stated field are rejected.
 *
 * Usage:
 *   npx tsx scripts/verify/websearch-seed-finder.ts \
 *     --universities scripts/verify/catalogs/qs-2026-spa-fail.json \
 *     --out scripts/verify/seeds/spa-fail-auto.json
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
void __dirname;

const FIELDS = [
  "Computer Science & IT",
  "Artificial Intelligence & Data Science",
  "Business & Management",
  "MBA",
  "Engineering (Mechanical/Civil/Electrical)",
  "Biotechnology & Life Sciences",
  "Medicine & Public Health",
  "Law",
  "Arts, Design & Architecture",
  "Social Sciences & Humanities",
  "Economics & Finance",
  "Media & Communications",
  "Environmental & Sustainability Studies",
  "Natural Sciences",
  "Nursing & Allied Health",
  "Agriculture & Veterinary Sciences",
  "Hospitality & Tourism",
];

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
}

const PROMPT = (uni: UniInput) => `You are building a list of program-detail URLs for a single university.

UNIVERSITY: ${uni.university}
COUNTRY: ${uni.country}
CITY: ${uni.city}
QS RANK: ${uni.qs_ranking ?? "unranked"}

For EACH of these 17 fields of study, use web_search to find ONE canonical program-detail URL on the university's own domain (NOT third-party listings, NOT Wikipedia). Prefer pages that show the actual degree program — Master's / Bachelor's / PhD detail pages with admissions info.

FIELDS:
${FIELDS.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Rules:
- Skip a field if the university doesn't have a clear flagship program in it (e.g., MIT has no nursing school, so skip Nursing).
- Skip if you can't find a confident URL — empty result is far better than a wrong URL.
- One URL per field. Pick the most representative master's-level program (or bachelor's, if no master's).
- Only return URLs whose host belongs to the university (e.g., *.mit.edu for MIT).
- The URL must point to a SPECIFIC program detail page, not a department landing or a generic catalog index.

Return ONLY a JSON array of objects, no prose, no code fences:
[
  { "field_of_study": "<one of the 17 fields verbatim>", "program_url": "<absolute URL>" }
]`;

async function findUrlsForUni(client: Anthropic, uni: UniInput): Promise<SeedOut[]> {
  const r = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 25 } as unknown as Anthropic.Messages.Tool],
    messages: [{ role: "user", content: PROMPT(uni) }],
  });
  // Concatenate all text blocks (the final answer comes after web_search tool calls)
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
    if (!FIELDS.includes(item.field_of_study)) continue;
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
  console.log(`Web-search seed-finding for ${unis.length} universities…`);

  const client = new Anthropic();
  const all: SeedOut[] = [];
  for (const [i, u] of unis.entries()) {
    process.stdout.write(`[${i + 1}/${unis.length}] ${u.university}\n`);
    try {
      const seeds = await findUrlsForUni(client, u);
      all.push(...seeds);
      process.stdout.write(`  -> ${seeds.length} fields\n`);
      // Persist progressively in case of crash
      writeFileSync(outPath, JSON.stringify(all, null, 2));
    } catch (e) {
      console.error(`  ERROR: ${(e as Error).message.slice(0, 120)}`);
    }
  }
  console.log(`\nTotal seeds: ${all.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
