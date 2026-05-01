/**
 * audit-haiku-vs-opus.ts
 *
 * Re-runs verify-program.ts on a sample of already-Opus-verified entries and
 * compares the new model's extracted JSON against Opus's. The integrity-
 * critical metric is FABRICATION: did the new model invent a value where Opus
 * (correctly) returned null? Any non-zero count there means we cannot use the
 * new model in this pipeline.
 *
 * Usage: npx tsx scripts/verify/audit-haiku-vs-opus.ts
 *
 * History: Haiku 4.5 failed this audit — fabricated an apply_url for a CMU
 * computational biology page. Sonnet 4.6 is the lowest tier that passes.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "output");

const SAMPLES = [
  "carnegie-mellon-university-m-s-in-computational-biology.json",
  "cornell-university-plant-biotechnology-concentration-within-the-integrative-plant-science-mps.json",
  "dalhousie-university-applied-computer-science-macsc.json",
  "edhec-business-school-msc-in-financial-engineering.json",
  "escp-business-school-bachelor-in-management-bsc.json",
  // Add a few more rich entries for broader sample
  "harvard-university-computer-science-phd.json",
  "harvard-university-j-d-program.json",
  "imperial-college-london-msc-artificial-intelligence.json",
];

const FIELDS = [
  "program_name", "degree_level", "duration_months", "annual_tuition_usd",
  "application_deadline", "min_gpa", "min_percentage", "min_ielts", "min_toefl",
  "min_pte", "min_duolingo", "min_gre", "min_gmat", "min_sat",
  "work_exp_required_years", "specialization", "apply_url",
];

interface VerifierOutput { [k: string]: unknown }

function runHaiku(opus: VerifierOutput): VerifierOutput | null {
  const r = spawnSync(
    "npx",
    [
      "tsx", join(__dirname, "verify-program.ts"),
      "--university", String(opus.university_name),
      "--country", String(opus.country),
      "--city", String(opus.city),
      "--qs", String(opus.qs_ranking ?? ""),
      "--field", String(opus.field_of_study),
      "--url", String(opus.program_url),
    ],
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }
  );
  if (r.status !== 0) {
    console.error(`  haiku run failed: status=${r.status}`);
    return null;
  }
  const out = r.stdout;
  const i = out.indexOf("{");
  if (i < 0) return null;
  return JSON.parse(out.slice(i));
}

function compare(opus: VerifierOutput, haiku: VerifierOutput, label: string) {
  const diffs: { field: string; opus: unknown; haiku: unknown; severity: "minor" | "drift" | "fabrication" | "loss" }[] = [];
  for (const f of FIELDS) {
    const o = opus[f] ?? null;
    const h = haiku[f] ?? null;
    if (JSON.stringify(o) === JSON.stringify(h)) continue;
    let severity: "minor" | "drift" | "fabrication" | "loss" = "drift";
    if (o == null && h != null) severity = "fabrication"; // haiku adds a value opus said null — INTEGRITY RISK
    else if (o != null && h == null) severity = "loss";   // haiku misses something opus got
    else if (typeof o === "string" && typeof h === "string") severity = "minor"; // small wording diff
    else if (typeof o === "number" && typeof h === "number" && Math.abs((o as number) - (h as number)) <= 1) severity = "minor";
    diffs.push({ field: f, opus: o, haiku: h, severity });
  }
  console.log(`\n── ${label} ──`);
  if (diffs.length === 0) {
    console.log(`  ✓ identical (${FIELDS.length} fields match)`);
    return diffs;
  }
  for (const d of diffs) {
    const sym = d.severity === "fabrication" ? "❌ FABRICATION" : d.severity === "loss" ? "⚠ loss" : d.severity === "minor" ? "≈ minor" : "·  drift";
    console.log(`  ${sym} ${d.field}: opus=${JSON.stringify(d.opus)} haiku=${JSON.stringify(d.haiku)}`);
  }
  return diffs;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set"); process.exit(1); }
  console.log(`Auditing Haiku output against ${SAMPLES.length} Opus baselines.\n`);
  let totalFabrications = 0, totalLosses = 0, totalMinor = 0, totalIdentical = 0;
  for (const slug of SAMPLES) {
    const path = join(OUT_DIR, slug);
    let opus: VerifierOutput;
    try { opus = JSON.parse(readFileSync(path, "utf8")); }
    catch { console.error(`  Could not load baseline ${slug}`); continue; }
    const label = `${opus.university_name} :: ${opus.program_name}`;
    process.stderr.write(`[run] ${label}\n`);
    const haiku = runHaiku(opus);
    if (!haiku) { console.log(`\n── ${label} ── HAIKU FAILED`); continue; }
    const diffs = compare(opus, haiku, label as string);
    if (diffs.length === 0) totalIdentical++;
    totalFabrications += diffs.filter((d) => d.severity === "fabrication").length;
    totalLosses += diffs.filter((d) => d.severity === "loss").length;
    totalMinor += diffs.filter((d) => d.severity === "minor" || d.severity === "drift").length;
  }
  console.log(`\n── Summary ──`);
  console.log(`  ❌ Fabrications (haiku invents value where opus said null): ${totalFabrications}`);
  console.log(`  ⚠  Losses (haiku misses value opus extracted):              ${totalLosses}`);
  console.log(`  ≈  Minor / drift (different but compatible):                ${totalMinor}`);
  console.log(`  ✓  Identical entries:                                       ${totalIdentical}/${SAMPLES.length}`);
  if (totalFabrications > 0) {
    console.log(`\n  ❌ Haiku is INVENTING values. Do NOT use Haiku for this pipeline.`);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
