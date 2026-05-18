/**
 * estimate-durations.ts  —  A1 stage of the duration-completeness fix
 *                           (17 May 2026)
 *
 * After scripts/data-fixes/backfill-durations.py (heuristic stage),
 * a small residual of programs still has duration_months: null —
 * specifically the 148 entries whose degree_level field is missing,
 * so the heuristic rule table couldn't fire.
 *
 * This script uses Sonnet + web_search to extract the duration_months
 * directly from each program's published URL. Single-number extraction
 * is cheap and high-confidence — duration is usually stated prominently
 * on every program page.
 *
 * Output tagged `duration_source: "extracted"` so the UI can show this
 * differently from the heuristic backfill (which uses
 * `duration_source: "heuristic"`).
 *
 * Usage:
 *   npx tsx scripts/verify/estimate-durations.ts [--limit N] [--country C] [--concurrency N]
 *
 * Required env: ANTHROPIC_API_KEY
 *
 * Mirrors estimate-fees.ts' pattern: signal-flush, brace-walker parse,
 * worker concurrency, save-every-5 cadence.
 */
import { readFileSync, writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";

const PROGRAMS_PATH = "/Users/piyushkumar/Playground/eduvian/src/data/programs.ts";

const argv = process.argv.slice(2);
const argLimit = (() => { const i = argv.indexOf("--limit"); return i >= 0 ? parseInt(argv[i + 1], 10) : Infinity; })();
const argCountry = (() => { const i = argv.indexOf("--country"); return i >= 0 ? argv[i + 1] : null; })();
const argConc = (() => { const i = argv.indexOf("--concurrency"); return i >= 0 ? parseInt(argv[i + 1], 10) : 4; })();
const argDry = argv.includes("--dry");

const PROMPT = (uni: string, country: string, programName: string, programUrl: string): string => `
You are extracting the published DURATION (in months) of a study-abroad program.

UNIVERSITY: ${uni}
COUNTRY: ${country}
PROGRAM: ${programName}
PROGRAM URL: ${programUrl}

Use the web_search tool. Visit the program URL first; if the duration isn't on that page, search for "${programName} ${uni} duration months" or check the university's structured programs / catalog page.

Hard rules:
  - Duration in MONTHS (integer). For "2 years" return 24. For "18 months" return 18. For "1.5 years" return 18.
  - FULL-TIME duration if both full-time and part-time are listed.
  - Standard / typical duration — ignore accelerated, with-placement, or extended variants unless the program name explicitly says so.
  - For PhDs without a fixed length, return the nominal program length (typically 48 in UK/AU, 60 in USA).
  - If the page lists a range ("2-3 years"), return the minimum.
  - If you cannot find the duration on a credible source, return null.

Return ONLY a JSON object:
{
  "duration_months": number | null,
  "sources": [string],
  "confidence": "high" | "medium" | "low" | "none",
  "notes": string
}

Set duration_months to null if confidence is "low" or "none".
`;

interface DurationEstimate {
  duration_months: number | null;
  sources: string[];
  confidence: "high" | "medium" | "low" | "none";
  notes: string;
}

async function estimate(client: Anthropic, uni: string, country: string, programName: string, programUrl: string): Promise<DurationEstimate | null> {
  try {
    const r = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 } as unknown as Anthropic.Messages.Tool],
      messages: [{ role: "user", content: PROMPT(uni, country, programName, programUrl) }],
    });
    const text = r.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    return JSON.parse(m[0]) as DurationEstimate;
  } catch (e) {
    console.warn(`  [estimate error] ${(e as Error).message.slice(0, 100)}`);
    return null;
  }
}

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

function rewriteEntryDuration(src: string, months: number): string {
  let out = src;
  // Replace null with the new number.
  out = out.replace(/duration_months:\s*null/, `duration_months: ${months}`);
  // Add or set duration_source: "extracted".
  if (/duration_source:\s*"[^"]+"/.test(out)) {
    out = out.replace(/duration_source:\s*"[^"]+"/, `duration_source: "extracted"`);
  } else {
    out = out.replace(/(duration_months:\s*\d+)/, `$1, duration_source: "extracted"`);
  }
  return out;
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
  console.warn(`\n[${sig}] flushing in-memory durations to disk before exit…`);
  try { flushOnExit?.(); console.warn("[flushed]"); }
  catch (e) { console.error("[flush failed]", (e as Error).message); }
  process.exit(sig === "SIGINT" ? 130 : 143);
};
process.on("SIGTERM", () => handleSignal("SIGTERM"));
process.on("SIGINT", () => handleSignal("SIGINT"));

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1); }

  const { header, trailer, entries, tail } = loadEntries();
  console.log(`Loaded ${entries.length} entries.`);
  flushOnExit = () => writeFileSync(PROGRAMS_PATH, emit(header, trailer, entries, tail));

  const targets: { idx: number; uni: string; country: string; pname: string; url: string }[] = [];
  for (let i = 0; i < entries.length; i++) {
    const s = entries[i].src;
    if (!/duration_months:\s*null/.test(s)) continue;          // already has duration
    if (/duration_source:\s*"extracted"/.test(s)) continue;    // already attempted; skip on rerun
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
    targets.slice(0, 20).forEach((t) => console.log(`  [${t.idx}] ${t.country} | ${t.uni} | ${t.pname}`));
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
        const est = await Promise.race<DurationEstimate | null>([
          estimate(client, t.uni, t.country, t.pname, t.url),
          new Promise<null>((r) => setTimeout(() => r(null), 90_000)),
        ]);
        if (!est) { errCount++; continue; }
        if (!est.duration_months || est.duration_months <= 0 || (est.confidence !== "high" && est.confidence !== "medium")) {
          lowSkip++;
          continue;
        }
        const e = entries[t.idx];
        e.src = rewriteEntryDuration(e.src, est.duration_months);
        if (est.confidence === "high") highOk++; else mediumOk++;
        process.stdout.write(`  ✓ ${est.confidence} ${est.duration_months} mo — ${est.sources.length} sources\n`);
        if (++saveCounter >= 5) {
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
  console.log(`Low / skip:        ${lowSkip}`);
  console.log(`Errors:            ${errCount}`);
}

main();
