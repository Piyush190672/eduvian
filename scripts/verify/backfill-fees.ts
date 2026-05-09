/**
 * backfill-fees.ts
 *
 * Re-extract tuition and living-cost fees for entries in src/data/programs.ts
 * that currently have null tuition. Cheaper per-entry than re-running
 * verify-program because the prompt only asks for 4 fields (amount + currency
 * for tuition + living), and we keep all other fields intact.
 *
 * Pipeline per entry:
 *   1. Fetch program_url with the same tab-click / fees-subpage logic
 *      verify-program.ts uses (imported indirectly by spawning verify-program
 *      would re-extract everything; instead this script copies the fetcher).
 *   2. Send a small prompt to Opus 4.7 asking only for fee fields.
 *   3. If a fee is recovered, write it inline into the entry's source text
 *      (parse-and-emit per CLAUDE.md hard rule #5).
 *   4. Persist programs.ts incrementally so a kill mid-run doesn't lose work.
 *
 * Usage:
 *   npx tsx scripts/verify/backfill-fees.ts [--limit N] [--country C] [--concurrency N]
 *
 *   --limit       cap the number of entries to process (default: all null-fee)
 *   --country     restrict to one country (e.g. "UK") — useful for spot tests
 *   --concurrency number of pages in flight at once (default: 4)
 *   --dry         print would-update entries without writing
 */
import { readFileSync, writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { Browser, BrowserContext } from "playwright";

const PROGRAMS_PATH = "/Users/piyushkumar/Playground/eduvian/src/data/programs.ts";

// FX_TO_USD: same table as verify-program.ts (mid-market 8 May 2026).
const FX_TO_USD: Record<string, number> = {
  USD: 1.00, GBP: 1.27, EUR: 1.08,
  CAD: 0.73, AUD: 0.65, NZD: 0.60,
  SGD: 0.74, MYR: 0.21, AED: 0.27,
  INR: 0.012, CHF: 1.13, JPY: 0.0064, CNY: 0.14,
};

// ── Argument parsing ───────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const argLimit = (() => { const i = argv.indexOf("--limit"); return i >= 0 ? parseInt(argv[i + 1], 10) : Infinity; })();
const argCountry = (() => { const i = argv.indexOf("--country"); return i >= 0 ? argv[i + 1] : null; })();
const argConc = (() => { const i = argv.indexOf("--concurrency"); return i >= 0 ? parseInt(argv[i + 1], 10) : 4; })();
const argDry = argv.includes("--dry");

// ── Browser setup (mirror verify-program.ts) ──────────────────────────────
let _browser: Browser | null = null;
async function getBrowser(): Promise<Browser> {
  if (_browser) return _browser;
  const { chromium: chromiumExtra } = await import("playwright-extra");
  const stealth = (await import("puppeteer-extra-plugin-stealth")).default();
  (chromiumExtra as unknown as { use(p: unknown): void }).use(stealth);
  _browser = (await chromiumExtra.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--disable-features=IsolateOrigins,site-per-process"],
  })) as Browser;
  return _browser;
}

function looksLikeUnderRendered(text: string): boolean {
  if (text.length < 800) return true;
  const lower = text.toLowerCase();
  return /just a moment|checking your browser|cloudflare|verifying you are human|ddos protection|enable javascript/.test(lower);
}

const stripHtml = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60_000);

