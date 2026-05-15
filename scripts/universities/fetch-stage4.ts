// Stage 4 — universities sidecar for non-US/non-UK countries.
//
// Mirrors fetch-uk.ts: Anthropic Opus 4.7 + web_search, prompt-cached
// system prompt, resume-safe (per-country JSON results file), per-row
// flush every 10 rows.
//
// Per-country auth sources are wired into the system prompt so the
// model knows what to search for. Output normalisation (currency to
// USD, school_type enum) is done client-side to keep the model
// focused on retrieval.
//
// Usage:
//   ANTHROPIC_API_KEY=... npx tsx scripts/universities/fetch-stage4.ts --country "Canada"
//   ANTHROPIC_API_KEY=... npx tsx scripts/universities/fetch-stage4.ts --all
//
// Output: scripts/universities/stage4-results-<country-slug>.json
//
// Cost ballpark: ~$0.25 per uni × 279 total = ~$70 if --all. Single-
// country runs scale down proportionally.

import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

// FX rates (mid-market, 15 May 2026). Conservative — these rarely shift
// enough between fetch and merge to materially change USD figures.
const FX_TO_USD: Record<string, number> = {
  CAD: 0.73,  AUD: 0.66,  EUR: 1.08,  SGD: 0.74,  NZD: 0.61,
  AED: 0.27,  MYR: 0.21,
  USD: 1.0,
};

interface CountryCfg {
  /** Display name as used in programs.ts `country` field. */
  display: string;
  /** Slug for output filename. */
  slug: string;
  /** Authoritative sources Claude should prioritize for this country. */
  sources: string;
  /** Local currency for graduate_outcome_salary. */
  salary_currency: keyof typeof FX_TO_USD;
}

const COUNTRY_CFG: Record<string, CountryCfg> = {
  Canada: {
    display: "Canada",
    slug: "canada",
    sources:
      "Statistics Canada (statcan.gc.ca), Universities Canada, Maclean's University Rankings, individual university Common Data Set (CDS) or Fact Book pages, Ontario Universities' Application Centre (OUAC) for Ontario unis.",
    salary_currency: "CAD",
  },
  Australia: {
    display: "Australia",
    slug: "australia",
    sources:
      "QILT (Quality Indicators for Learning and Teaching: qilt.edu.au), Department of Education (education.gov.au), Group of Eight (Go8) member pages, individual university Annual Reports.",
    salary_currency: "AUD",
  },
  Germany: {
    display: "Germany",
    slug: "germany",
    sources:
      "DAAD (daad.de), CHE Hochschulranking (zeit.de/che-ranking), Hochschulkompass (hochschulkompass.de), individual Hochschule Statistik pages. Many German publics don't publish acceptance rates because admission is rule-based — return null in that case.",
    salary_currency: "EUR",
  },
  France: {
    display: "France",
    slug: "france",
    sources:
      "MESR (enseignementsup-recherche.gouv.fr), Campus France, individual Grande École or Université Annual Reports. Highly selective Grandes Écoles publish concours acceptance rates; universités usually do not.",
    salary_currency: "EUR",
  },
  Singapore: {
    display: "Singapore",
    slug: "singapore",
    sources:
      "Singapore Ministry of Education (moe.gov.sg), Graduate Employment Survey (joint survey by NUS / NTU / SMU / SUTD / SUSS / SIT), individual university Annual Reports.",
    salary_currency: "SGD",
  },
  "New Zealand": {
    display: "New Zealand",
    slug: "new-zealand",
    sources:
      "Education Counts (educationcounts.govt.nz), Tertiary Education Commission (tec.govt.nz), Universities New Zealand, individual university Annual Reports.",
    salary_currency: "NZD",
  },
  Ireland: {
    display: "Ireland",
    slug: "ireland",
    sources:
      "Higher Education Authority Ireland (hea.ie), Irish Universities Association, individual university Annual Reports. Acceptance rate for most Irish unis is the CAO points-based admission rate; not always published.",
    salary_currency: "EUR",
  },
  UAE: {
    display: "UAE",
    slug: "uae",
    sources:
      "Commission for Academic Accreditation (CAA, caa.ae), Ministry of Education UAE, individual university Annual Reports. Mix of public and private institutions; private internationals (American University of Sharjah, NYU Abu Dhabi, etc.) publish more US-style stats.",
    salary_currency: "AED",
  },
  Malaysia: {
    display: "Malaysia",
    slug: "malaysia",
    sources:
      "Ministry of Higher Education (mohe.gov.my), Malaysian Qualifications Agency (MQA, mqa.gov.my), individual university Annual Reports.",
    salary_currency: "MYR",
  },
  Netherlands: {
    display: "Netherlands",
    slug: "netherlands",
    sources:
      "Studiekeuze123.nl (national programme satisfaction survey), VSNU (Association of Universities in the Netherlands), Nuffic (international student stats), individual TU / Universiteit Annual Reports / Jaarverslagen.",
    salary_currency: "EUR",
  },
};

