/**
 * gap-6fields-seed-finder.ts — Batch A of the July 2026 DB expansion.
 *
 * Reads the gap queue (per-uni missing_fields subset of the 6 thinnest
 * fields) and asks Claude with web_search for ONE canonical program-detail
 * URL per missing field. Modeled on websearch-seed-finder.ts, plus:
 *
 *   - per-uni prompt lists ONLY that uni's missing fields (1-6, avg ~4.9)
 *   - hard USD budget cap: tracks input/output tokens + web_search requests
 *     per response and aborts (persisting state) when cumulative spend hits
 *     --budget-usd. Sonnet 4.6: $3/MTok in, $15/MTok out; web search
 *     $10/1,000 searches (pricing page, 11 Jul 2026).
 *   - resumable: progress file records processed unis + spend; re-running
 *     with the same --out skips them.
 *   - concurrency 4 (each uni is an independent API call).
 *   - runaway guard: aborts if avg cost/uni > $0.40 after 10 unis
 *     (estimate is ~$0.10-0.15/uni).
 *
 * Usage:
 *   npx tsx scripts/verify/gap-6fields-seed-finder.ts \
 *     --queue scripts/verify/catalogs/gap-queue-6fields-2026-07.json \
 *     --out scripts/verify/seeds/gap-6fields-auto.json \
 *     --budget-usd 95 [--limit N] [--level ug|pg]
 *
 * Generalised 14 Jul 2026: the field allowlist now comes from the queue and
 * --level ug switches the prompt to hunt Bachelor's pages only.
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const PRICE_IN = 3 / 1_000_000;   // Sonnet 4.6 USD per input token
const PRICE_OUT = 15 / 1_000_000; // Sonnet 4.6 USD per output token
const PRICE_SEARCH = 0.01;        // USD per web_search request
const RUNAWAY_AVG_USD = 0.40;

// Allowlist is derived from the queue's own missing_fields union so the
// script serves any gap campaign (Batch A's six fields, the Jul 2026 UG
// campaign, whatever comes next). Populated in main().
let ALLOWED_FIELDS: Set<string> = new Set();

/** Degree level this run is hunting for — set by --level. */
let LEVEL: "ug" | "pg" = "pg";

interface QueueEntry {
  university: string;
  country: string;
  city: string | null;
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
}
interface Progress {
  done: string[]; // "university|country"
  spent_usd: number;
  searches: number;
  input_tokens: number;
  output_tokens: number;
}

const PROMPT = (u: QueueEntry) => `You are building a list of program-detail URLs for a single university.

UNIVERSITY: ${u.university}
COUNTRY: ${u.country}${u.city ? `\nCITY: ${u.city}` : ""}
QS RANK: ${u.qs_ranking ?? "unranked"}

For EACH of these fields of study, use web_search to find ONE canonical ${LEVEL === "ug" ? "UNDERGRADUATE (Bachelor's)" : "program"}-detail URL on the university's own domain (NOT third-party listings, NOT Wikipedia). Prefer pages that show the actual degree program — ${LEVEL === "ug" ? "Bachelor's / undergraduate" : "Master's / Bachelor's"} detail pages with admissions info.

FIELDS:
${u.missing_fields.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Rules:
- Be economical with searches: combine several fields into one query where sensible (e.g. "site:university-domain masters fintech OR business analytics OR cybersecurity"). You have fewer searches than fields.
- Skip a field if the university doesn't have a clear flagship program in it (many won't have FinTech or Business Analytics — an empty result is far better than a wrong URL).
- Skip if you can't find a confident URL.
- One URL per field. ${LEVEL === "ug" ? "Pick an UNDERGRADUATE / Bachelor's program ONLY. Do NOT return a Master's, MSc, MA, MEng or postgraduate page — if the university has no bachelor's in that field, skip it." : "Pick the most representative master's-level program (or bachelor's, if no master's)."}
- Only return URLs whose host belongs to the university.
- The URL must point to a SPECIFIC program detail page, not a department landing or a generic catalog index.

Return ONLY a JSON array of objects, no prose, no code fences:
[
  { "field_of_study": "<one of the fields verbatim>", "program_url": "<absolute URL>" }
]`;

function usageCost(u: { input_tokens: number; output_tokens: number; server_tool_use?: { web_search_requests?: number } | null }) {
  const searches = u.server_tool_use?.web_search_requests ?? 0;
  return {
    usd: u.input_tokens * PRICE_IN + u.output_tokens * PRICE_OUT + searches * PRICE_SEARCH,
    searches,
  };
}