async function fetchPage(url: string): Promise<string> {
  const browser = await getBrowser();
  const ctx: BrowserContext = await browser.newContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 1800 },
    locale: "en-US",
    extraHTTPHeaders: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-Ch-Ua": '"Chromium";v="127", "Not)A;Brand";v="99"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"macOS"',
      "Upgrade-Insecure-Requests": "1",
    },
  });
  await ctx.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    // @ts-expect-error - non-standard
    window.chrome = { runtime: {} };
  });
  const page = await ctx.newPage();
  await page.route("**/*", (route) => {
    const t = route.request().resourceType();
    if (t === "image" || t === "media" || t === "font") return route.abort();
    return route.continue();
  });
  try {
    try { await page.goto(url, { waitUntil: "networkidle", timeout: 8_000 }); }
    catch { await page.goto(url, { waitUntil: "domcontentloaded", timeout: 12_000 }); }
    await page.waitForTimeout(500);
    let stripped = stripHtml(await page.content());
    if (looksLikeUnderRendered(stripped)) {
      try { await page.waitForTimeout(5_000); } catch { /* */ }
      try { await page.waitForLoadState("networkidle", { timeout: 5_000 }); } catch { /* */ }
      stripped = stripHtml(await page.content());
    }
    const FEE_LABEL = /\b(?:fees?|tuition|tuition\s*fees?|fees?\s*&\s*funding|fees?\s*and\s*funding|cost\s*of\s*study|fees?\s*scholarships?)\b/i;
    let appended = "";
    try {
      const tabHandles = await page.$$eval('a, button, [role="tab"]', (nodes) =>
        nodes.map((n) => ({ text: (n as HTMLElement).innerText?.trim() ?? "" })).filter((x) => x.text.length > 0 && x.text.length < 60)
      );
      const tab = tabHandles.find((t) => FEE_LABEL.test(t.text));
      if (tab) {
        try {
          const loc = page.locator(`a:has-text("${tab.text}"), button:has-text("${tab.text}"), [role="tab"]:has-text("${tab.text}")`).first();
          await loc.click({ timeout: 3_000 });
          await page.waitForTimeout(1_500);
          const after = stripHtml(await page.content());
          if (after.length > stripped.length + 50) appended += "\n\n[FEES TAB CONTENT]\n" + after;
        } catch { /* */ }
      }
    } catch { /* */ }
    try {
      const origin = new URL(url).origin;
      const links = await page.$$eval("a[href]", (anchors) =>
        anchors.map((a) => ({ href: (a as HTMLAnchorElement).href, text: (a as HTMLElement).innerText?.trim() ?? "" }))
      );
      const feeLinks = links.filter((l) => {
        if (!l.href.startsWith("http")) return false;
        try { if (new URL(l.href).origin !== origin) return false; } catch { return false; }
        return FEE_LABEL.test(l.text) || /\/(fees?|tuition|funding|cost-of-study|cost-of-attendance|international-fees?)\b/i.test(l.href);
      }).slice(0, 2);
      for (const lnk of feeLinks) {
        try {
          const sub = await ctx.newPage();
          try {
            await sub.goto(lnk.href, { waitUntil: "domcontentloaded", timeout: 10_000 });
            await sub.waitForTimeout(1_000);
            const subStripped = stripHtml(await sub.content());
            if (subStripped.length > 200 && !looksLikeUnderRendered(subStripped)) {
              appended += `\n\n[FEES SUBPAGE: ${lnk.href}]\n` + subStripped.slice(0, 20_000);
            }
          } finally { await sub.close(); }
        } catch { /* */ }
      }
    } catch { /* */ }
    if (appended) stripped = (stripped + appended).slice(0, 80_000);
    return stripped;
  } finally {
    await page.close();
    await ctx.close();
  }
}

// ── Fee-only extractor prompt (cheaper than the full verify prompt) ──────
const FEE_PROMPT = (uni: string, country: string, programName: string, pageText: string) => `
You are extracting INTERNATIONAL student tuition and (if stated) living cost from a university program page.

UNIVERSITY: ${uni}
COUNTRY: ${country}
PROGRAM: ${programName}

PAGE CONTENT (text-only):
"""
${pageText}
"""

Return a single JSON object with these keys:

{
  "annual_tuition_amount": number | null,         // INTERNATIONAL / OVERSEAS / NON-RESIDENT student tuition only. Use the literal number on the page even if it's labelled "indicative", "approximate", "estimated", "from", "starting at", or "per year subject to review" — those qualifiers mean the figure is published, just not contractual. We want it. For multi-year totals (e.g. "AUD$94,484 total course fee" for a 2-year program), divide by the number of years to get the annual figure. NEVER pick the domestic/home/EU/in-state fee. UK pages: pick "Overseas"/"International" not "Home"/"UK". USA pages: pick "Out-of-state"/"International" not "In-state". Canada / Australia / NZ: pick "International" not "Domestic"/"Commonwealth supported". Germany / France / NL / Ireland: pick "Non-EU"/"International" if a separate higher fee exists; otherwise the single stated fee is fine. If only a domestic fee is shown, return null.
  "annual_tuition_currency": string | null,       // 3-letter ISO code (USD, GBP, EUR, CAD, AUD, NZD, SGD, MYR, AED, INR, CHF, JPY, CNY). Null only when amount is null.
  "annual_living_cost_amount": number | null,     // estimated annual living cost as literally stated on the page. Null if not stated.
  "annual_living_cost_currency": string | null,   // ISO code matching living cost amount.
  "notes": string                                 // 1 sentence on which figure was picked / why null
}

Return ONLY the JSON object, no prose, no code fences.
`;

