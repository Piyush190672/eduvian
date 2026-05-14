// Stage 3 — UK universities backfill.
//
// HESA + OfS + Discover Uni publish the data we want but as scattered
// CSV/Excel/HTML across multiple year-bound URLs. Rather than glue
// together 3-4 brittle CSV parsers, this script does what the existing
// pipeline (verify-program.ts, realistic-admit-extractor) does for
// program-level data: invokes Claude API with the web_search tool and
// asks for a structured extraction per university. Same fabrication-
// safety: Opus 4.7 only, null-when-not-found.
//
// Cost ballpark: ~$0.20-0.30 per uni × 121 unis = ~$25-36. Logged per
// row so partial runs are observable.
//
// Fields requested (matches src/lib/types.ts University additions):
//   - enrollment_undergrad           HESA Student Records latest year
//   - enrollment_total               HESA Student Records latest year (UG+PG)
//   - graduate_outcome_salary_usd    HESA Graduate Outcomes 15-month median
//                                    (publish in GBP — converted to USD here)
//   - graduate_outcome_employment_pct HESA Graduate Outcomes 15-month
//                                    "employment or further study" %
//   - ukprn                          UK Provider Reference Number (HESA/OfS)
//   - student_staff_ratio            Discover Uni / Complete University Guide
//   - nss_satisfaction_pct           OfS NSS latest "overall satisfaction"
//   - tef_rating                     OfS TEF current outcome
//   - completion_rate_pct            HESA / OfS "qualification within expected time"
//
// russell_group is sourced from a hand-typed list (uk-russell-group.json)
// rather than the API to save calls and remove fabrication risk on a
// boolean.

import * as fs from "node:fs/promises";
import * as path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

const GBP_TO_USD = 1.27; // mid-market rate 14 May 2026; periodic refresh

interface UniRow {
  id: string;
  name: string;
  country: "UK";
  enrollment_undergrad: number | null;
  enrollment_total: number | null;
  graduate_outcome_salary_usd: number | null;
  graduate_outcome_employment_pct: number | null;
  ukprn: number | null;
  student_staff_ratio: number | null;
  nss_satisfaction_pct: number | null;
  tef_rating: "gold" | "silver" | "bronze" | "provisional" | null;
  russell_group: boolean | null;
  completion_rate_pct: number | null;
  data_source: string;
  data_extracted_at: string;
}

const SYSTEM_PROMPT = `You are a careful data extractor for a UK higher-education comparison tool.

You will use the web_search tool aggressively — up to 5 searches per
university — to find all the requested fields from authoritative
sources. Cover EACH field with a targeted search. Don't return null
just because the first search didn't find something — search again
with different terms.

Search-plan template per university (use as many of the 5 as needed):
  1. "<uni name> HESA student enrolment 2022/23 OR 2023/24" — gets
     enrollment_undergrad + enrollment_total + ukprn from HESA tables
     or the university's own facts page.
  2. "<uni name> graduate outcomes 15 months salary employment HESA"
     — gets graduate_outcome_salary_gbp + graduate_outcome_employment_pct.
  3. "<uni name> NSS overall satisfaction 2024" — gets nss_satisfaction_pct.
  4. "<uni name> TEF 2023 outcome" — gets tef_rating.
  5. "<uni name> student staff ratio Complete University Guide" — gets
     student_staff_ratio + completion_rate_pct.

Hard rules on output:
- Return JSON only. No prose, no fences, no commentary.
- If after searching you genuinely cannot find a value on any
  authoritative source, set the field to null. Never invent or estimate.
- For boolean fields, return true / false / null.
- For tef_rating, return one of: "gold", "silver", "bronze",
  "provisional", or null. Lowercase. TEF 2023 outcomes are current.
- For graduate_outcome_salary_gbp, return the HESA Graduate Outcomes
  Survey 15-month median in GBP (typically 2020/21 cohort surveyed in
  2022). Round to the nearest 1000.
- For graduate_outcome_employment_pct, return the HESA Graduate
  Outcomes "in employment or further study 15 months after graduation"
  percentage (0-100). Round to nearest whole number.
- For enrolment numbers, use the HESA Student Record latest year.
  enrollment_undergrad = UG headcount. enrollment_total = UG + PG
  combined headcount.
- For completion_rate_pct, prefer the HESA / OfS "qualifying within
  expected time + grace" rate; otherwise the Discover Uni / Complete
  University Guide headline completion %.
- For nss_satisfaction_pct, return the most recent published "overall
  satisfaction" % from the National Student Survey.
- For student_staff_ratio, return students per academic staff as a
  number (e.g., 17.5 means 17.5 students per staff member).
- For ukprn, return the integer Provider Reference Number.`;

