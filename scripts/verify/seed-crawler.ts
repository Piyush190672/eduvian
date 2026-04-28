/**
 * seed-crawler.ts
 *
 * Given a university name + course-listing URL, fetches the catalog page and
 * asks Claude to extract official program URLs grouped by the 17 FIELDS_OF_STUDY.
 * Outputs seed JSON ready for verify-batch.ts.
 *
 * Usage:
 *   npx tsx scripts/verify/seed-crawler.ts \
 *     --university "Stanford University" \
 *     --country "USA" --city "Stanford, CA" --qs 3 \
 *     --catalog "https://www.stanford.edu/academics/" \
 *     --out scripts/verify/seeds/stanford.json
 *
 *   npx tsx scripts/verify/seed-crawler.ts --batch scripts/verify/catalogs.json
 *     where catalogs.json = [{ university, country, city, qs_ranking, catalog_url }]
 */

import Anthropic from "@anthropic-ai/sdk";
import { chromium, type Browser } from "playwright";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

let _browser: Browser | null = null;
async function getBrowser() {
  if (!_browser) _browser = await chromium.launch({ headless: true });
  return _browser;
}

async function fetchPage(url: string): Promise<string> {
  const browser = await getBrowser();
  const ctx = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  });
  const page = await ctx.newPage();
  await page.route("**/*", (r) => {
    const t = r.request().resourceType();
    if (t === "image" || t === "media" || t === "font") return r.abort();
    return r.continue();
  });
  try {
    try { await page.goto(url, { waitUntil: "networkidle", timeout: 25_000 }); }
    catch { await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 }); }
    await page.waitForTimeout(1500);
    // Capture all anchor href + text
    const anchors = await page.$$eval("a", (els) =>
      els
        .map((a) => ({ href: (a as HTMLAnchorElement).href, text: (a.textContent || "").trim() }))
        .filter((a) => a.href && a.text && a.text.length < 200)
    );
    return JSON.stringify(anchors).slice(0, 200_000);
  } finally {
    await page.close();
    await ctx.close();
  }
}

async function extractSeeds(input: {
  university: string; country: string; city: string; qs: number;
  catalog: string; anchorJson: string;
}) {
  const client = new Anthropic();
  const prompt = `You are mapping a university's course catalog to a fixed taxonomy of 17 fields of study.

UNIVERSITY: ${input.university}
CATALOG SOURCE URL: ${input.catalog}

FIELDS:
${FIELDS.map((f, i) => `${i + 1}. ${f}`).join("\n")}

ANCHORS (JSON array of {href, text} from the catalog page):
${input.anchorJson}

Return a JSON array of seed entries — one per (field, program) where the anchor clearly points to a degree-program page at this university for that field. Use this exact shape:

[{ "field_of_study": "<one of the 17 fields verbatim>", "program_url": "<absolute URL>" }]

Rules:
- Only include URLs that point to a specific degree program page (course/programme detail), not landing pages, news, blog posts, or staff bios.
- Skip non-degree resources (continuing-ed certificates, MOOCs, summer schools).
- Skip duplicates and external links to other institutions.
- Skip anything you cannot map confidently to one of the 17 fields.
- Be conservative — empty result is better than wrong field assignment.
- Output ONLY the JSON array, no prose.`;

  const r = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  });
  const tb = r.content.find((b) => b.type === "text");
  if (!tb || tb.type !== "text") throw new Error("no text response");
  return JSON.parse(tb.text.trim());
}

interface BatchEntry {
  university: string; country: string; city: string;
  qs_ranking: number; catalog_url: string;
}
interface SeedOut {
  university: string; country: string; city: string;
  qs_ranking: number; field_of_study: string; program_url: string;
}

async function run(args: BatchEntry): Promise<SeedOut[]> {
  console.error(`[crawl] ${args.university} <- ${args.catalog_url}`);
  const anchorJson = await fetchPage(args.catalog_url);
  const seeds = await extractSeeds({
    university: args.university, country: args.country, city: args.city,
    qs: args.qs_ranking, catalog: args.catalog_url, anchorJson,
  });
  const out: SeedOut[] = [];
  const seen = new Set<string>();
  for (const s of seeds) {
    if (!s.field_of_study || !s.program_url) continue;
    if (!FIELDS.includes(s.field_of_study)) continue;
    const key = `${s.field_of_study}|${s.program_url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      university: args.university, country: args.country, city: args.city,
      qs_ranking: args.qs_ranking,
      field_of_study: s.field_of_study, program_url: s.program_url,
    });
  }
  console.error(`[crawl] -> ${out.length} seeds for ${args.university}`);
  return out;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1); }
  const argv = process.argv.slice(2);
  const get = (k: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };

  const batchPath = get("batch");
  const outPath = get("out") || join(__dirname, "seeds", "auto-generated.json");

  const all: SeedOut[] = [];
  if (batchPath) {
    const list: BatchEntry[] = JSON.parse(readFileSync(batchPath, "utf8"));
    for (const e of list) {
      try { all.push(...(await run(e))); }
      catch (err) { console.error(`[crawl] FAILED ${e.university}: ${err}`); }
    }
  } else {
    const e: BatchEntry = {
      university: get("university")!, country: get("country")!, city: get("city")!,
      qs_ranking: parseInt(get("qs") || "0", 10),
      catalog_url: get("catalog")!,
    };
    if (!e.university || !e.catalog_url) { console.error("Need --university and --catalog"); process.exit(1); }
    all.push(...(await run(e)));
  }

  const dir = dirname(outPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(outPath, JSON.stringify(all, null, 2));
  console.log(`Wrote ${all.length} seed entries -> ${outPath}`);
  if (_browser) await _browser.close();
}

main().catch(async (e) => { console.error(e); if (_browser) await _browser.close(); process.exit(1); });
