/**
 * streams-seed-finder.ts
 *
 * Variant for "stream" gaps — a mix of broad fields and narrow
 * specializations the user wants filled at QS Top-500 universities.
 * Each stream maps to one of the 18 FIELDS_OF_STUDY at output time, but
 * the prompt language is tailored per stream so Sonnet finds the
 * specialization-correct page (e.g., "MS Cybersecurity", not just any
 * CS Master's).
 *
 * Streams supported:
 *   - Specialisations (within an existing field):
 *     Cybersecurity · Machine Learning · AI · Data Science ·
 *     Business Analytics · Healthcare · Fine Arts
 *   - Broad fields (any flagship master's in the field):
 *     MBA · Business · Economics & Finance · Law (UK)
 *
 * Usage:
 *   npx tsx scripts/verify/streams-seed-finder.ts \
 *     --universities scripts/verify/catalogs/streams-pilot-top50.json \
 *     --out scripts/verify/seeds/streams-pilot.json
 */
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

interface UniInput {
  university: string;
  country: string;
  city: string;
  qs_ranking: number | null;
  missing_streams: string[];
}
interface SeedOut {
  university: string;
  country: string;
  city: string;
  qs_ranking: number | null;
  field_of_study: string;
  program_url: string;
  degree_level: "postgraduate";
}

// stream label → { field_of_study tag, prompt-language hint }
// Inclusion rule (per user direction 8 May 2026): programs that mention the
// stream IN THE PROGRAM NAME are accepted, even if it's a combined degree
// like "MSc Computer Science with Cybersecurity". Only reject when the
// stream is a hidden track / elective inside a generic-titled degree.
const STREAM_MAP: Record<string, { field: string; hint: string }> = {
  "Cybersecurity":       { field: "Computer Science & IT",                       hint: "Any master's degree whose program name contains Cybersecurity / Information Security / Cyber Defense — including combined degrees like 'MSc Computer Science with Cybersecurity'." },
  "Machine Learning":    { field: "Artificial Intelligence",      hint: "Any master's degree whose program name contains Machine Learning — including combined degrees like 'MSc CS with Machine Learning'." },
  "AI":                  { field: "Artificial Intelligence",      hint: "Any master's degree whose program name contains Artificial Intelligence / AI — including combined degrees like 'MSc CS with AI'." },
  "Data Science":        { field: "Artificial Intelligence",      hint: "Any master's degree whose program name contains Data Science — including combined degrees like 'MSc Statistics with Data Science'." },
  "Business Analytics":  { field: "Business & Management",                       hint: "Any master's degree whose program name contains Business Analytics or Analytics — including 'MS Analytics', 'MSc Business Analytics', or 'MBA Business Analytics specialization'." },
  "Healthcare":          { field: "Public Health",                    hint: "Any healthcare-related master's: MPH (Public Health), Master's in Healthcare Administration / Health Informatics / Health Policy / Health Management / Clinical Research." },
  "Fine Arts":           { field: "Arts, Design & Architecture",                 hint: "Master of Fine Arts (MFA) — studio art, visual arts, creative writing, theatre/film MFA — NOT design or architecture." },
  "MBA":                 { field: "MBA",                                         hint: "The flagship full-time MBA program (Master of Business Administration)." },
  "Business":            { field: "Business & Management",                       hint: "MS / MSc in Management OR Master in International Business (a flagship master's-level Business degree, NOT MBA)." },
  "Economics & Finance": { field: "Economics & Finance",                         hint: "MSc / MS in Economics OR MSc in Finance (a flagship Economics or Finance master's)." },
  "Law (UK)":            { field: "Law",                                         hint: "LLM (Master of Laws) — the flagship postgraduate law degree (UK universities only)." },
};

