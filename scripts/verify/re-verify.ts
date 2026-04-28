/**
 * re-verify.ts
 *
 * Reads existing entries from src/data/programs.ts, fetches their program_url,
 * asks Claude to confirm fields literally on the page, and writes the result
 * to scripts/verify/output/. Entries that 404, that don't match their stated
 * field_of_study, or that yield no extractable program_name are flagged in
 * scripts/verify/reverify-report.json for human review (and removal).
 *
 * Designed to be safe: NEVER edits programs.ts directly. Output is a report
 * + per-program JSON files. Use audit-strip.ts to apply removals.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=... npx tsx scripts/verify/re-verify.ts [--limit N] [--offset N] [--country UK]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "output");
const REPORT_PATH = join(__dirname, "reverify-report.jsonl");
const PROGRAMS_PATH = join(__dirname, "..", "..", "src", "data", "programs.ts");

interface Args { limit?: number; offset?: number; country?: string; concurrency?: number; }
function parseArgs(): Args {
  const a: Args = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const k = process.argv[i].replace(/^--/, "") as keyof Args;
    const v = process.argv[i + 1];
    if (k === "limit" || k === "offset" || k === "concurrency") (a[k] as number) = parseInt(v, 10);
    else (a as Record<string, string>)[k] = v;
  }
  return a;
}

/** Run a single verify-program.ts child as a Promise. Each child has its own
 *  Playwright browser + unique output slug, so concurrent runs cannot collide.
 *  The only shared resource is reverify-report.jsonl, which is appended
 *  line-by-line via appendFileSync (POSIX O_APPEND is atomic for small writes). */
function runOne(verifier: string, p: ExistingProgram): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(
      "npx",
      [
        "tsx", verifier,
        "--university", p.university_name,
        "--country", p.country,
        "--city", p.city,
        "--qs", String(p.qs_ranking ?? ""),
        "--field", p.field_of_study,
        "--url", p.program_url,
      ],
      { stdio: ["ignore", "ignore", "ignore"] }
    );
    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", () => resolve(1));
  });
}

interface ExistingProgram {
  university_name: string; country: string; city: string;
  qs_ranking: number | null;
  program_name: string; field_of_study: string;
  program_url: string;
}

/** Extract programs from programs.ts via regex. Tolerates both compact and pretty formats. */
function extractExisting(): ExistingProgram[] {
  const text = readFileSync(PROGRAMS_PATH, "utf8");
  const out: ExistingProgram[] = [];
  // Match top-level objects (depth 1)
  let depth = 0, start = -1, inStr = false, esc = false;
  // skip past PROGRAMS = (
  const arrOpen = text.indexOf("[", text.indexOf("PROGRAMS"));
  for (let i = arrOpen + 1; i < text.length; i++) {
    const c = text[i];
    if (esc) { esc = false; continue; }
    if (c === "\\") { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "{") { if (depth === 0) start = i; depth++; }
    else if (c === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        const block = text.slice(start, i + 1);
        const grab = (re: RegExp) => block.match(re)?.[1];
        const u = grab(/university_name:\s*"([^"]+)"/);
        const country = grab(/country:\s*"([^"]+)"/);
        const city = grab(/city:\s*"([^"]+)"/);
        const qs = grab(/qs_ranking:\s*(\d+|null)/);
        const pn = grab(/program_name:\s*"([^"]+)"/);
        const fos = grab(/field_of_study:\s*"([^"]+)"/);
        const url = grab(/program_url:\s*"([^"]+)"/);
        if (u && country && city && pn && fos && url) {
          out.push({
            university_name: u, country, city,
            qs_ranking: qs && qs !== "null" ? parseInt(qs, 10) : null,
            program_name: pn, field_of_study: fos, program_url: url,
          });
        }
        start = -1;
      }
    }
  }
  return out;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set"); process.exit(1);
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  const args = parseArgs();
  let progs = extractExisting();
  console.log(`Found ${progs.length} programs in programs.ts`);
  if (args.country) progs = progs.filter((p) => p.country === args.country);
  if (args.offset) progs = progs.slice(args.offset);
  if (args.limit) progs = progs.slice(0, args.limit);
  console.log(`Re-verifying ${progs.length} entries (country=${args.country ?? "all"}, offset=${args.offset ?? 0}, limit=${args.limit ?? "none"})`);

  const verifier = join(__dirname, "verify-program.ts");
  const stats = { ok: 0, mismatch: 0, http_fail: 0, no_program_name: 0, error: 0 };
  const concurrency = Math.max(1, args.concurrency ?? 1);
  console.log(`Concurrency: ${concurrency}`);

  let nextIdx = 0;
  let done = 0;
  async function worker() {
    while (true) {
      const i = nextIdx++;
      if (i >= progs.length) return;
      const p = progs[i];
      const status = await runOne(verifier, p);
      const reportLine = {
        idx: i, university: p.university_name, program: p.program_name,
        url: p.program_url, status,
        reason: status === 0 ? "verified"
          : status === 3 ? "field_mismatch"
          : status === 4 ? "no_program_name"
          : "fetch_or_api_error",
      };
      appendFileSync(REPORT_PATH, JSON.stringify(reportLine) + "\n");
      if (status === 0) stats.ok++;
      else if (status === 3) stats.mismatch++;
      else if (status === 4) stats.no_program_name++;
      else stats.error++;
      done++;
      if (done % 10 === 0 || done === progs.length) {
        process.stdout.write(`[${done}/${progs.length}] ok=${stats.ok} dead=${stats.no_program_name} mismatch=${stats.mismatch} err=${stats.error}\n`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  console.log(`\n──── Re-verify summary ────`);
  console.log(`OK:               ${stats.ok}`);
  console.log(`Field mismatch:   ${stats.mismatch}  (page does not match stated field — STRIP)`);
  console.log(`No program name:  ${stats.no_program_name}  (URL stale or page broken — STRIP)`);
  console.log(`Fetch/API error:  ${stats.error}  (retry later)`);
  console.log(`Report: ${REPORT_PATH}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