interface FeeExtract {
  annual_tuition_amount: number | null;
  annual_tuition_currency: string | null;
  annual_living_cost_amount: number | null;
  annual_living_cost_currency: string | null;
  notes: string;
}

async function extractFees(client: Anthropic, uni: string, country: string, programName: string, pageText: string): Promise<FeeExtract | null> {
  try {
    const r = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 600,
      messages: [{ role: "user", content: FEE_PROMPT(uni, country, programName, pageText) }],
    });
    const text = r.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    return JSON.parse(m[0]) as FeeExtract;
  } catch (e) {
    console.warn(`  [extract error] ${(e as Error).message.slice(0, 100)}`);
    return null;
  }
}

function toUsd(amount: number | null, currency: string | null): number | null {
  if (typeof amount !== "number" || amount <= 0) return null;
  if (typeof currency !== "string") return null;
  const rate = FX_TO_USD[currency.toUpperCase()];
  if (rate === undefined) return null;
  return Math.round(amount * rate);
}

// ── Parse programs.ts and walk top-level objects ──────────────────────────
function loadEntries() {
  const text = readFileSync(PROGRAMS_PATH, "utf8");
  const arrOpen = text.indexOf("[", text.indexOf("PROGRAMS"));
  const arrClose = text.lastIndexOf("]) as ProgramEntry[]");
  const header = text.slice(0, arrOpen + 1);
  const trailer = text.slice(arrClose);
  const body = text.slice(arrOpen + 1, arrClose);

  const entries: { src: string; pre: string }[] = [];
  let depth = 0, start = -1, inStr = false, esc = false, lastEnd = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") { if (depth === 0) start = i; depth++; }
    else if (c === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        entries.push({ pre: body.slice(lastEnd, start), src: body.slice(start, i + 1) });
        lastEnd = i + 1;
        start = -1;
      }
    }
  }
  const tail = body.slice(lastEnd);
  return { header, trailer, entries, tail };
}

function emit(header: string, trailer: string, entries: { src: string; pre: string }[], tail: string): string {
  let out = header;
  for (const e of entries) out += e.pre + e.src;
  out += tail;
  out += trailer;
  return out;
}

