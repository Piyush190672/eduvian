/**
 * estimate-fees.ts  —  Layer 2 of the fee-completeness fix (10 May 2026)
 *
 * For programs whose annual_tuition_amount is still null after the
 * verified-source backfill (`backfill-fees.ts`), use Sonnet + web_search to
 * find the INTERNATIONAL tuition figure from credible secondary sources:
 *   - the university's central / department fees page (different URL from
 *     the program-detail page)
 *   - ranking aggregators (QS Top Universities, Times Higher Ed, U.S. News)
 *   - country-level accreditation / ministry pages
 *   - reputable study-abroad portals when they cite the official figure
 *
 * Hard rules (mirrors verify-program.ts intent):
 *   - INTERNATIONAL / OVERSEAS / NON-RESIDENT student fee only — never the
 *     domestic / home / EU / in-state figure.
 *   - At least TWO independent sources must agree, OR a single highly-credible
 *     source (uni's own central fees page or QS / THE) must state it cleanly.
 *   - Quote the URL(s) the figure came from in the output for audit.
 *   - Tag entry as `tuition_fee_source: "estimated"` so the UI flags it.
 *   - If no credible figure can be found, leave null. Bad data is worse than
 *     no data.
 *
 * Usage:
 *   npx tsx scripts/verify/estimate-fees.ts [--limit N] [--country C] [--concurrency N]
 *
 *   --limit       cap entries to process (default: all null-tuition)
 *   --country     restrict to one country
 *   --concurrency parallel queries (default 4 — Sonnet web_search has rate limits)
 *   --dry         list candidates without spending API budget
 */
import { readFileSync, writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";

const PROGRAMS_PATH = "/Users/piyushkumar/Playground/eduvian/src/data/programs.ts";

const FX_TO_USD: Record<string, number> = {
  USD: 1.00, GBP: 1.27, EUR: 1.08,
  CAD: 0.73, AUD: 0.65, NZD: 0.60,
  SGD: 0.74, MYR: 0.21, AED: 0.27,
  INR: 0.012, CHF: 1.13, JPY: 0.0064, CNY: 0.14,
};

const argv = process.argv.slice(2);
const argLimit = (() => { const i = argv.indexOf("--limit"); return i >= 0 ? parseInt(argv[i + 1], 10) : Infinity; })();
const argCountry = (() => { const i = argv.indexOf("--country"); return i >= 0 ? argv[i + 1] : null; })();
const argConc = (() => { const i = argv.indexOf("--concurrency"); return i >= 0 ? parseInt(argv[i + 1], 10) : 4; })();
const argDry = argv.includes("--dry");

const PROMPT = (uni: string, country: string, programName: string, programUrl: string) => `
You are estimating INTERNATIONAL student tuition for a postgraduate / undergraduate program at a specific university. The official program page itself didn't expose a fee, so you'll search for it from credible secondary sources.

PROGRAM:    ${programName}
UNIVERSITY: ${uni}
COUNTRY:    ${country}
PROGRAM URL: ${programUrl}

Use the web_search tool. Prefer in priority order:
  1. The university's CENTRAL fees page (e.g., "<uni>.edu/fees", "<uni>.ac.uk/study/fees", "<uni>.de/studieninteressierte/gebuhren") — most authoritative.
  2. The university's department / school fees page (one level above the program-detail URL).
  3. QS Top Universities, Times Higher Education, US News, or similar ranking aggregators when they cite an official figure.
  4. The country's accreditation / ministry of education pages.
  5. Reputable study-abroad portals (Shiksha, Yocket, MastersPortal) only as a last resort and only if they quote the official figure.

NEVER use:
  - Reddit, Quora, blog posts, forums.
  - The program detail page itself (already tried; doesn't have the figure).
  - Domestic / home / EU / in-state figures.

Hard rules:
  - INTERNATIONAL / OVERSEAS / NON-RESIDENT student tuition only. UK = "Overseas"; USA = "Out-of-state" or "International"; Canada / Australia / NZ = "International"; EU unis = "Non-EU" if separate.
  - Annual figure. For multi-year totals (e.g. "AUD$94,484 for 2 years"), divide.
  - "Indicative" / "approximate" / "estimated" / "from" labels are valid — use the figure.
  - At least TWO independent sources must agree on a number within 10% of each other, OR a single source must be the university's own central fees page. Otherwise return null.
  - Cite the source URL(s) you used.

Return ONLY a JSON object:
{
  "annual_tuition_amount": number | null,
  "annual_tuition_currency": string | null,
  "sources": [string],
  "confidence": "high" | "medium" | "low" | "none",
  "notes": string
}

If confidence is "low" or "none", set amount/currency to null. We don't write low-confidence figures to the database.
`;

interface FeeEstimate {
  annual_tuition_amount: number | null;
  annual_tuition_currency: string | null;
  sources: string[];
  confidence: "high" | "medium" | "low" | "none";
  notes: string;
}

async function estimate(client: Anthropic, uni: string, country: string, programName: string, programUrl: string): Promise<FeeEstimate | null> {
  try {
    const r = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 } as unknown as Anthropic.Messages.Tool],
      messages: [{ role: "user", content: PROMPT(uni, country, programName, programUrl) }],
    });
    const text = r.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    return JSON.parse(m[0]) as FeeEstimate;
  } catch (e) {
    console.warn(`  [estimate error] ${(e as Error).message.slice(0, 100)}`);
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

// Parse programs.ts via the same brace walker pattern (CLAUDE.md hard rule #5).
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
  return { header, trailer, entries, tail: body.slice(lastEnd) };
}

