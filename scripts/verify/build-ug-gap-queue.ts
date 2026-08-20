/**
 * build-ug-gap-queue.ts — Phase 0 (free) for the July 2026 UG gap campaign.
 *
 * Founder request (14 Jul 2026): add undergraduate programs for France,
 * Netherlands, Singapore, Germany, Malaysia, New Zealand, Ireland and UAE
 * across STEM + adjacencies, business, economics, IR, public policy,
 * healthcare, biotech, biomedicine, architecture, medicine, humanities,
 * environmental studies and renewable energy.
 *
 * Emits the same per-uni {university, country, city, qs_ranking,
 * missing_fields} shape gap-6fields-seed-finder.ts consumes, ordered
 * WORST-GAP-FIRST (founder sequencing) so a capped budget is spent on the
 * emptiest cells rather than topping up already-healthy ones.
 *
 * TARGETING (rewritten 14 Jul 2026 after a 9-uni pilot burned $3.22 for a
 * single seed). Raw worst-gap-first sorted PG-ONLY institutions to the very
 * top — INSEAD, HEC Paris, EDHEC, Frankfurt School — precisely BECAUSE they
 * are missing every undergraduate field: they have no undergraduates at all.
 * We were paying Sonnet to confirm that an MBA school has no bachelor's in
 * Renewable Energy.
 *
 * The queue is now evidence-gated to cells with real prior probability:
 *   1. the university must already have undergraduate programs (proves it
 *      teaches undergrads), and
 *   2. it must already have a POSTGRADUATE program in that exact field
 *      (proves the discipline is taught there).
 * A (uni × field) cell meeting both is a plausible real gap in OUR data
 * rather than a gap in the world. Worst-gap-first still orders what remains,
 * so the founder's sequencing is preserved inside a set worth searching.
 *
 * Usage: npx tsx scripts/verify/build-ug-gap-queue.ts [--max-fields N]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PROGRAMS } from "../../src/data/programs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "catalogs", "gap-queue-ug-2026-07.json");

const COUNTRIES = [
  "France", "Netherlands", "Singapore", "Germany",
  "Malaysia", "New Zealand", "Ireland", "UAE",
];

/** The founder's field list mapped onto our 31-field taxonomy. */
const FIELDS = [
  // STEM + adjacencies
  "Computer Science & IT", "Artificial Intelligence", "Data Science",
  "Cybersecurity", "Engineering (Mechanical/Civil/Electrical)",
  "Natural Sciences", "Architecture", "Renewable Energy",
  // Business / economics
  "Business & Management", "Economics & Finance", "Business Analytics", "FinTech",
  // Policy / humanities
  "International Relations", "Public Policy & Administration",
  "Social Sciences & Humanities",
  // Health / life sciences
  "Medicine", "Public Health", "Nursing & Allied Health",
  "Biotechnology & Life Sciences", "Biomedicine",
  // Environment
  "Environmental & Sustainability Studies",
];

const arg = (k: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const MAX_FIELDS = parseInt(arg("max-fields") ?? "6", 10);

const ug = PROGRAMS.filter((p) => p.degree_level === "undergraduate");

// Global UG scarcity per field across the 8 countries — drives ordering.
const scarcity = new Map<string, number>();
for (const f of FIELDS) {
  scarcity.set(f, ug.filter((p) => COUNTRIES.includes(p.country) && p.field_of_study === f).length);
}

// Universities we already carry in these countries — we only seed-hunt at
// institutions known to be real, in scope, AND teaching undergraduates.
interface Uni { university: string; country: string; city: string; qs_ranking: number | null }
const unis = new Map<string, Uni>();
for (const p of PROGRAMS) {
  if (!COUNTRIES.includes(p.country)) continue;
  const key = `${p.university_name}|${p.country}`;
  if (!unis.has(key)) {
    unis.set(key, {
      university: p.university_name,
      country: p.country,
      city: p.city ?? "",
      qs_ranking: p.qs_ranking ?? null,
    });
  }
}

// A field is "missing" at a uni when that uni has no UG program in it.
const haveUG = new Set(
  ug.map((p) => `${p.university_name}|${p.country}|${p.field_of_study}`),
);
// …and worth hunting only when the uni already teaches that field at PG.
const havePG = new Set(
  PROGRAMS.filter((p) => p.degree_level === "postgraduate")
    .map((p) => `${p.university_name}|${p.country}|${p.field_of_study}`),
);
// Institutions with no undergraduate provision at all (INSEAD, HEC, EDHEC,
// Frankfurt School, …) are excluded outright — see TARGETING above.
const teachesUG = new Set(ug.map((p) => `${p.university_name}|${p.country}`));

const queue: (Uni & { missing_fields: string[] })[] = [];
let skippedPgOnly = 0;
for (const u of unis.values()) {
  const uniKey = `${u.university}|${u.country}`;
  if (!teachesUG.has(uniKey)) { skippedPgOnly++; continue; }
  const missing = FIELDS
    .filter((f) => !haveUG.has(`${uniKey}|${f}`) && havePG.has(`${uniKey}|${f}`))
    // Worst global gap first, so a capped run buys the scarcest fields.
    .sort((a, b) => (scarcity.get(a)! - scarcity.get(b)!))
    .slice(0, MAX_FIELDS);
  if (missing.length) queue.push({ ...u, missing_fields: missing });
}

// Universities that are themselves the emptiest go first.
queue.sort((a, b) => {
  const aw = a.missing_fields.reduce((s, f) => s + scarcity.get(f)!, 0);
  const bw = b.missing_fields.reduce((s, f) => s + scarcity.get(f)!, 0);
  return aw - bw;
});

writeFileSync(OUT, JSON.stringify(queue, null, 2));

console.log("UG gap queue (worst-gap-first)");
console.log("─".repeat(58));
console.log("Field scarcity across the 8 countries (UG programs held):");
for (const [f, n] of [...scarcity.entries()].sort((a, b) => a[1] - b[1])) {
  console.log(`  ${String(n).padStart(4)}  ${f}`);
}
const cells = queue.reduce((s, u) => s + u.missing_fields.length, 0);
console.log("─".repeat(58));
console.log(`universities queued: ${queue.length} of ${unis.size}  (${skippedPgOnly} skipped: no UG provision at all)`);
const perField = new Map<string, number>();
for (const u of queue) for (const f of u.missing_fields) perField.set(f, (perField.get(f) ?? 0) + 1);
console.log("cells per field (what the budget will actually hunt):");
for (const [f, n] of [...perField.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${f}`);
}
console.log(`(uni × field) cells to hunt: ${cells}  [capped at ${MAX_FIELDS} fields/uni]`);
console.log(`est. seed-finding spend @ $0.152/uni: $${(queue.length * 0.152).toFixed(2)}`);
console.log(`written: ${OUT}`);
