/**
 * estimate-mba-work-exp.ts  —  targeted work-exp backfill for MBA programs
 *
 * Today's matching change (ad8eb36b) made MBA work-experience a HARD
 * filter, but 224 of 440 MBA programs in programs.ts carry null for
 * work_exp_required_years. Without the data the hard filter quietly
 * skips, and students see MBAs they may not qualify for.
 *
 * This pass uses Sonnet + web_search to find the PUBLISHED minimum
 * work-experience requirement for each null-MBA program from credible
 * sources:
 *   - the program's admissions / eligibility page
 *   - the university's MBA brochure / class profile
 *   - QS / TopMBA / Bloomberg / Financial Times program profiles
 *   - the university's central graduate-business-school admissions page
 *
 * Hard rules (mirror estimate-fees.ts):
 *   - MINIMUM stated requirement only — not "average years among the
 *     incoming class". A class average of 5 years doesn't mean the
 *     program requires 5 years; it means accepted candidates averaged
 *     5 years. We want the stated MINIMUM.
 *   - "Recommended" / "preferred" / "typically" language qualifies as a
 *     minimum if the source treats it as a floor; "0 to 3 years" or
 *     "open to recent graduates" → minimum is 0.
 *   - If no credible figure can be found OR the source is ambiguous,
 *     leave null. Bad data is worse than no data.
 *   - Two independent sources must agree, OR the university's own
 *     admissions page must state it cleanly.
 *
 * Usage:
 *   npx tsx scripts/verify/estimate-mba-work-exp.ts [--limit N] [--country C] [--concurrency N] [--dry]
 */
import { readFileSync, writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";

const PROGRAMS_PATH = "/Users/piyushkumar/Playground/eduvian/src/data/programs.ts";
const RESULTS_LOG   = "/Users/piyushkumar/Playground/eduvian/scripts/verify/output/mba-work-exp-results.json";

const argv = process.argv.slice(2);
const argLimit   = (() => { const i = argv.indexOf("--limit");      return i >= 0 ? parseInt(argv[i + 1], 10) : Infinity; })();
const argCountry = (() => { const i = argv.indexOf("--country");    return i >= 0 ? argv[i + 1] : null; })();
const argConc    = (() => { const i = argv.indexOf("--concurrency");return i >= 0 ? parseInt(argv[i + 1], 10) : 4; })();
const argDry     = argv.includes("--dry");

const PROMPT = (uni: string, country: string, programName: string, programUrl: string) => `
You are estimating the MINIMUM work-experience requirement for an MBA / EMBA / Master-in-Management program. The official program page doesn't expose a clean number, or we never extracted it, so you'll search credible secondary sources.

PROGRAM:    ${programName}
UNIVERSITY: ${uni}
COUNTRY:    ${country}
PROGRAM URL: ${programUrl}

Use the web_search tool. Prefer in priority order:
  1. The university's admissions / eligibility page for THIS specific MBA program.
  2. The university's central business-school / MBA admissions page if it covers all MBA variants.
  3. The school's MBA brochure (PDF) or class-profile page.
  4. QS TopMBA, BusinessBecause, Financial Times MBA Ranking, Bloomberg Best B-Schools, Poets & Quants — for the program-specific entry.
  5. Reputable MBA admissions consultants (mbaMission, Stacy Blackman, Menlo Coaching) ONLY if they cite the school's own stated minimum.

NEVER use:
  - Reddit, Quora, blog posts, forums, college-confidential.
  - Class AVERAGE years (e.g. "average 5 years' experience in the class") — that's a descriptive stat, not the minimum requirement.
  - One-MBA-coach's opinion of what you "should" have.

Hard rules:
  - Report the MINIMUM stated requirement, in whole years.
  - "0 to 3 years" / "open to recent graduates" / "no minimum required" → 0.
  - "Recommended 2+ years" → 2.
  - "Minimum 5 years" → 5.
  - "Typical 3-5 years" with no floor → 3 (low end).
  - Different program variants at the same school may have different floors (e.g. one-year MBA vs EMBA) — use the floor for THIS program (match programName).
  - At least TWO independent sources must agree, OR the university's own admissions page must state it cleanly. Otherwise return null with confidence=low.

Return ONLY a JSON object:
{
  "work_exp_required_years": number | null,
  "sources": [string],
  "confidence": "high" | "medium" | "low" | "none",
  "notes": string
}

If confidence is "low" or "none", set work_exp_required_years to null. We don't write low-confidence values.
`;

interface MbaExpEstimate {
  work_exp_required_years: number | null;
  sources: string[];
  confidence: "high" | "medium" | "low" | "none";
  notes: string;
}

async function estimate(client: Anthropic, uni: string, country: string, programName: string, programUrl: string): Promise<MbaExpEstimate | null> {
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
    return JSON.parse(m[0]) as MbaExpEstimate;
  } catch (e) {
    console.warn(`  [estimate error] ${(e as Error).message.slice(0, 100)}`);
    return null;
  }
}

