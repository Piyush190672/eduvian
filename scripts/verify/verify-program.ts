/**
 * verify-program.ts
 *
 * Fetches an official university program page and extracts ProgramEntry fields
 * using Claude with strict instructions: only return values literally stated on
 * the page; anything ambiguous returns null.
 *
 * Output is written to scripts/verify/output/<slug>.json with `verified_at` and
 * `verification_source_url` stamped. Merge into programs.ts via merge.ts.
 *
 * Usage:
 *   npx tsx scripts/verify/verify-program.ts \
 *     --university "University of Cambridge" \
 *     --country "UK" \
 *     --city "Cambridge" \
 *     --qs 5 \
 *     --field "Artificial Intelligence & Data Science" \
 *     --url "https://www.mlmi.eng.cam.ac.uk/"
 *
 * Required env: ANTHROPIC_API_KEY
 */

import Anthropic from "@anthropic-ai/sdk";
import { chromium, type Browser } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "output");

interface VerifiedProgram {
  university_name: string;
  country: string;
  city: string;
  qs_ranking: number | null;
  program_name: string | null;
  degree_level: "undergraduate" | "postgraduate" | null;
  duration_months: number | null;
  field_of_study: string;
  specialization: string | null;
  annual_tuition_usd: number | null;
  avg_living_cost_usd: number | null;
  intake_semesters: string[];
  application_deadline: string | null;
  min_gpa: number | null;
  min_percentage: number | null;
  min_ielts: number | null;
  min_toefl: number | null;
  min_pte: number | null;
  min_duolingo: number | null;
  min_gre: number | null;
  min_gmat: number | null;
  min_sat: number | null;
  work_exp_required_years: number | null;
  program_url: string;
  apply_url: string | null;
  verified_at: string;
  verification_source_url: string;
  /** Fields the page did not state (null'd) — surfaced for human review. */
  fields_not_stated: string[];
}

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const k = process.argv[i].replace(/^--/, "");
    args[k] = process.argv[i + 1];
  }
  return args;
}

// Single shared browser instance per process — much faster than launching per page.
let _browser: Browser | null = null;
async function getBrowser(): Promise<Browser> {
  if (_browser) return _browser;
  _browser = await chromium.launch({ headless: true });
  return _browser;
}

/**
 * Fetches a URL using a real Chromium browser so SPA-rendered content
 * (Stanford, MIT, CMU, etc.) actually populates before extraction.
 *
 * Strategy:
 *  1) Try `networkidle` with a tight timeout — best for static-ish sites.
 *  2) Fall back to `domcontentloaded` for pages that never go idle (analytics, chat widgets).
 *  3) Strip scripts/styles/nav and collapse whitespace.
 */
async function fetchPage(url: string): Promise<string> {
  const browser = await getBrowser();
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 1800 },
    locale: "en-US",
  });
  const page = await ctx.newPage();
  // Block heavy resources we don't need — speeds things up significantly.
  await page.route("**/*", (route) => {
    const t = route.request().resourceType();
    if (t === "image" || t === "media" || t === "font") return route.abort();
    return route.continue();
  });
  try {
    // Tightened timeouts: networkidle 8s (was 20s), domcontentloaded fallback 12s,
    // post-load wait 500ms (was 1500ms). The verifier never invents data — it only
    // extracts values literally on the page — so less render time just means more
    // honest `null`s, not fabrication. Authenticity floor unchanged.
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 8_000 });
    } catch {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 12_000 });
    }
    await page.waitForTimeout(500);
    const html = await page.content();
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<svg[\s\S]*?<\/svg>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return stripped.slice(0, 150_000);
  } finally {
    await page.close();
    await ctx.close();
  }
}

async function shutdownBrowser() {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}