const PROMPT = (uni: UniInput) => {
  const lines = uni.missing_streams.map((s, i) => {
    const m = STREAM_MAP[s];
    if (!m) return `${i + 1}. ${s} — (unknown stream)`;
    return `${i + 1}. ${s} — ${m.hint}`;
  });
  return `You are building a list of POSTGRADUATE program-detail URLs at one university for a SPECIFIC set of master's-level streams.

UNIVERSITY: ${uni.university}
COUNTRY: ${uni.country}
CITY: ${uni.city}
QS RANK: ${uni.qs_ranking ?? "unranked"}

For EACH of these streams, use web_search to find ONE canonical postgraduate program-detail URL on the university's own domain. Each stream has a specific definition — only return URLs that match the stream's definition, not a related program.

STREAMS:
${lines.join("\n")}

Rules:
- Skip a stream if the university doesn't have a master's-level program whose NAME contains the stream. Empty result is far better than a wrong URL.
- INCLUDE combined / specialization-named degrees: "MSc Computer Science with Cybersecurity", "MSc Engineering with AI", "MSc Statistics and Data Science" all qualify if the stream is in the program name.
- REJECT only when the stream is a hidden elective / track inside a generic-titled degree (e.g., a "MSc Computer Science" page that lists Cybersecurity as one of several optional modules — but the program itself isn't titled with Cybersecurity).
- Bachelor's, PhD-only, certificate, diploma, and short-course pages are REJECTED.
- One URL per stream. The URL must point to a SPECIFIC postgraduate program detail page — not a department landing, not a graduate-school catalog index.
- Only return URLs whose host belongs to the university (e.g., *.mit.edu for MIT).

Return ONLY a JSON array of objects, no prose, no code fences:
[
  { "stream": "<exact stream label from the list above>", "program_url": "<absolute URL>" }
]`;
};

async function findUrlsForUni(client: Anthropic, uni: UniInput): Promise<SeedOut[]> {
  const r = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: Math.max(uni.missing_streams.length + 2, 5) } as unknown as Anthropic.Messages.Tool],
    messages: [{ role: "user", content: PROMPT(uni) }],
  });
  const text = r.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < 0) {
    console.error(`  [no JSON array found in response]`);
    return [];
  }
  let arr: Array<{ stream?: string; program_url?: string }>;
  try {
    arr = JSON.parse(text.slice(start, end + 1));
  } catch {
    console.error(`  [JSON parse error]`);
    return [];
  }
  const allowed = new Set(uni.missing_streams);
  const out: SeedOut[] = [];
  const seen = new Set<string>();
  for (const item of arr) {
    if (!item.stream || !item.program_url) continue;
    if (!allowed.has(item.stream)) continue;
    if (!item.program_url.startsWith("http")) continue;
    const map = STREAM_MAP[item.stream];
    if (!map) continue;
    const key = `${item.stream}|${item.program_url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      university: uni.university,
      country: uni.country,
      city: uni.city,
      qs_ranking: uni.qs_ranking,
      field_of_study: map.field,
      program_url: item.program_url,
      degree_level: "postgraduate",
    });
  }
  return out;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1); }
  const argv = process.argv.slice(2);
  const get = (k: string) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
  const inPath = get("universities");
  const outPath = get("out");
  if (!inPath || !outPath) { console.error("Need --universities <file> --out <file>"); process.exit(1); }

  const unis: UniInput[] = JSON.parse(readFileSync(inPath, "utf8"));
  console.log(`Streams seed-finding for ${unis.length} universities…`);

  const all: SeedOut[] = [];
  const coveredUnis = new Set<string>();
  if (existsSync(outPath)) {
    try {
      const prev: SeedOut[] = JSON.parse(readFileSync(outPath, "utf8"));
      all.push(...prev);
      for (const s of prev) coveredUnis.add(s.university);
      console.log(`Resume: loaded ${prev.length} prior seeds across ${coveredUnis.size} unis (will skip those).`);
    } catch { /* ignore */ }
  }

  const client = new Anthropic();
  for (const [i, u] of unis.entries()) {
    if (coveredUnis.has(u.university)) {
      process.stdout.write(`[${i + 1}/${unis.length}] ${u.university} (skip — already in output)\n`);
      continue;
    }
    process.stdout.write(`[${i + 1}/${unis.length}] ${u.university} (${u.missing_streams.length} streams)\n`);
    try {
      const seeds = await findUrlsForUni(client, u);
      all.push(...seeds);
      process.stdout.write(`  -> ${seeds.length} URLs\n`);
      writeFileSync(outPath, JSON.stringify(all, null, 2));
    } catch (e) {
      console.error(`  ERROR: ${(e as Error).message.slice(0, 120)}`);
    }
  }
  console.log(`\nDone. ${all.length} seed URLs written to ${outPath}`);
}

main();
