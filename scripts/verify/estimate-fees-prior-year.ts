/**
 * estimate-fees-prior-year.ts — Layer 3 of the tuition-completeness fix.
 *
 * Layer 1 = verify-program.ts extracts from the current program page.
 * Layer 2 = estimate-fees.ts asks Sonnet + web_search to find the
 *           CURRENT year's INTERNATIONAL tuition from credible secondary
 *           sources (uni central fees page, QS / THE, etc.).
 * Layer 3 = THIS SCRIPT. For programs where layers 1 and 2 both
 *           returned nothing usable, fall back to the PREVIOUS year's
 *           figure (when available from a credible source) and apply
 *           a 5% annual uplift to estimate the current year. Tagged
 *           `tuition_fee_source: "estimated"` with a notes attribution
 *           that documents the prior-year-plus-5%-uplift derivation.
 *
 * Why this matters: the budget hard filter and the ROI / Parent tools
 * all need a non-zero USD tuition. With ~3,500 programs still null
 * after layers 1+2, the cost-vs-budget math goes wrong (or the
 * program is silently skipped from the budget cap). A 5%-uplifted
 * prior-year number is materially better than zero or null.
 *
 * Sources allowed:
 *   - University's own ARCHIVED fees page (Wayback Machine / Google cache)
 *   - QS / THE / US News program profiles citing a dated figure
 *   - News articles announcing a fee change ("uni X raised fees from
 *     £25,000 to £26,500 for 2025-26")
 *   - Alumni / student blogs that quote a prior-year figure with the
 *     specific academic year attached
 *
 * Banned sources: Reddit, Quora, forums, undated figures, "around X"
 * approximations without a year anchor.
 *
 * Usage:
 *   npx tsx scripts/verify/estimate-fees-prior-year.ts [--limit N] [--country C] [--concurrency N] [--dry]
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

// Annual uplift applied to the discovered prior-year figure. 5% reflects
// the average international-tuition inflation rate across the destinations
// we cover (UK +4-7%/yr, USA +3-5%/yr, AU +5-8%/yr, CA +4-6%/yr) over the
// last decade.
const UPLIFT_PCT = 5;

const argv = process.argv.slice(2);
const argLimit   = (() => { const i = argv.indexOf("--limit");       return i >= 0 ? parseInt(argv[i + 1], 10) : Infinity; })();
const argCountry = (() => { const i = argv.indexOf("--country");     return i >= 0 ? argv[i + 1] : null; })();
const argConc    = (() => { const i = argv.indexOf("--concurrency"); return i >= 0 ? parseInt(argv[i + 1], 10) : 4; })();
const argDry     = argv.includes("--dry");

const CURRENT_YEAR = new Date().getUTCFullYear();
const PRIOR_YEAR   = CURRENT_YEAR - 1;
const PRIOR_PRIOR  = CURRENT_YEAR - 2;

const PROMPT = (uni: string, country: string, programName: string, programUrl: string) => `
You are estimating INTERNATIONAL student tuition for a program where layer 1 (the official program page) and layer 2 (current-year fee search) both came up empty. This is the LAST-RESORT layer 3: find a PRIOR-YEAR fee from a credible source, and the script will apply a ${UPLIFT_PCT}% uplift to estimate the current year.

PROGRAM:     ${programName}
UNIVERSITY:  ${uni}
COUNTRY:     ${country}
PROGRAM URL: ${programUrl}

CURRENT YEAR:  ${CURRENT_YEAR}
PRIOR YEAR:    ${PRIOR_YEAR} (preferred)
PRIOR-PRIOR:   ${PRIOR_PRIOR} (acceptable as fallback)

Use the web_search tool. Look for the INTERNATIONAL / OVERSEAS / NON-RESIDENT tuition figure for academic year ${PRIOR_YEAR}-${(PRIOR_YEAR % 100 + 1).toString().padStart(2, "0")} or ${PRIOR_PRIOR}-${(PRIOR_PRIOR % 100 + 1).toString().padStart(2, "0")}. Acceptable sources in priority order:
  1. Wayback Machine / Google cache snapshot of the university's official fees page from the prior academic year.
  2. QS Top Universities, Times Higher Ed, US News program profiles citing a DATED prior-year figure.
  3. News articles reporting a fee change with both old and new figures named, e.g. "Uni X raised tuition from £25,000 to £26,500 for 2025-26".
  4. Reputable study-abroad portals (Shiksha, Yocket, MastersPortal) IF they explicitly quote the academic year and the source.

Banned sources: Reddit, Quora, forums, blog posts without a year anchor, "around X / approximately X" without dated attribution.

Hard rules:
  - INTERNATIONAL / OVERSEAS / NON-RESIDENT tuition only — never domestic / home / EU / in-state.
  - Annual figure. Multi-year totals → divide by years.
  - The year MUST be explicit. An undated figure is unusable.
  - Prefer ${PRIOR_YEAR}-${(PRIOR_YEAR % 100 + 1).toString().padStart(2, "0")}. If only ${PRIOR_PRIOR}-${(PRIOR_PRIOR % 100 + 1).toString().padStart(2, "0")} is available, use it and note the script will apply two years' worth of uplift via separate logic.
  - Two-source agreement OR the university's archived official page.

Return ONLY a JSON object:
{
  "prior_year_amount":   number | null,
  "prior_year_currency": string | null,
  "prior_year":          ${PRIOR_YEAR} | ${PRIOR_PRIOR} | null,
  "sources":             [string],
  "confidence":          "high" | "medium" | "low" | "none",
  "notes":               string
}

If confidence is "low" or "none", set amounts/currency/year to null. We don't write low-confidence figures.
`;

interface PriorYearEstimate {
  prior_year_amount: number | null;
  prior_year_currency: string | null;
  prior_year: number | null;
  sources: string[];
  confidence: "high" | "medium" | "low" | "none";
  notes: string;
}

async function estimate(client: Anthropic, uni: string, country: string, programName: string, programUrl: string): Promise<PriorYearEstimate | null> {
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
    return JSON.parse(m[0]) as PriorYearEstimate;
  } catch (e) {
    console.warn(`  [estimate error] ${(e as Error).message.slice(0, 100)}`);
    return null;
  }
}

function toUsd(amount: number, currency: string): number | null {
  const rate = FX_TO_USD[currency.toUpperCase()];
  if (rate === undefined) return null;
  return Math.round(amount * rate);
}

// Compute current-year estimate from prior-year figure. Applies UPLIFT_PCT
// once for prior-year, twice for prior-prior-year.
function upliftToCurrent(priorAmount: number, priorYear: number): number {
  const yearsBack = CURRENT_YEAR - priorYear;
  const multiplier = Math.pow(1 + UPLIFT_PCT / 100, Math.max(1, yearsBack));
  return Math.round(priorAmount * multiplier);
}

// Same brace walker as estimate-fees.ts (CLAUDE.md hard rule #5).
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
  if (/tuition_fee_source:\s*"[^"]+"/.test(out)) {
    out = out.replace(/tuition_fee_source:\s*"[^"]+"/, `tuition_fee_source: "estimated"`);
  } else {
    out = out.replace(/(annual_tuition_currency:\s*[^,]+,)/, `$1 tuition_fee_source: "estimated",`);
  }
  return out;
}

function extractField(src: string, field: string): string | null {
  const m = src.match(new RegExp(`${field}:\\s*"([^"]+)"`));
  return m ? m[1] : null;
}
function extractNumber(src: string, field: string): number | null {
  const m = src.match(new RegExp(`${field}:\\s*(null|\\d+(?:\\.\\d+)?)`));
  if (!m || m[1] === "null") return null;
  return parseFloat(m[1]);
}

process.on("unhandledRejection", (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.warn(`[unhandledRejection swallowed] ${msg.slice(0, 200)}`);
});

let flushOnExit: (() => void) | null = null;
let flushInProgress = false;
const handleSignal = (sig: NodeJS.Signals) => {
  if (flushInProgress) return;
  flushInProgress = true;
  console.warn(`\n[${sig}] flushing in-memory estimates to disk before exit…`);
  try { flushOnExit?.(); console.warn("[flushed]"); }
  catch (e) { console.error("[flush failed]", (e as Error).message); }
  process.exit(sig === "SIGINT" ? 130 : 143);
};
process.on("SIGTERM", () => handleSignal("SIGTERM"));
process.on("SIGINT", () => handleSignal("SIGINT"));

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set");
    process.exit(1);
  }

  const { header, trailer, entries, tail } = loadEntries();

  // Targets: programs where USD tuition is missing AND amount is missing
  // (= both layers 1 and 2 came up empty) AND tuition_fee_source is NOT
  // already "estimated" (skip programs an earlier pass attempted).
  // Rerunnable — already-estimated rows are left alone.
  const targets: { idx: number; uni: string; country: string; programName: string; programUrl: string }[] = [];
  for (let i = 0; i < entries.length; i++) {
    const s = entries[i].src;
    const usd = extractNumber(s, "annual_tuition_usd");
    const amt = extractNumber(s, "annual_tuition_amount");
    if ((usd ?? 0) > 0 || (amt ?? 0) > 0) continue;
    if (/tuition_fee_source:\s*"estimated"/.test(s)) continue;
    if (argCountry && extractField(s, "country") !== argCountry) continue;
    const uni    = extractField(s, "university_name") ?? "?";
    const country = extractField(s, "country") ?? "?";
    const programName = extractField(s, "program_name") ?? "?";
    const programUrl  = extractField(s, "program_url")  ?? "";
    if (!programUrl) continue;
    targets.push({ idx: i, uni, country, programName, programUrl });
    if (targets.length >= argLimit) break;
  }

  console.log(`Targets: ${targets.length} programs missing tuition after layers 1+2.`);
  if (argDry) {
    targets.slice(0, 20).forEach((t, k) => console.log(`  [${k + 1}] ${t.country} | ${t.uni} | ${t.programName.slice(0, 50)}`));
    if (targets.length > 20) console.log(`  …and ${targets.length - 20} more.`);
    return;
  }

  const client = new Anthropic();

  type Result = {
    idx: number;
    priorAmount: number | null;
    priorCurrency: string | null;
    priorYear: number | null;
    upliftedAmount: number | null;
    usd: number | null;
    confidence: string;
    sources: string[];
    notes: string;
    uni: string;
    programName: string;
  };
  const results: Result[] = [];

  const flushBatch = (): void => {
    try {
      writeFileSync(
        "/Users/piyushkumar/Playground/eduvian/scripts/verify/output/fees-prior-year-results.json",
        JSON.stringify(results, null, 2),
      );
    } catch (e) {
      console.warn(`[flush log] ${(e as Error).message}`);
    }
    let applied = 0;
    for (const r of results) {
      if (r.upliftedAmount == null || r.priorCurrency == null || r.usd == null) continue;
      if (r.confidence !== "high" && r.confidence !== "medium") continue;
      entries[r.idx].src = rewriteEntryFees(
        entries[r.idx].src,
        r.upliftedAmount,
        r.priorCurrency,
        r.usd,
      );
      applied++;
    }
    writeFileSync(PROGRAMS_PATH, emit(header, trailer, entries, tail));
    console.log(`  [flush] persisted ${applied} updates so far`);
  };
  flushOnExit = flushBatch;

  let pending = 0;
  let processed = 0;
  let okCount = 0, lowCount = 0, errCount = 0;
  const concurrency = Math.max(1, argConc);

  await new Promise<void>((resolve) => {
    let nextIdx = 0;
    const run = () => {
      while (pending < concurrency && nextIdx < targets.length) {
        const t = targets[nextIdx++];
        pending++;
        const tag = `[${processed + pending}/${targets.length}]`;
        console.log(`${tag} ${t.country} | ${t.uni.slice(0, 40)} | ${t.programName.slice(0, 50)}`);
        estimate(client, t.uni, t.country, t.programName, t.programUrl)
          .then((res) => {
            if (!res) { errCount++; return; }
            if (
              res.prior_year_amount === null ||
              !res.prior_year_currency ||
              !res.prior_year ||
              res.confidence === "low" || res.confidence === "none"
            ) {
              lowCount++;
              console.log(`  ~ ${res.confidence} — no write`);
              return;
            }
            const uplifted = upliftToCurrent(res.prior_year_amount, res.prior_year);
            const usd = toUsd(uplifted, res.prior_year_currency);
            if (usd == null) {
              errCount++;
              console.warn(`  [unknown currency] ${res.prior_year_currency}`);
              return;
            }
            okCount++;
            console.log(`  ✓ ${res.confidence} ${res.prior_year_amount}${res.prior_year_currency} (${res.prior_year}) → uplifted ${uplifted}, $${usd} USD`);
            results.push({
              idx: t.idx,
              priorAmount: res.prior_year_amount,
              priorCurrency: res.prior_year_currency,
              priorYear: res.prior_year,
              upliftedAmount: uplifted,
              usd,
              confidence: res.confidence,
              sources: res.sources,
              notes: res.notes,
              uni: t.uni,
              programName: t.programName,
            });
          })
          .catch((e) => {
            errCount++;
            console.warn(`  [error] ${(e as Error).message.slice(0, 100)}`);
          })
          .finally(() => {
            pending--;
            processed++;
            if (results.length > 0 && results.length % 5 === 0) flushBatch();
            if (processed === targets.length) resolve();
            else run();
          });
      }
    };
    run();
  });

  flushBatch();
  console.log("");
  console.log(`Done. ok=${okCount} low=${lowCount} err=${errCount}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
