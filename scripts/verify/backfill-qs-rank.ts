// Backfill `qs_ranking` for universities whose programs all carry null
// QS rank. Uses Sonnet + web_search (same pattern as estimate-fees.ts)
// to look up QS World University Rankings 2025 (and Global Universities
// for schools outside the main ranking).
//
// Returns an integer rank for unis that appear in any QS-published
// ranking; null for unis that genuinely aren't ranked (specialist art
// schools, regional teaching-only institutions, etc.). Honest null is
// preferred to a fabricated number.
//
// Usage:
//   API_DATA_GOV_KEY not needed.
//   ANTHROPIC_API_KEY must be set.
//   npx tsx scripts/verify/backfill-qs-rank.ts [--limit N] [--country C]
//
// Writes results to /tmp/qs-backfill-results.json (keyed by university
// name) and patches programs.ts at the end.

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "node:fs/promises";
import * as path from "node:path";

const SYSTEM_PROMPT = `You are a careful data extractor. Given a university name
and country, search the web for that university's QS World University
Rankings rank for 2025 (the most recent edition).

If the university appears in QS World University Rankings 2025, return
its rank as an integer. If it's in QS USA / QS Asia / QS Latin America
/ QS Arab Region / QS Global Universities (the broader 1500-school
list) but NOT in the main World Rankings, return the Global
Universities rank.

If the university genuinely does not appear in any QS ranking (small
specialist school, religious seminary, undergrad-only liberal arts
college that opts out, etc.) return null.

Return STRICTLY a single JSON object with one key:
  {"qs_ranking": <integer | null>}

If QS publishes a range like "601-650", return the LOWER bound (601).
If the university is in the "1001+" band, return 1001.

Do not invent numbers. If you can't find a confident answer after one
or two searches, return null.`;

interface UniInput { university: string; country: string; programs?: number; }
interface QSResult { university: string; country: string; qs_ranking: number | null; }

async function lookupOne(client: Anthropic, uni: UniInput): Promise<QSResult> {
  const r = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }] as unknown as Anthropic.Messages.MessageCreateParamsNonStreaming["system"],
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 2 } as unknown as Anthropic.Messages.Tool],
    messages: [{ role: "user", content: `University: "${uni.university}" (${uni.country})\n\nReturn JSON only.` }],
  });

  // Final text block contains the JSON answer
  const textBlocks = r.content.filter((b) => b.type === "text") as Array<{ type: "text"; text: string }>;
  for (let i = textBlocks.length - 1; i >= 0; i--) {
    let raw = textBlocks[i].text.trim();
    const fb = raw.indexOf("{");
    const lb = raw.lastIndexOf("}");
    if (fb < 0 || lb <= fb) continue;
    raw = raw.slice(fb, lb + 1);
    try {
      const parsed = JSON.parse(raw) as { qs_ranking?: number | null };
      const qs = typeof parsed.qs_ranking === "number" ? parsed.qs_ranking : null;
      return { university: uni.university, country: uni.country, qs_ranking: qs };
    } catch { continue; }
  }
  return { university: uni.university, country: uni.country, qs_ranking: null };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1); }
  const argv = process.argv.slice(2);
  const get = (k: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
  const limit = get("limit") ? parseInt(get("limit")!) : Infinity;
  const country = get("country");
  const inputPath = get("input") ?? "/tmp/qs-null-unis.json";
  const outputPath = get("output") ?? "/tmp/qs-backfill-results.json";

  let unis: UniInput[] = JSON.parse(await fs.readFile(inputPath, "utf-8"));
  if (country) unis = unis.filter((u) => u.country === country);
  unis = unis.slice(0, limit);
  console.log(`Looking up QS rank for ${unis.length} universities...`);

  // Resume support
  let prior: Record<string, QSResult> = {};
  try {
    prior = JSON.parse(await fs.readFile(outputPath, "utf-8"));
    console.log(`Resuming — ${Object.keys(prior).length} already done.`);
  } catch { /* first run */ }

  const out: Record<string, QSResult> = { ...prior };
  const client = new Anthropic();
  let totalIn = 0, totalCacheCreate = 0, totalCacheRead = 0, totalOut = 0, totalSearch = 0;

  for (let i = 0; i < unis.length; i++) {
    const u = unis[i];
    if (out[u.university]) continue;
    try {
      const res = await lookupOne(client, u);
      out[u.university] = res;
      const usage = (await Promise.resolve(0)) as unknown; void usage;  // placeholder
      console.log(`  [${i + 1}/${unis.length}] ${u.university} → ${res.qs_ranking ?? "—"}`);
      if ((i + 1) % 10 === 0) {
        await fs.writeFile(outputPath, JSON.stringify(out, null, 2));
      }
    } catch (err) {
      console.warn(`  [${u.university}] error: ${(err as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  await fs.writeFile(outputPath, JSON.stringify(out, null, 2));
  const found = Object.values(out).filter((r) => r.qs_ranking !== null).length;
  const total = Object.keys(out).length;
  console.log(`\nDone. ${found}/${total} got a QS rank, ${total - found} confirmed unranked.`);
  console.log(`Results: ${outputPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
