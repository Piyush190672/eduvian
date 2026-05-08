/**
 * pg-fields-seed-finder.ts
 *
 * Variant of websearch-seed-finder.ts focused on:
 *   - Master's / postgraduate program-detail URLs (NOT bachelor's)
 *   - Per-uni only the FIELDS THAT ARE MISSING from the DB at PG level
 *     (passed in via the input catalog as `missing_fields`)
 *
 * Why per-uni filtering: the gap analysis already knows which (uni, field)
 * pairs are missing. Asking for the full 18-field set every time wastes
 * web_search calls and Anthropic budget. Each uni gets a tailored prompt.
 *
 * Sports Management note: the user asked for sports management programs.
 * There's no dedicated FIELDS_OF_STUDY entry for it (decision: bucket under
 * Business & Management). When Business & Management is in missing_fields
 * for a uni, the prompt explicitly asks for an additional Sports Management
 * Master's URL on top of the general Business/MBA program — both come back
 * tagged "Business & Management". Same dedup key is (field, url), so two
 * different URLs in the same field are both kept.
 *
 * Authenticity: web search returns real URLs only; verify-program is the
 * authoritative gate before anything lands in the DB.
 *
 * Usage:
 *   npx tsx scripts/verify/pg-fields-seed-finder.ts \
 *     --universities scripts/verify/catalogs/pg-fields-target.json \
 *     --out scripts/verify/seeds/pg-fields-sweep.json
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

interface UniInput {
  university: string;
  country: string;
  city: string;
  qs_ranking: number | null;
  missing_fields: string[];
}
interface SeedOut {
  university: string;
  country: string;
  city: string;
  qs_ranking: number | null;
  field_of_study: string;
  program_url: string;
  degree_level: "postgraduate";
}

const PROMPT = (uni: UniInput) => {
  const wantsBiz = uni.missing_fields.includes("Business & Management");
  const sportsLine = wantsBiz
    ? `\n- For "Business & Management", return TWO URLs if the university offers them: (a) the flagship MS/MA in Business / Management; (b) a Master's in SPORTS MANAGEMENT, if the university has one as a distinct degree. Both URLs are tagged "Business & Management" in the output.`
    : "";

  return `You are building a list of POSTGRADUATE program-detail URLs for a single university.

UNIVERSITY: ${uni.university}
COUNTRY: ${uni.country}
CITY: ${uni.city}
QS RANK: ${uni.qs_ranking ?? "unranked"}

For EACH of these fields, use web_search to find ONE canonical Master's-level (MA / MSc / MEng / LLM / MBA / MArch / MPH / etc.) program-detail URL on the university's own domain. Bachelor's, PhD-only, diploma, certificate and short-course pages are REJECTED.

FIELDS:
${uni.missing_fields.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Rules:
- Skip a field if the university doesn't have a clear flagship master's-level program in it (e.g., LSE has no engineering master's — skip).
- Skip if you can't find a confident URL — empty result is far better than a wrong URL.
- One URL per field, except where noted below.
- Only return URLs whose host belongs to the university (e.g., *.mit.edu for MIT).
- The URL must point to a SPECIFIC postgraduate program detail page — not a department landing, not a graduate-school catalog index, not a bachelor's page.
- If the page clearly says "Bachelor" / "BS" / "BA" / "Undergraduate" — REJECT. Re-search if needed.${sportsLine}

Return ONLY a JSON array of objects, no prose, no code fences:
[
  { "field_of_study": "<one of the missing fields verbatim>", "program_url": "<absolute URL>" }
]`;
};

async function findUrlsForUni(client: Anthropic, uni: UniInput): Promise<SeedOut[]> {
  const r = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: Math.max(uni.missing_fields.length + 2, 4) } as unknown as Anthropic.Messages.Tool],
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
  const allowed = new Set(uni.missing_fields);
  const out: SeedOut[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    if (!item.field_of_study || !item.program_url) continue;
    if (!allowed.has(item.field_of_study)) continue;
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
      degree_level: "postgraduate",
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
  console.log(`PG fields seed-finding for ${unis.length} universities…`);

  // Resume: load any existing partial output and skip unis already covered.
  const all: SeedOut[] = [];
  const coveredUnis = new Set<string>();
  if (existsSync(outPath)) {
    try {
      const prev: SeedOut[] = JSON.parse(readFileSync(outPath, "utf8"));
      all.push(...prev);
      for (const s of prev) coveredUnis.add(s.university);
      console.log(`Resume: loaded ${prev.length} prior seeds across ${coveredUnis.size} unis (will skip those).`);
    } catch { /* ignore */ }
  }

  const client = new Anthropic();
  for (const [i, u] of unis.entries()) {
    if (coveredUnis.has(u.university)) {
      process.stdout.write(`[${i + 1}/${unis.length}] ${u.university} (skip — already in output)\n`);
      continue;
    }
    process.stdout.write(`[${i + 1}/${unis.length}] ${u.university} (${u.missing_fields.length} fields)\n`);
    try {
      const seeds = await findUrlsForUni(client, u);
      all.push(...seeds);
      process.stdout.write(`  -> ${seeds.length} URLs\n`);
      writeFileSync(outPath, JSON.stringify(all, null, 2));
    } catch (e) {
      console.error(`  ERROR: ${(e as Error).message.slice(0, 120)}`);
    }
  }
  console.log(`\nDone. ${all.length} seed URLs written to ${outPath}`);
}

main();