async function findUrlsForUni(client: Anthropic, u: QueueEntry) {
  const r = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [{
      // _20260209 variant: dynamic filtering trims search results before they
      // enter context — the 03/05 variant cost ~88k input tokens/uni in the
      // 11 Jul pilot ($0.33/uni, 2.5x budget model).
      type: "web_search_20260209",
      name: "web_search",
      max_uses: Math.min(u.missing_fields.length, 4),
    } as unknown as Anthropic.Messages.Tool],
    messages: [{ role: "user", content: PROMPT(u) }],
  });
  const { usd, searches } = usageCost(r.usage);
  const text = r.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
  const seeds: SeedOut[] = [];
  // Prefer the object-array span — a bare first-"["/last-"]" slice breaks when
  // prose contains citation brackets like [1] (pilot 2, Abu Dhabi University).
  let start = text.lastIndexOf("[{");
  let end = text.lastIndexOf("}]") + 1;
  let parseFailed = false;
  if (start < 0 || end <= start) {
    if (/\[\s*\]/.test(text)) { start = -1; } // legit empty result
    else { start = text.indexOf("["); end = text.lastIndexOf("]"); }
  }
  if (start >= 0 && end > start) {
    try {
      const arr = JSON.parse(text.slice(start, end + 1)) as Array<{ field_of_study?: string; program_url?: string }>;
      const seen = new Set<string>();
      for (const item of arr) {
        if (!item.field_of_study || !item.program_url) continue;
        if (!u.missing_fields.includes(item.field_of_study)) continue;
        if (!ALLOWED_FIELDS.has(item.field_of_study)) continue;
        if (!item.program_url.startsWith("http")) continue;
        const key = `${item.field_of_study}|${item.program_url}`;
        if (seen.has(key)) continue;
        seen.add(key);
        seeds.push({
          university: u.university,
          country: u.country,
          city: u.city ?? "",
          qs_ranking: u.qs_ranking,
          field_of_study: item.field_of_study,
          program_url: item.program_url,
        });
      }
    } catch {
      parseFailed = true;
      console.error(`  [JSON parse error] ${u.university}: ...${text.slice(-160).replace(/\n/g, " ")}`);
    }
  }
  return { seeds, usd, searches, in_tok: r.usage.input_tokens, out_tok: r.usage.output_tokens, parseFailed };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1); }
  const argv = process.argv.slice(2);
  const get = (k: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
  const queuePath = get("queue");
  const outPath = get("out");
  const budget = parseFloat(get("budget-usd") ?? "");
  LEVEL = get("level") === "ug" ? "ug" : "pg";
  const limit = get("limit") ? parseInt(get("limit")!, 10) : Infinity;
  if (!queuePath || !outPath || !isFinite(budget) || budget <= 0) {
    console.error("Need --queue <file> --out <file> --budget-usd <n> [--limit N] [--level ug|pg] [--timeout-min N]");
    process.exit(1);
  }
  const progressPath = outPath.replace(/\.json$/, "-progress.json");

  let queue: QueueEntry[] = JSON.parse(readFileSync(queuePath, "utf8"));
  const progress: Progress = existsSync(progressPath)
    ? JSON.parse(readFileSync(progressPath, "utf8"))
    : { done: [], spent_usd: 0, searches: 0, input_tokens: 0, output_tokens: 0 };
  const all: SeedOut[] = existsSync(outPath) ? JSON.parse(readFileSync(outPath, "utf8")) : [];
  const doneSet = new Set(progress.done);
  queue = queue.filter((u) => u.missing_fields.length > 0 && !doneSet.has(`${u.university}|${u.country}`)).slice(0, limit);
  ALLOWED_FIELDS = new Set(queue.flatMap((u) => u.missing_fields));
  console.log(`Level: ${LEVEL.toUpperCase()} · ${ALLOWED_FIELDS.size} fields in scope.`);
  console.log(`Gap seed-finding: ${queue.length} unis to process, $${progress.spent_usd.toFixed(2)} already spent, budget $${budget}.`);

  // 22 unis timed out on the first UG pass — all field-heavy (5-6 missing
  // fields → 4 searches + ~60k input tokens), exceeding the SDK's 10-min
  // default. --timeout-min raises it for the retry pass. (14 Jul 2026)
  const timeoutMin = parseFloat(get("timeout-min") ?? "10");
  const client = new Anthropic({ timeout: timeoutMin * 60 * 1000 });
  let processed = progress.done.length;
  let stopped = false;

  const persist = () => {
    writeFileSync(outPath, JSON.stringify(all, null, 1));
    writeFileSync(progressPath, JSON.stringify(progress, null, 1));
  };

  let idx = 0;
  async function worker(wid: number) {
    while (!stopped) {
      const i = idx++;
      if (i >= queue.length) return;
      const u = queue[i];
      try {
        let r = await findUrlsForUni(client, u);
        if (r.parseFailed && r.seeds.length === 0) {
          // one retry — a parse failure wastes the whole uni otherwise
          const retry = await findUrlsForUni(client, u);
          retry.usd += r.usd; retry.searches += r.searches;
          retry.in_tok += r.in_tok; retry.out_tok += r.out_tok;
          r = retry;
        }
        // serialize state mutation (single-threaded event loop — safe)
        progress.spent_usd += r.usd;
        progress.searches += r.searches;
        progress.input_tokens += r.in_tok;
        progress.output_tokens += r.out_tok;
        progress.done.push(`${u.university}|${u.country}`);
        all.push(...r.seeds);
        processed++;
        console.log(`[${processed}] ${u.university} (${u.country}) -> ${r.seeds.length}/${u.missing_fields.length} fields  $${r.usd.toFixed(3)}  total $${progress.spent_usd.toFixed(2)}`);
        persist();
        if (progress.spent_usd >= budget) {
          console.error(`BUDGET REACHED: $${progress.spent_usd.toFixed(2)} >= $${budget}. Stopping.`);
          stopped = true;
        }
        if (processed >= 10 && progress.spent_usd / processed > RUNAWAY_AVG_USD) {
          console.error(`RUNAWAY GUARD: avg $${(progress.spent_usd / processed).toFixed(3)}/uni > $${RUNAWAY_AVG_USD}. Stopping.`);
          stopped = true;
        }
      } catch (e) {
        console.error(`  ERROR ${u.university}: ${(e as Error).message.slice(0, 140)}`);
        // not marked done — a re-run retries it
      }
    }
  }

  await Promise.all([1, 2, 3, 4].map((w) => worker(w)));
  persist();
  console.log(`\nDONE. Seeds: ${all.length}. Unis processed: ${processed}. Spend: $${progress.spent_usd.toFixed(2)} (${progress.searches} searches, ${progress.input_tokens} in / ${progress.output_tokens} out tokens).`);
  if (stopped) process.exit(2);
}

main().catch((e) => { console.error(e); process.exit(1); });