const EXTRACTION_PROMPT = (params: {
  university: string;
  field: string;
  url: string;
  pageText: string;
}) => `You are extracting facts from an official university program page. The output goes into a public student-facing database, so accuracy is non-negotiable.

UNIVERSITY: ${params.university}
INTENDED FIELD OF STUDY: ${params.field}
SOURCE URL: ${params.url}

PAGE CONTENT (text-only, scripts/styles stripped):
"""
${params.pageText}
"""

Return a single JSON object with these exact keys. For every field, return null if the page does not literally state the value. Do not infer, estimate, or use general knowledge. Only what the page says.

{
  "program_name": string | null,                  // exact program title as on page
  "degree_level": "undergraduate" | "postgraduate" | null,
  "duration_months": integer | null,              // convert years/semesters to months
  "specialization": string | null,                // sub-field if stated, else null
  "annual_tuition_usd": integer | null,           // convert from local currency at the rate stated on page; if no rate, null
  "intake_semesters": string[],                   // any of "fall","spring","summer","winter"; [] if not stated
  "application_deadline": "YYYY-MM-DD" | "rolling" | null,
  "min_gpa": number | null,                       // 0–4.0 scale
  "min_percentage": number | null,                // 0–100
  "min_ielts": number | null,
  "min_toefl": number | null,
  "min_pte": number | null,
  "min_duolingo": number | null,
  "min_gre": number | null,
  "min_gmat": number | null,
  "min_sat": number | null,
  "work_exp_required_years": number | null,
  "apply_url": string | null,                     // full URL of the apply/admissions page if linked from this page
  "page_says_field_matches_intended": boolean,    // Set to FALSE only if the page is unambiguously about a completely different academic area (e.g. a Hospitality program when intended field is AI). A department/listing page that includes the intended field counts as TRUE. A page that broadly covers the intended field's discipline counts as TRUE. Default to TRUE when in doubt — the human reviewer will catch edge cases. Setting this to FALSE deletes the entry, so be conservative.
  "fields_not_stated": string[],                  // list of the keys above you returned null for because page didn't state
  "extractor_notes": string                       // 1–3 sentences on anything ambiguous or worth flagging for human review
}

Return ONLY the JSON object, no prose, no code fences.`;

async function main() {
  const args = parseArgs();
  for (const k of ["university", "country", "city", "field", "url"]) {
    if (!args[k]) {
      console.error(`Missing required arg: --${k}`);
      process.exit(1);
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  console.error(`[fetch] ${args.url}`);
  const pageText = await fetchPage(args.url);
  console.error(`[fetch] ${pageText.length} chars after strip`);

  const client = new Anthropic();
  console.error(`[extract] sending to Claude...`);
  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    thinking: { type: "adaptive" },
    messages: [
      {
        role: "user",
        content: EXTRACTION_PROMPT({
          university: args.university,
          field: args.field,
          url: args.url,
          pageText,
        }),
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from model");
  }
  const json = textBlock.text.trim();
  let extracted: Record<string, unknown>;
  try {
    extracted = JSON.parse(json);
  } catch (e) {
    console.error("Model did not return valid JSON. Raw output:");
    console.error(json);
    process.exit(2);
  }

  if (extracted.page_says_field_matches_intended === false) {
    console.error(
      `[reject] Page does not match intended field "${args.field}". Notes: ${extracted.extractor_notes}`
    );
    process.exit(3);
  }

  const verified: VerifiedProgram = {
    university_name: args.university,
    country: args.country,
    city: args.city,
    qs_ranking: args.qs ? parseInt(args.qs, 10) : null,
    program_name: extracted.program_name as string | null,
    degree_level: extracted.degree_level as "undergraduate" | "postgraduate" | null,
    duration_months: extracted.duration_months as number | null,
    field_of_study: args.field,
    specialization: extracted.specialization as string | null,
    annual_tuition_usd: extracted.annual_tuition_usd as number | null,
    avg_living_cost_usd: null, // not extracted from program page
    intake_semesters: (extracted.intake_semesters as string[]) ?? [],
    application_deadline: extracted.application_deadline as string | null,
    min_gpa: extracted.min_gpa as number | null,
    min_percentage: extracted.min_percentage as number | null,
    min_ielts: extracted.min_ielts as number | null,
    min_toefl: extracted.min_toefl as number | null,
    min_pte: extracted.min_pte as number | null,
    min_duolingo: extracted.min_duolingo as number | null,
    min_gre: extracted.min_gre as number | null,
    min_gmat: extracted.min_gmat as number | null,
    min_sat: extracted.min_sat as number | null,
    work_exp_required_years: extracted.work_exp_required_years as number | null,
    program_url: args.url,
    apply_url: extracted.apply_url as string | null,
    verified_at: new Date().toISOString(),
    verification_source_url: args.url,
    fields_not_stated: (extracted.fields_not_stated as string[]) ?? [],
  };

  if (!verified.program_name) {
    console.error(
      `[reject] Could not extract program_name from page. Notes: ${extracted.extractor_notes}`
    );
    process.exit(4);
  }

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const slug = `${args.university}_${verified.program_name}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
  const outPath = join(OUT_DIR, `${slug}.json`);
  writeFileSync(outPath, JSON.stringify(verified, null, 2));
  console.error(`[ok] ${outPath}`);
  console.log(JSON.stringify(verified, null, 2));
}

main()
  .then(() => shutdownBrowser())
  .catch(async (e) => {
    console.error(e);
    await shutdownBrowser();
    process.exit(1);
  });