const USER_PROMPT_TEMPLATE = (uni: string) => `University: "${uni}" (UK)

Return JSON with these exact keys:
{
  "enrollment_undergrad": number|null,
  "enrollment_total": number|null,
  "graduate_outcome_salary_gbp": number|null,
  "graduate_outcome_employment_pct": number|null,
  "ukprn": number|null,
  "student_staff_ratio": number|null,
  "nss_satisfaction_pct": number|null,
  "tef_rating": "gold"|"silver"|"bronze"|"provisional"|null,
  "completion_rate_pct": number|null
}`;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

interface ExtractedFields {
  enrollment_undergrad?: number | null;
  enrollment_total?: number | null;
  graduate_outcome_salary_gbp?: number | null;
  graduate_outcome_employment_pct?: number | null;
  ukprn?: number | null;
  student_staff_ratio?: number | null;
  nss_satisfaction_pct?: number | null;
  tef_rating?: string | null;
  completion_rate_pct?: number | null;
}

async function fetchOne(
  client: Anthropic,
  uni: string,
  russellSet: Set<string>
): Promise<{ row: UniRow; usage: { input: number; cache_create: number; cache_read: number; output: number; search: number } } | null> {
  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    // System prompt is constant across all 121 calls — cache it so each
    // subsequent uni reads the cached version at 10% of write cost.
    // First call writes (+25%), rest read (-90%) → typical 50-70% input
    // savings on repeat calls. cache_control belongs on the LAST block
    // of the system content array.
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }] as unknown as Anthropic.Messages.MessageCreateParamsNonStreaming["system"],
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
      } as unknown as Anthropic.Messages.Tool,
    ],
    messages: [{ role: "user", content: USER_PROMPT_TEMPLATE(uni) }],
  });

  // With web_search the response.content array is interleaved
  // [text-preamble, server_tool_use, web_search_tool_result, ..., text-answer].
  // The FINAL text block contains the JSON answer; the first contains
  // Claude's reasoning ("I'll search for..."). Iterate from the end.
  const textBlocks = response.content.filter((b) => b.type === "text") as
    Array<{ type: "text"; text: string }>;
  if (!textBlocks.length) return null;
  let parsed: ExtractedFields | null = null;
  for (let bi = textBlocks.length - 1; bi >= 0 && !parsed; bi--) {
    let raw = textBlocks[bi].text.trim();
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace <= firstBrace) continue;
    raw = raw.slice(firstBrace, lastBrace + 1);
    try {
      parsed = JSON.parse(raw) as ExtractedFields;
    } catch {
      // try the next text block (going backward)
    }
  }
  if (!parsed) return null;

  const gbp = typeof parsed.graduate_outcome_salary_gbp === "number" ? parsed.graduate_outcome_salary_gbp : null;
  const usd = gbp != null ? Math.round(gbp * GBP_TO_USD) : null;

  // Normalise tef_rating to our enum.
  const tefRaw = typeof parsed.tef_rating === "string" ? parsed.tef_rating.toLowerCase().trim() : null;
  const tef =
    tefRaw === "gold" || tefRaw === "silver" || tefRaw === "bronze" || tefRaw === "provisional"
      ? (tefRaw as "gold" | "silver" | "bronze" | "provisional")
      : null;

  const row: UniRow = {
    id: slugify(uni),
    name: uni,
    country: "UK",
    enrollment_undergrad: typeof parsed.enrollment_undergrad === "number" ? parsed.enrollment_undergrad : null,
    enrollment_total: typeof parsed.enrollment_total === "number" ? parsed.enrollment_total : null,
    graduate_outcome_salary_usd: usd,
    graduate_outcome_employment_pct:
      typeof parsed.graduate_outcome_employment_pct === "number" ? parsed.graduate_outcome_employment_pct : null,
    ukprn: typeof parsed.ukprn === "number" ? parsed.ukprn : null,
    student_staff_ratio:
      typeof parsed.student_staff_ratio === "number" ? parsed.student_staff_ratio : null,
    nss_satisfaction_pct:
      typeof parsed.nss_satisfaction_pct === "number" ? parsed.nss_satisfaction_pct : null,
    tef_rating: tef,
    russell_group: russellSet.has(uni.toLowerCase().trim()),
    completion_rate_pct:
      typeof parsed.completion_rate_pct === "number" ? parsed.completion_rate_pct : null,
    data_source: "Claude API web_search → HESA / OfS / Discover Uni (14 May 2026)",
    data_extracted_at: new Date().toISOString(),
  };

  const usage = response.usage as unknown as {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
    server_tool_use?: { web_search_requests?: number };
  };
  return {
    row,
    usage: {
      input: usage.input_tokens ?? 0,
      cache_create: usage.cache_creation_input_tokens ?? 0,
      cache_read: usage.cache_read_input_tokens ?? 0,
      output: usage.output_tokens ?? 0,
      search: usage.server_tool_use?.web_search_requests ?? 0,
    },
  };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set");
    process.exit(1);
  }
  const root = path.resolve(__dirname);
  const catalog: string[] = JSON.parse(await fs.readFile(path.join(root, "uk-catalog.json"), "utf-8"));
  const russell: string[] = JSON.parse(await fs.readFile(path.join(root, "uk-russell-group.json"), "utf-8"));
  const russellSet = new Set(russell.map((n) => n.toLowerCase().trim()));

  console.log(`Fetching ${catalog.length} UK universities (Russell Group hard-list: ${russell.length} names).`);
  const client = new Anthropic();

  // Resume support: skip universities already present in results.
  let prior: Record<string, UniRow> = {};
  try {
    prior = JSON.parse(await fs.readFile(path.join(root, "uk-results.json"), "utf-8"));
    console.log(`Resuming — ${Object.keys(prior).length} already done.`);
  } catch {
    // first run
  }

  const out: Record<string, UniRow> = { ...prior };
  const misses: { name: string; reason: string }[] = [];
  let totalIn = 0, totalCacheCreate = 0, totalCacheRead = 0, totalOut = 0, totalSearch = 0;

  for (let i = 0; i < catalog.length; i++) {
    const name = catalog[i];
    if (out[name]) {
      continue;
    }
    try {
      const res = await fetchOne(client, name, russellSet);
      if (!res) {
        misses.push({ name, reason: "no JSON parsable" });
        console.log(`  [${i + 1}/${catalog.length}] ${name} → MISS`);
        continue;
      }
      out[name] = res.row;
      totalIn += res.usage.input;
      totalCacheCreate += res.usage.cache_create;
      totalCacheRead += res.usage.cache_read;
      totalOut += res.usage.output;
      totalSearch += res.usage.search;
      const r = res.row;
      console.log(
        `  [${i + 1}/${catalog.length}] ${name} → ` +
          `UG ${r.enrollment_undergrad ?? "—"}  total ${r.enrollment_total ?? "—"}  ` +
          `salary $${r.graduate_outcome_salary_usd ?? "—"}  TEF ${r.tef_rating ?? "—"}  ` +
          `NSS ${r.nss_satisfaction_pct ?? "—"}  RG ${r.russell_group ? "Y" : "N"}  ` +
          `[in ${res.usage.input} cR ${res.usage.cache_read} out ${res.usage.output} srch ${res.usage.search}]`
      );
      // Flush every 10 rows so a SIGTERM / crash doesn't lose much.
      if ((i + 1) % 10 === 0) {
        await fs.writeFile(path.join(root, "uk-results.json"), JSON.stringify(out, null, 2));
      }
    } catch (err) {
      misses.push({ name, reason: (err as Error).message });
      console.warn(`  [${name}] error: ${(err as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 300)); // gentle rate limit
  }

  await fs.writeFile(path.join(root, "uk-results.json"), JSON.stringify(out, null, 2));
  await fs.writeFile(path.join(root, "uk-misses.json"), JSON.stringify(misses, null, 2));
  // Opus 4.7 published rates: $15/M input, $75/M output, $10/1000 web
  // searches. Prompt caching: write @ +25% (so $18.75/M), read @ -90%
  // (so $1.50/M). Recompute from totals so the user can audit.
  const costInput = (totalIn / 1_000_000) * 15;
  const costCacheWrite = (totalCacheCreate / 1_000_000) * 18.75;
  const costCacheRead = (totalCacheRead / 1_000_000) * 1.5;
  const costOutput = (totalOut / 1_000_000) * 75;
  const costSearch = (totalSearch / 1000) * 10;
  const costTotal = costInput + costCacheWrite + costCacheRead + costOutput + costSearch;
  console.log(
    `\nDone. hits=${Object.keys(out).length - Object.keys(prior).length} misses=${misses.length}\n` +
      `Tokens — input: ${totalIn.toLocaleString()}, cache write: ${totalCacheCreate.toLocaleString()}, cache read: ${totalCacheRead.toLocaleString()}, output: ${totalOut.toLocaleString()}, searches: ${totalSearch}\n` +
      `Cost: $${costInput.toFixed(2)} input + $${costCacheWrite.toFixed(2)} cache-write + $${costCacheRead.toFixed(2)} cache-read + $${costOutput.toFixed(2)} output + $${costSearch.toFixed(2)} search = $${costTotal.toFixed(2)}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