function emit(header: string, trailer: string, entries: { src: string; pre: string }[], tail: string): string {
  let out = header;
  for (const e of entries) out += e.pre + e.src;
  return out + tail + trailer;
}

function rewriteEntryFees(src: string, tuitionAmt: number, tuitionCcy: string, tuitionUsd: number): string {
  const replaceField = (s: string, field: string, value: string): string => {
    const re = new RegExp(`(${field}:\\s*)(?:"[^"]*"|null|\\d+(?:\\.\\d+)?)`, "g");
    if (re.test(s)) return s.replace(re, `$1${value}`);
    return s.replace(/(annual_tuition_usd:\s*[^,]+,)/, `$1 ${field}: ${value},`);
  };
  let out = src;
  out = replaceField(out, "annual_tuition_usd", String(tuitionUsd));
  out = replaceField(out, "annual_tuition_amount", String(tuitionAmt));
  out = replaceField(out, "annual_tuition_currency", `"${tuitionCcy}"`);
  // Inject the tuition_fee_source flag (or update if already present).
  if (/tuition_fee_source:\s*"[^"]+"/.test(out)) {
    out = out.replace(/tuition_fee_source:\s*"[^"]+"/, `tuition_fee_source: "estimated"`);
  } else {
    out = out.replace(/(annual_tuition_currency:\s*[^,]+,)/, `$1 tuition_fee_source: "estimated",`);
  }
  return out;
}

process.on("unhandledRejection", (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.warn(`[unhandledRejection swallowed] ${msg.slice(0, 200)}`);
});

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1); }

  const { header, trailer, entries, tail } = loadEntries();
  console.log(`Loaded ${entries.length} entries.`);

  // Targets: entries with no tuition AND a program_url AND no prior estimate.
  const targets: { idx: number; uni: string; country: string; pname: string; url: string }[] = [];
  for (let i = 0; i < entries.length; i++) {
    const s = entries[i].src;
    if (/annual_tuition_(?:amount|usd):\s*\d+/.test(s)) continue; // already has fee
    if (/tuition_fee_source:\s*"estimated"/.test(s)) continue;    // already attempted estimate; skip on rerun
    const uni = /university_name:\s*"([^"]+)"/.exec(s)?.[1];
    const country = /country:\s*"([^"]+)"/.exec(s)?.[1];
    const pname = /program_name:\s*"([^"]+)"/.exec(s)?.[1];
    const url = /program_url:\s*"([^"]+)"/.exec(s)?.[1];
    if (!uni || !country || !pname || !url) continue;
    if (argCountry && country !== argCountry) continue;
    targets.push({ idx: i, uni, country, pname, url });
    if (targets.length >= argLimit) break;
  }
  console.log(`${targets.length} entries to estimate.`);
  if (argDry) {
    targets.slice(0, 10).forEach((t) => console.log(`  [${t.idx}] ${t.country} | ${t.uni} | ${t.pname}`));
    process.exit(0);
  }

  const client = new Anthropic();
  let highOk = 0, mediumOk = 0, lowSkip = 0, errCount = 0;
  let saveCounter = 0;
  let next = 0;
  const runOne = async () => {
    while (next < targets.length) {
      const i = next++;
      const t = targets[i];
      try {
        process.stdout.write(`[${i + 1}/${targets.length}] ${t.country} | ${t.uni.slice(0, 30)} | ${t.pname.slice(0, 40)}\n`);
        const est = await Promise.race<FeeEstimate | null>([
          estimate(client, t.uni, t.country, t.pname, t.url),
          new Promise<null>((r) => setTimeout(() => r(null), 90_000)),
        ]);
        if (!est) { errCount++; continue; }
        const usd = toUsd(est.annual_tuition_amount, est.annual_tuition_currency);
        if (!usd || (est.confidence !== "high" && est.confidence !== "medium")) {
          lowSkip++;
          continue;
        }
        const e = entries[t.idx];
        e.src = rewriteEntryFees(e.src, est.annual_tuition_amount as number, (est.annual_tuition_currency as string).toUpperCase(), usd);
        if (est.confidence === "high") highOk++; else mediumOk++;
        process.stdout.write(`  ✓ ${est.confidence} ${est.annual_tuition_amount} ${est.annual_tuition_currency} (USD ${usd}) — ${est.sources.length} sources\n`);
        if (++saveCounter >= 20) {
          saveCounter = 0;
          writeFileSync(PROGRAMS_PATH, emit(header, trailer, entries, tail));
        }
      } catch (e) {
        errCount++;
        console.warn(`  [worker error] ${(e as Error).message.slice(0, 100)}`);
      }
    }
  };
  const workers: Promise<void>[] = [];
  for (let w = 0; w < argConc; w++) workers.push(runOne());
  await Promise.all(workers);

  writeFileSync(PROGRAMS_PATH, emit(header, trailer, entries, tail));
  console.log(`\nHigh-confidence:   ${highOk}`);
  console.log(`Medium-confidence: ${mediumOk}`);
  console.log(`Low/none (skipped):${lowSkip}`);
  console.log(`Errors:            ${errCount}`);
  console.log(`Total written:     ${highOk + mediumOk}`);
}

main();