function rewriteEntryFees(src: string, tuitionAmt: number | null, tuitionCcy: string | null, tuitionUsd: number | null, livingAmt: number | null, livingCcy: string | null, livingUsd: number | null): string {
  const replaceField = (s: string, field: string, value: string): string => {
    const re = new RegExp(`(${field}:\\s*)(?:"[^"]*"|null|\\d+(?:\\.\\d+)?)`, "g");
    if (re.test(s)) return s.replace(re, `$1${value}`);
    // Field absent — inject after annual_tuition_usd:
    return s.replace(/(annual_tuition_usd:\s*[^,]+,)/, `$1 ${field}: ${value},`);
  };
  let out = src;
  out = replaceField(out, "annual_tuition_usd", tuitionUsd != null ? String(tuitionUsd) : "null");
  out = replaceField(out, "annual_tuition_amount", tuitionAmt != null ? String(tuitionAmt) : "null");
  out = replaceField(out, "annual_tuition_currency", tuitionCcy ? `"${tuitionCcy}"` : "null");
  out = replaceField(out, "avg_living_cost_usd", livingUsd != null ? String(livingUsd) : "null");
  out = replaceField(out, "avg_living_cost_amount", livingAmt != null ? String(livingAmt) : "null");
  out = replaceField(out, "avg_living_cost_currency", livingCcy ? `"${livingCcy}"` : "null");
  return out;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1); }

  const { header, trailer, entries, tail } = loadEntries();
  console.log(`Loaded ${entries.length} entries.`);

  // Filter to entries with null tuition AND a program_url. Apply --country / --limit.
  const targets: { idx: number; uni: string; country: string; pname: string; url: string }[] = [];
  for (let i = 0; i < entries.length; i++) {
    const s = entries[i].src;
    const hasFee = /annual_tuition_(?:amount|usd):\s*\d+/.test(s);
    if (hasFee) continue;
    const uni = /university_name:\s*"([^"]+)"/.exec(s)?.[1];
    const country = /country:\s*"([^"]+)"/.exec(s)?.[1];
    const pname = /program_name:\s*"([^"]+)"/.exec(s)?.[1];
    const url = /program_url:\s*"([^"]+)"/.exec(s)?.[1];
    if (!uni || !country || !pname || !url) continue;
    if (argCountry && country !== argCountry) continue;
    targets.push({ idx: i, uni, country, pname, url });
    if (targets.length >= argLimit) break;
  }
  console.log(`${targets.length} entries to backfill.`);
  if (argDry) {
    targets.slice(0, 10).forEach((t) => console.log(`  [${t.idx}] ${t.country} | ${t.uni} | ${t.pname}`));
    process.exit(0);
  }

  const client = new Anthropic();
  let recovered = 0;
  let nullCount = 0;
  let errCount = 0;
  let saveCounter = 0;

  // Concurrency-bounded loop
  const workers: Promise<void>[] = [];
  let next = 0;
  const runOne = async () => {
    while (next < targets.length) {
      const i = next++;
      const t = targets[i];
      try {
        process.stdout.write(`[${i + 1}/${targets.length}] ${t.country} | ${t.uni} | ${t.pname.slice(0, 40)}\n`);
        const pageText = await fetchPage(t.url);
        if (pageText.length < 200) { nullCount++; continue; }
        const fees = await extractFees(client, t.uni, t.country, t.pname, pageText);
        if (!fees) { errCount++; continue; }
        const tUsd = toUsd(fees.annual_tuition_amount, fees.annual_tuition_currency);
        const lUsd = toUsd(fees.annual_living_cost_amount, fees.annual_living_cost_currency);
        if (tUsd != null || lUsd != null) {
          const e = entries[t.idx];
          e.src = rewriteEntryFees(
            e.src,
            fees.annual_tuition_amount,
            fees.annual_tuition_currency ? fees.annual_tuition_currency.toUpperCase() : null,
            tUsd,
            fees.annual_living_cost_amount,
            fees.annual_living_cost_currency ? fees.annual_living_cost_currency.toUpperCase() : null,
            lUsd,
          );
          recovered++;
          process.stdout.write(`  ✓ tuition=${fees.annual_tuition_amount ?? "null"} ${fees.annual_tuition_currency ?? ""} (USD ${tUsd ?? "null"})\n`);
          // Persist every 20 successes
          if (++saveCounter >= 20) {
            saveCounter = 0;
            writeFileSync(PROGRAMS_PATH, emit(header, trailer, entries, tail));
          }
        } else {
          nullCount++;
        }
      } catch (e) {
        errCount++;
        console.warn(`  [error] ${(e as Error).message.slice(0, 100)}`);
      }
    }
  };
  for (let w = 0; w < argConc; w++) workers.push(runOne());
  await Promise.all(workers);

  // Final write
  writeFileSync(PROGRAMS_PATH, emit(header, trailer, entries, tail));
  console.log(`\nRecovered: ${recovered}`);
  console.log(`Null:      ${nullCount}`);
  console.log(`Errors:    ${errCount}`);

  if (_browser) await _browser.close();
}

main();