interface UniRow {
  id: string;
  name: string;
  country: string;
  acceptance_rate: number | null;
  enrollment_undergrad: number | null;
  enrollment_total: number | null;
  graduate_outcome_salary_usd: number | null;
  graduate_outcome_employment_pct: number | null;
  student_staff_ratio: number | null;
  completion_rate_pct: number | null;
  school_type: "public" | "private" | null;
  data_source: string;
  data_extracted_at: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildSystemPrompt(cfg: CountryCfg): string {
  return `You are a careful data extractor for a higher-education comparison tool.

You will use the web_search tool aggressively — up to 5 searches per
university — to find the requested fields from authoritative sources.
Country-specific authoritative sources for ${cfg.display}:

  ${cfg.sources}

Hard rules on output:
- Return JSON only. No prose, no fences, no commentary.
- If after searching you genuinely cannot find a value on any
  authoritative source, set the field to null. Never invent or
  estimate a numeric value. Acceptance rate in particular is missing
  for most non-selective continental European unis — that's expected,
  return null.
- For percentages, return a number 0-100.
- For graduate_outcome_salary_${cfg.salary_currency.toLowerCase()}, return the most recent published
  **ANNUAL** (per-year, not per-month) median starting salary / gross
  income for a fresh graduate, in ${cfg.salary_currency}. Round to the nearest 1000.
  If the source quotes a monthly figure, multiply by 12 BEFORE returning.
  Sanity check: annual graduate starting salaries are typically 30,000-
  80,000 in local currency for most countries — a value below 10,000 is
  almost certainly a monthly figure you forgot to annualize.
- For graduate_outcome_employment_pct, return the % "in employment or
  further study" within 6-12 months of graduation. Round to the
  nearest whole number.
- For school_type, return one of: "public", "private", or null.
- For enrolment numbers, use the latest published headcount.
  enrollment_undergrad = UG headcount. enrollment_total = UG + PG
  combined.
- For student_staff_ratio, return students per academic staff as a
  number (e.g., 17.5 means 17.5 students per staff member).
- For completion_rate_pct, return the most recent "graduates within
  expected duration" or equivalent completion %.`;
}

const USER_PROMPT_TEMPLATE = (uni: string, country: string, salary_currency: string) =>
  `University: "${uni}" (${country})

Return JSON with these exact keys:
{
  "acceptance_rate": number|null,
  "enrollment_undergrad": number|null,
  "enrollment_total": number|null,
  "graduate_outcome_salary_${salary_currency.toLowerCase()}": number|null,
  "graduate_outcome_employment_pct": number|null,
  "student_staff_ratio": number|null,
  "completion_rate_pct": number|null,
  "school_type": "public"|"private"|null
}`;

interface ExtractedFields {
  acceptance_rate?: number | null;
  enrollment_undergrad?: number | null;
  enrollment_total?: number | null;
  graduate_outcome_employment_pct?: number | null;
  student_staff_ratio?: number | null;
  completion_rate_pct?: number | null;
  school_type?: string | null;
  // currency-specific salary field — keyed dynamically below
  [k: string]: unknown;
}

async function fetchOne(
  client: Anthropic,
  uni: string,
  cfg: CountryCfg
): Promise<{ row: UniRow; usage: { input: number; cache_create: number; cache_read: number; output: number; search: number } } | null> {
  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    system: [
      { type: "text", text: buildSystemPrompt(cfg), cache_control: { type: "ephemeral" } },
    ] as unknown as Anthropic.Messages.MessageCreateParamsNonStreaming["system"],
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5,
      } as unknown as Anthropic.Messages.Tool,
    ],
    messages: [{ role: "user", content: USER_PROMPT_TEMPLATE(uni, cfg.display, cfg.salary_currency) }],
  });

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
      // try the next text block
    }
  }
  if (!parsed) return null;

  // Pull salary by currency-specific key.
  const salaryKey = `graduate_outcome_salary_${cfg.salary_currency.toLowerCase()}`;
  const salaryLocal = typeof parsed[salaryKey] === "number" ? (parsed[salaryKey] as number) : null;
  const fx = FX_TO_USD[cfg.salary_currency] ?? null;
  const usd = salaryLocal != null && fx != null ? Math.round(salaryLocal * fx) : null;

  const typeRaw = typeof parsed.school_type === "string" ? parsed.school_type.toLowerCase().trim() : null;
  const school_type =
    typeRaw === "public" || typeRaw === "private" ? (typeRaw as "public" | "private") : null;

  const row: UniRow = {
    id: slugify(uni),
    name: uni,
    country: cfg.display,
    acceptance_rate: typeof parsed.acceptance_rate === "number" ? parsed.acceptance_rate : null,
    enrollment_undergrad: typeof parsed.enrollment_undergrad === "number" ? parsed.enrollment_undergrad : null,
    enrollment_total: typeof parsed.enrollment_total === "number" ? parsed.enrollment_total : null,
    graduate_outcome_salary_usd: usd,
    graduate_outcome_employment_pct:
      typeof parsed.graduate_outcome_employment_pct === "number" ? parsed.graduate_outcome_employment_pct : null,
    student_staff_ratio:
      typeof parsed.student_staff_ratio === "number" ? parsed.student_staff_ratio : null,
    completion_rate_pct:
      typeof parsed.completion_rate_pct === "number" ? parsed.completion_rate_pct : null,
    school_type,
    data_source: `Claude API web_search → ${cfg.display} national sources (Stage 4, 15 May 2026)`,
    data_extracted_at: new Date().toISOString(),
  };

  const usage = response.usage as Anthropic.Messages.Usage & {
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

async function processCountry(client: Anthropic, country: string, catalog: Record<string, string[]>) {
  const cfg = COUNTRY_CFG[country];
  if (!cfg) { console.error(`Unknown country: ${country}`); return; }
  const unis = catalog[country] ?? [];
  if (unis.length === 0) { console.log(`No unis for ${country}`); return; }

  const root = path.resolve(__dirname);
  const resultsPath = path.join(root, `stage4-results-${cfg.slug}.json`);
  const missesPath  = path.join(root, `stage4-misses-${cfg.slug}.json`);

  let prior: Record<string, UniRow> = {};
  try {
    prior = JSON.parse(await fs.readFile(resultsPath, "utf-8"));
    console.log(`[${country}] resuming — ${Object.keys(prior).length} already done.`);
  } catch { /* first run */ }

  const out: Record<string, UniRow> = { ...prior };
  const misses: { name: string; reason: string }[] = [];
  let totalIn = 0, totalCacheCreate = 0, totalCacheRead = 0, totalOut = 0, totalSearch = 0;

  console.log(`[${country}] fetching ${unis.length} unis (${unis.length - Object.keys(prior).length} remaining)`);
  for (let i = 0; i < unis.length; i++) {
    const name = unis[i];
    if (out[name]) continue;
    try {
      const res = await fetchOne(client, name, cfg);
      if (!res) {
        misses.push({ name, reason: "no JSON parsable" });
        console.log(`  [${i + 1}/${unis.length}] ${name} → MISS`);
        continue;
      }
      out[name] = res.row;
      totalIn         += res.usage.input;
      totalCacheCreate+= res.usage.cache_create;
      totalCacheRead  += res.usage.cache_read;
      totalOut        += res.usage.output;
      totalSearch     += res.usage.search;
      const r = res.row;
      console.log(
        `  [${i + 1}/${unis.length}] ${name} → ` +
          `accept ${r.acceptance_rate ?? "—"}%  UG ${r.enrollment_undergrad ?? "—"}  ` +
          `salary $${r.graduate_outcome_salary_usd ?? "—"}  empl ${r.graduate_outcome_employment_pct ?? "—"}%  ` +
          `[in ${res.usage.input} cR ${res.usage.cache_read} out ${res.usage.output} srch ${res.usage.search}]`
      );
      if ((i + 1) % 10 === 0) {
        await fs.writeFile(resultsPath, JSON.stringify(out, null, 2));
      }
    } catch (err) {
      misses.push({ name, reason: (err as Error).message });
      console.warn(`  [${name}] error: ${(err as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  await fs.writeFile(resultsPath, JSON.stringify(out, null, 2));
  await fs.writeFile(missesPath, JSON.stringify(misses, null, 2));

  // Opus 4.7 rates: $15/M input, $75/M output, $10/1000 web searches.
  // Cache write +25%, cache read -90%.
  const costInput      = (totalIn          / 1_000_000) * 15;
  const costCacheWrite = (totalCacheCreate / 1_000_000) * 18.75;
  const costCacheRead  = (totalCacheRead   / 1_000_000) * 1.5;
  const costOutput     = (totalOut         / 1_000_000) * 75;
  const costSearch     = (totalSearch      / 1000)      * 10;
  const costTotal      = costInput + costCacheWrite + costCacheRead + costOutput + costSearch;
  console.log(
    `[${country}] done. hits=${Object.keys(out).length - Object.keys(prior).length} misses=${misses.length}\n` +
      `  Tokens — input: ${totalIn.toLocaleString()}, cache write: ${totalCacheCreate.toLocaleString()}, cache read: ${totalCacheRead.toLocaleString()}, output: ${totalOut.toLocaleString()}, searches: ${totalSearch}\n` +
      `  Cost: $${costTotal.toFixed(2)} ($${costInput.toFixed(2)} in + $${costCacheWrite.toFixed(2)} cW + $${costCacheRead.toFixed(2)} cR + $${costOutput.toFixed(2)} out + $${costSearch.toFixed(2)} srch)`
  );
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set");
    process.exit(1);
  }
  const args = process.argv.slice(2);
  const all = args.includes("--all");
  const countryIdx = args.indexOf("--country");
  const oneCountry = countryIdx >= 0 ? args[countryIdx + 1] : null;

  const root = path.resolve(__dirname);
  const catalog: Record<string, string[]> = JSON.parse(
    await fs.readFile(path.join(root, "stage4-catalog.json"), "utf-8"),
  );
  const client = new Anthropic();

  const countries = all
    ? Object.keys(COUNTRY_CFG)
    : oneCountry
    ? [oneCountry]
    : null;
  if (!countries) {
    console.error("Pass --country \"Canada\" OR --all");
    process.exit(1);
  }
  for (const c of countries) {
    await processCountry(client, c, catalog);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