// Same brace-walker pattern as estimate-fees.ts (CLAUDE.md hard rule #5).
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

function rewriteEntryWorkExp(src: string, years: number): string {
  // Replace the existing work_exp_required_years line — the field exists
  // on every program block per the type, even when null.
  const re = /work_exp_required_years:\s*(?:null|\d+(?:\.\d+)?)/;
  if (re.test(src)) return src.replace(re, `work_exp_required_years: ${years}`);
  // Defensive: inject before apply_url if for some reason the field is absent.
  return src.replace(/(program_url:\s*"[^"]+",)/, `$1 work_exp_required_years: ${years},`);
}

function extractField(src: string, field: string): string | null {
  const m = src.match(new RegExp(`${field}:\\s*"([^"]+)"`));
  return m ? m[1] : null;
}
function extractNullableNumber(src: string, field: string): number | null {
  const m = src.match(new RegExp(`${field}:\\s*(null|\\d+(?:\\.\\d+)?)`));
  if (!m || m[1] === "null") return null;
  return parseFloat(m[1]);
}

process.on("unhandledRejection", (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.warn(`[unhandledRejection swallowed] ${msg.slice(0, 200)}`);
});

// SIGTERM-safe flush (mirror estimate-fees.ts hardening).
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

  // Filter targets: MBA + null work_exp_required_years.
  const targets: { idx: number; uni: string; country: string; programName: string; programUrl: string }[] = [];
  for (let i = 0; i < entries.length; i++) {
    const s = entries[i].src;
    const field = extractField(s, "field_of_study");
    if (field !== "MBA") continue;
    const yrs = extractNullableNumber(s, "work_exp_required_years");
    if (yrs !== null) continue;
    if (argCountry && extractField(s, "country") !== argCountry) continue;
    const uni    = extractField(s, "university_name") ?? "?";
    const country = extractField(s, "country") ?? "?";
    const programName = extractField(s, "program_name") ?? "?";
    const programUrl  = extractField(s, "program_url")  ?? "";
    if (!programUrl) continue;
    targets.push({ idx: i, uni, country, programName, programUrl });
    if (targets.length >= argLimit) break;
  }

  console.log(`Targets: ${targets.length} MBA programs missing work_exp_required_years.`);
  if (argDry) {
    targets.slice(0, 20).forEach((t, k) => console.log(`  [${k + 1}] ${t.country} | ${t.uni} | ${t.programName}`));
    if (targets.length > 20) console.log(`  …and ${targets.length - 20} more.`);
    return;
  }

  const client = new Anthropic();

  // Per-entry results captured in memory, flushed in batches.
  type Result = { idx: number; years: number | null; confidence: string; sources: string[]; notes: string; uni: string; programName: string };
  const results: Result[] = [];

  const flushBatch = (): void => {
    // Write the per-entry log (audit trail).
    try {
      writeFileSync(RESULTS_LOG, JSON.stringify(results, null, 2));
    } catch (e) {
      console.warn(`[flush log] ${(e as Error).message}`);
    }
    // Apply rewrites where confidence justifies it (high/medium).
    let applied = 0;
    for (const r of results) {
      if (r.years === null) continue;
      if (r.confidence !== "high" && r.confidence !== "medium") continue;
      entries[r.idx].src = rewriteEntryWorkExp(entries[r.idx].src, r.years);
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
        console.log(`${tag} ${t.country} | ${t.uni} | ${t.programName.slice(0, 60)}`);
        estimate(client, t.uni, t.country, t.programName, t.programUrl)
          .then((res) => {
            if (!res) { errCount++; }
            else if (res.work_exp_required_years === null || res.confidence === "low" || res.confidence === "none") {
              lowCount++;
              console.log(`  ~ ${res.confidence} — no write`);
            } else {
              okCount++;
              console.log(`  ✓ ${res.confidence} ${res.work_exp_required_years}yr — ${res.sources.length} sources`);
              results.push({
                idx: t.idx,
                years: res.work_exp_required_years,
                confidence: res.confidence,
                sources: res.sources,
                notes: res.notes,
                uni: t.uni,
                programName: t.programName,
              });
            }
          })
          .catch((e) => {
            errCount++;
            console.warn(`  [error] ${(e as Error).message.slice(0, 100)}`);
          })
          .finally(() => {
            pending--;
            processed++;
            // Flush every 5 to bound SIGTERM-loss to ~4 in-flight + queued.
            if (results.length > 0 && results.length % 5 === 0) flushBatch();
            if (processed === targets.length) resolve();
            else run();
          });
      }
    };
    run();
  });

  // Final flush.
  flushBatch();
  console.log("");
  console.log(`Done. ok=${okCount} low=${lowCount} err=${errCount}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
