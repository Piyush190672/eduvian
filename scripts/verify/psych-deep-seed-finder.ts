/**
 * psych-deep-seed-finder.ts
 *
 * Companion to pg-fields-seed-finder.ts but specifically for Psychology.
 * The vanilla pg-fields prompt returns ONE URL per field — fine for most
 * fields, but Psychology has many distinct PG specialisms (Clinical,
 * Counselling, Health, Forensic, Educational, Occupational, Sport,
 * Neuropsychology, Cognitive, Developmental, Social, Conversion MSc,
 * generic MSc Psychology, etc.) that we want all of, not just the
 * flagship.
 *
 * Per uni: web_search asks for the COMPLETE set of master's-level
 * Psychology program URLs on the university's own domain — up to 12,
 * one per distinct specialism. Output is a seed-entry list ready to
 * merge with the flagship pass and run through verify-batch.ts.
 *
 * Usage:
 *   npx tsx scripts/verify/psych-deep-seed-finder.ts \
 *     --universities scripts/verify/catalogs/uk-psych-qs500-target.json \
 *     --out scripts/verify/seeds/uk-psych-qs500-deep.json
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

interface UniInput {
  university: string;
  country: string;
  city: string;
  qs_ranking: number | null;
  // Ignored by this script — kept for shared catalog format compatibility.
  missing_fields?: string[];
}
interface SeedOut {
  university: string;
  country: string;
  city: string;
  qs_ranking: number | null;
  field_of_study: "Psychology";
  program_url: string;
  degree_level: "postgraduate";
}

const PROMPT = (uni: UniInput) => `You are building a list of POSTGRADUATE Psychology program-detail URLs for one university.

UNIVERSITY: ${uni.university}
COUNTRY: ${uni.country}
CITY: ${uni.city}
QS RANK: ${uni.qs_ranking ?? "unranked"}

Use web_search to find ALL master's-level (MA / MSc / MEd / PGDip-leading-to-MSc) Psychology programs this university offers. We want DISTINCT specialisms — not duplicates of the same course.

Specialisms to look for (return any/all the uni offers — do NOT invent):
- Clinical Psychology
- Counselling Psychology  (UK spelling — also Counseling)
- Health Psychology
- Forensic Psychology
- Educational Psychology / Child Psychology
- Occupational / Organisational / Work Psychology
- Sport (and Exercise) Psychology
- Neuropsychology / Clinical Neuroscience
- Cognitive Psychology / Cognitive Neuroscience
- Developmental Psychology
- Social Psychology
- Conversion MSc Psychology (BPS-accredited, designed for non-psychology bachelor's grads)
- Generic MSc Psychology / Applied Psychology / Psychological Sciences research master's
- Business Psychology / Consumer Psychology
- Other niche Psychology masters specific to the university (e.g., Music Psychology, Forensic Mental Health)

Rules:
- Each URL must point to a SPECIFIC postgraduate Psychology program page — not a department landing, not a school catalog index, not a bachelor's page, not a PhD-only page.
- The URL must be on the university's own domain (e.g., *.ox.ac.uk for Oxford, *.ucl.ac.uk for UCL).
- Skip if a clear flagship URL can't be found — empty result is better than a wrong URL.
- Do NOT include duplicates of the same program in different formats.
- Do NOT include MPhil / PhD / DClinPsych / professional doctorate / DEdPsy unless ALSO offered as a master's; we only want taught Master's degrees here.
- A university may offer 0, 1, or many — return them all.

Return ONLY a JSON array of objects, no prose, no code fences:
[
  { "specialism": "<short label, e.g. 'Clinical Psychology' or 'Conversion MSc'>", "program_url": "<absolute URL>" }
]`;

async function findUrlsForUni(client: Anthropic, uni: UniInput): Promise<SeedOut[]> {
  const r = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [
      { type: "web_search_20250305", name: "web_search", max_uses: 8 } as unknown as Anthropic.Messages.Tool,
    ],
    messages: [{ role: "user", content: PROMPT(uni) }],
  });
  const text = r.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < 0) {
    console.error(`  [no JSON array found in response]`);
    return [];
  }
  let arr: Array<{ specialism?: string; program_url?: string }>;
  try {
    arr = JSON.parse(text.slice(start, end + 1));
  } catch {
    console.error(`  [JSON parse error]`);
    return [];
  }
  const out: SeedOut[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    if (!item.program_url || !item.program_url.startsWith("http")) continue;
    // Dedup within this uni's response by URL (case-insensitive).
    const key = item.program_url.toLowerCase().replace(/\/+$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      university: uni.university,
      country: uni.country,
      city: uni.city,
      qs_ranking: uni.qs_ranking,
      field_of_study: "Psychology",
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
  console.log(`Psych deep seed-finding for ${unis.length} universities…`);

  // Resume: load any existing partial output and skip unis already covered.
  const all: SeedOut[] = [];
  const coveredUnis = new Set<string>();
  if (existsSync(outPath)) {
    try {
      const prior = JSON.parse(readFileSync(outPath, "utf8")) as SeedOut[];
      for (const s of prior) {
        all.push(s);
        coveredUnis.add(s.university);
      }
      console.log(`Resuming: loaded ${prior.length} prior seeds across ${coveredUnis.size} unis from ${outPath}.`);
    } catch {
      // ignore — start fresh
    }
  }

  const client = new Anthropic();

  for (let i = 0; i < unis.length; i++) {
    const u = unis[i];
    if (coveredUnis.has(u.university)) {
      process.stdout.write(`[${i + 1}/${unis.length}] ${u.university}  (skipped — already in output)\n`);
      continue;
    }
    process.stdout.write(`[${i + 1}/${unis.length}] ${u.university}\n`);
    try {
      const urls = await findUrlsForUni(client, u);
      process.stdout.write(`  -> ${urls.length} URLs\n`);
      all.push(...urls);
      // Persist incrementally so a kill mid-run doesn't lose progress.
      writeFileSync(outPath, JSON.stringify(all, null, 2));
    } catch (err) {
      console.error(`  [error] ${(err as Error).message}`);
    }
  }

  console.log(`\nDone. ${all.length} total seed URLs written to ${outPath}.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
