/**
 * realistic-admit-extractor.ts
 *
 * For each QS top-100 university, asks Claude (Sonnet + web_search) for
 * the REALISTIC admission bar — typical median admit profile, not the
 * lenient published floor. Output is a per-uni JSON record with
 * realistic_min_* numeric fields + a source attribution string.
 *
 * Why this exists: most top universities publish lenient minimum
 * thresholds (e.g. "min GPA 3.0") because admissions are holistic.
 * Our verify-program.ts extracts those published floors faithfully —
 * which then flattens to a median min_gpa of 3.0 across QS 1-25,
 * 26-100, and 101-700 alike. A 3.5-GPA applicant "matches" Stanford
 * the same as Plymouth on paper. The realistic bar (Stanford ~3.9
 * median admit, Plymouth ~3.0) is what should drive the match score.
 *
 * The script writes a per-uni audit JSON for the merge step to apply
 * the realistic_min_* fields to ALL programs at that uni in
 * programs.ts.
 *
 * Sources (per the prompt): U.S. News median admit data, university
 * "class profile" pages, IGCSE / A-Level / UCAS Tariff entry bands
 * for UK, ATAR cutoffs for AU, equivalent for other countries.
 * Banned: Reddit / Quora / forum posts, sources without dated
 * attribution. Empty / null is preferred to an invented number.
 *
 * Usage:
 *   npx tsx scripts/verify/realistic-admit-extractor.ts \
 *     --universities scripts/verify/catalogs/realistic-admit-top100.json \
 *     --out scripts/verify/output/realistic-admit-top100.json
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

interface UniInput {
  university: string;
  country: string;
  city: string;
  qs_ranking: number;
}
interface UniOutput {
  university: string;
  country: string;
  qs_ranking: number;
  realistic_min_gpa: number | null;
  realistic_min_percentage: number | null;
  realistic_min_ielts: number | null;
  realistic_min_toefl: number | null;
  realistic_min_gre: number | null;
  realistic_min_gmat: number | null;
  realistic_min_sat: number | null;
  realistic_source: string | null;
  realistic_extracted_at: string;
}

const PROMPT = (uni: UniInput) => `You are helping calibrate study-abroad match scores. For ONE university below, use web_search to find the REALISTIC admission bar — the typical median admit profile, NOT the lenient published floor.

UNIVERSITY: ${uni.university}
COUNTRY:    ${uni.country}
CITY:       ${uni.city}
QS RANK:    ${uni.qs_ranking}

For each field below, return the typical median or 50th-percentile admit number. NOT the lowest published minimum.

  realistic_min_gpa         — on 4.0 scale. Median admit undergraduate GPA. (USA / Canada / similar)
  realistic_min_percentage  — out of 100. Median admit overall percentage. (UK / India / etc.)
  realistic_min_ielts       — typical IELTS overall score competitive applicants present.
  realistic_min_toefl       — TOEFL iBT, same.
  realistic_min_gre         — total (Verbal + Quant out of 340). Used for master's.
  realistic_min_gmat        — total. Used for MBA / business master's.
  realistic_min_sat         — total (1600 scale). Used for undergraduate USA / similar.

Strict rules:
- Return only fields that have a credible source for THIS specific university. Fields without a source → null.
- Source CATEGORIES (acceptable): U.S. News rankings ("median admit GPA"), university's own "class profile" / "admitted student profile" page, government admissions stats (UCAS, ATAR), reputable rankings aggregators (QS, THE) when they cite admit data.
- BANNED: Reddit, Quora, college-confidential, any forum, anything without a year attribution.
- If the school doesn't publish median admit data and no credible aggregator does, return null for that field. Better empty than fabricated.
- Do NOT return the school's published minimum — we already have that. We want the realistic typical admit.
- For schools where admissions are highly individualised and no median is published (Oxford, Cambridge, etc.), return null and put a brief note in realistic_source explaining why.

Return ONLY a JSON object, no prose, no code fences:
{
  "realistic_min_gpa": <number or null>,
  "realistic_min_percentage": <number or null>,
  "realistic_min_ielts": <number or null>,
  "realistic_min_toefl": <number or null>,
  "realistic_min_gre": <number or null>,
  "realistic_min_gmat": <number or null>,
  "realistic_min_sat": <number or null>,
  "realistic_source": "<short attribution, e.g. 'U.S. News 2024 median admit GPA' or 'no published median admit data — holistic admissions'>"
}`;

async function fetchOne(client: Anthropic, uni: UniInput): Promise<UniOutput | null> {
  try {
    const r = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 4 } as unknown as Anthropic.Messages.Tool],
      messages: [{ role: "user", content: PROMPT(uni) }],
    });
    const text = r.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
    const start = text.indexOf("{");
    const end   = text.lastIndexOf("}");
    if (start < 0 || end < 0) {
      console.error(`  [no JSON object found]`);
      return null;
    }
    const obj = JSON.parse(text.slice(start, end + 1));
    return {
      university: uni.university,
      country: uni.country,
      qs_ranking: uni.qs_ranking,
      realistic_min_gpa:        typeof obj.realistic_min_gpa === "number" ? obj.realistic_min_gpa : null,
      realistic_min_percentage: typeof obj.realistic_min_percentage === "number" ? obj.realistic_min_percentage : null,
      realistic_min_ielts:      typeof obj.realistic_min_ielts === "number" ? obj.realistic_min_ielts : null,
      realistic_min_toefl:      typeof obj.realistic_min_toefl === "number" ? obj.realistic_min_toefl : null,
      realistic_min_gre:        typeof obj.realistic_min_gre === "number" ? obj.realistic_min_gre : null,
      realistic_min_gmat:       typeof obj.realistic_min_gmat === "number" ? obj.realistic_min_gmat : null,
      realistic_min_sat:        typeof obj.realistic_min_sat === "number" ? obj.realistic_min_sat : null,
      realistic_source:         typeof obj.realistic_source === "string" ? obj.realistic_source : null,
      realistic_extracted_at:   new Date().toISOString(),
    };
  } catch (e) {
    console.error(`  [error] ${(e as Error).message}`);
    return null;
  }
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1); }
  const argv = process.argv.slice(2);
  const get = (k: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
  const inPath = get("universities");
  const outPath = get("out");
  if (!inPath || !outPath) { console.error("Need --universities <file> --out <file>"); process.exit(1); }

  const unis: UniInput[] = JSON.parse(readFileSync(inPath, "utf8"));
  console.log(`Realistic-admit extraction for ${unis.length} universities…`);

  const results: UniOutput[] = [];
  const seenUnis = new Set<string>();
  if (existsSync(outPath)) {
    try {
      const prior = JSON.parse(readFileSync(outPath, "utf8")) as UniOutput[];
      for (const r of prior) { results.push(r); seenUnis.add(r.university); }
      console.log(`Resuming: ${prior.length} prior results loaded.`);
    } catch { /* ignore */ }
  }

  const client = new Anthropic();
  for (let i = 0; i < unis.length; i++) {
    const u = unis[i];
    if (seenUnis.has(u.university)) {
      process.stdout.write(`[${i + 1}/${unis.length}] ${u.university}  (skipped)\n`);
      continue;
    }
    process.stdout.write(`[${i + 1}/${unis.length}] QS#${u.qs_ranking}  ${u.university}\n`);
    const r = await fetchOne(client, u);
    if (r) {
      results.push(r);
      const counts: string[] = [];
      if (r.realistic_min_gpa != null) counts.push(`gpa=${r.realistic_min_gpa}`);
      if (r.realistic_min_percentage != null) counts.push(`pct=${r.realistic_min_percentage}`);
      if (r.realistic_min_gre != null) counts.push(`gre=${r.realistic_min_gre}`);
      if (r.realistic_min_sat != null) counts.push(`sat=${r.realistic_min_sat}`);
      if (r.realistic_min_ielts != null) counts.push(`ielts=${r.realistic_min_ielts}`);
      process.stdout.write(`  -> ${counts.length ? counts.join(", ") : "all null"}\n`);
      writeFileSync(outPath, JSON.stringify(results, null, 2));
    }
  }
  console.log(`\nDone. ${results.length} entries written to ${outPath}.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
