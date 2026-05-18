/**
 * diagnose-shortlist.ts — debug a single submission's matcher funnel.
 *
 * Given a submission token (the value in the /results/[token] URL),
 * loads + decrypts the profile, then runs the matcher's hard-filter
 * chain step-by-step printing how many programs survive each filter.
 *
 * Use when a user reports an unexpectedly small shortlist. The output
 * pinpoints which filter collapsed the pool.
 *
 * Required env (in .env.local):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   PII_ENCRYPTION_KEY
 *   PII_HASH_SECRET
 *
 * Usage:
 *   npx tsx scripts/debug/diagnose-shortlist.ts <token>
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { recommendPrograms } from "@/lib/scoring";
import { PROGRAMS } from "@/data/programs";
import { decryptProfile } from "@/lib/submissions-decrypt";
import { TARGET_COUNTRIES, BUDGET_VALUES, OTHER_FIELD_SENTINEL } from "@/lib/types";
import type { Program, StudentProfile } from "@/lib/types";

config({ path: ".env.local" });

const token = process.argv[2];
if (!token) { console.error("Usage: tsx scripts/debug/diagnose-shortlist.ts <token>"); process.exit(1); }

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local"); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("token", token)
    .single();
  if (error || !data) { console.error("Submission not found:", error?.message); process.exit(1); }

  const profile = decryptProfile(data) as StudentProfile | null;
  if (!profile) { console.error("Profile decryption failed — H7 keys correct?"); process.exit(1); }

  console.log("\n── Profile inputs (the matcher sees these) ──");
  console.log(`  degree_level:               ${profile.degree_level}`);
  console.log(`  intended_field:             ${profile.intended_field}${profile.intended_field === OTHER_FIELD_SENTINEL ? ` (custom: "${profile.intended_field_custom}")` : ""}`);
  console.log(`  intended_field_extra:       ${JSON.stringify(profile.intended_field_extra ?? [])}`);
  console.log(`  country_preferences:        ${JSON.stringify(profile.country_preferences)}`);
  console.log(`  country_region_preferences: ${JSON.stringify(profile.country_region_preferences ?? {})}`);
  console.log(`  qs_ranking_preference:      ${profile.qs_ranking_preference}`);
  console.log(`  budget_range:               ${profile.budget_range}  ($${BUDGET_VALUES[profile.budget_range] ?? "?"} max)`);
  console.log(`  target_intake_semester:     ${profile.target_intake_semester}`);
  console.log(`  target_intake_year:         ${profile.target_intake_year}`);
  console.log(`  academic_score:             ${profile.academic_score} (${profile.academic_score_type})`);
  console.log(`  post_study_work_visa:       ${profile.post_study_work_visa}`);
  console.log(`  canada_college_types:       ${JSON.stringify(profile.canada_college_types ?? [])}`);
  console.log(`  bps_accredited:             ${profile.bps_accredited}`);
  if (profile.intended_field === "MBA") {
    console.log(`  mba_team_leading:           ${profile.mba_team_leading_experience}`);
    console.log(`  mba_max_team_size:          ${profile.mba_max_team_size}`);
  }

  console.log("\n── Hard-filter funnel ──");
  const programs: Program[] = PROGRAMS.map((p, i) => ({
    ...p,
    id: `prog_${i}`,
    is_active: true,
    last_updated: new Date().toISOString(),
  })) as Program[];

  // Replicate each filter step in scoring.ts:recommendPrograms hard-filter block.
  let pool = programs.slice();
  const log = (label: string) => console.log(`  ${pool.length.toString().padStart(5)} after ${label}`);
  log("start (all programs)");

  pool = pool.filter((p) => p.is_active);
  log("is_active");

  // Degree level
  const canadaSelected = profile.country_preferences.includes("CA");
  const canadaCollegeTypes = new Set(profile.canada_college_types ?? []);
  pool = pool.filter((p) => {
    const isCanadian = p.country === "Canada";
    if (p.degree_level === "both") return true;
    if (p.degree_level === "diploma" || p.degree_level === "pg_diploma") {
      return isCanadian && canadaSelected && canadaCollegeTypes.has(p.degree_level);
    }
    return p.degree_level === profile.degree_level;
  });
  log(`degree_level=${profile.degree_level}`);

  // Field of study
  const isCustomField = profile.intended_field === OTHER_FIELD_SENTINEL;
  const customQuery = isCustomField ? (profile.intended_field_custom ?? "").trim().toLowerCase() : "";
  const allowedFields = isCustomField ? null : new Set<string>([
    profile.intended_field,
    ...(profile.intended_field_extra ?? []),
  ].filter((f): f is string => typeof f === "string" && f.length > 0));
  pool = pool.filter((p) => {
    if (isCustomField) {
      if (!customQuery) return false;
      return `${p.field_of_study} ${p.program_name}`.toLowerCase().includes(customQuery);
    }
    if (allowedFields!.has(p.field_of_study)) return true;
    // alias check (loose — diagnostic only)
    if (p.field_aliases?.length) {
      for (const a of p.field_aliases) if (allowedFields!.has(a)) return true;
    }
    return false;
  });
  log(`field_of_study (allowed: ${isCustomField ? `custom "${customQuery}"` : Array.from(allowedFields ?? []).join(", ")})`);

  // BPS Psychology
  if (profile.intended_field === "Psychology" && profile.degree_level === "postgraduate" && profile.bps_accredited === false) {
    pool = pool.filter((p) => !p.requires_bps_accreditation);
    log("BPS accreditation (Psychology PG, non-BPS bachelor)");
  }

  // Countries
  const allowedCountries = new Set(
    profile.country_preferences.map((code) => TARGET_COUNTRIES.find((t) => t.code === code)?.name).filter(Boolean) as string[],
  );
  if (allowedCountries.size > 0) {
    pool = pool.filter((p) => allowedCountries.has(p.country));
    log(`country_preferences (${Array.from(allowedCountries).join(", ")})`);
  }

  // QS
  const qsThresholdMap: Record<string, number> = { top_50: 50, top_100: 100, top_200: 200, top_500: 500 };
  const qsMax = qsThresholdMap[profile.qs_ranking_preference ?? "any"];
  if (qsMax !== undefined) {
    pool = pool.filter((p) => p.qs_ranking !== null && p.qs_ranking <= qsMax);
    log(`qs_ranking ≤ ${qsMax}`);
  }

  // PSW
  if (profile.post_study_work_visa === true) {
    const PSW = new Set(["UK", "Australia", "Canada", "USA", "Germany", "Ireland", "New Zealand"]);
    const sub = /\b(PgCert|PgDip|Postgraduate Certificate|Postgraduate Diploma|Graduate Certificate|Graduate Diploma|Foundation Degree|HND|HNC)\b/i;
    pool = pool.filter((p) => {
      if (!PSW.has(p.country)) return false;
      if (p.degree_level === "diploma" || p.degree_level === "pg_diploma") return false;
      if (sub.test(p.program_name)) return false;
      return true;
    });
    log("post_study_work_visa required");
  }

  // Region
  const nameToCode = Object.fromEntries(TARGET_COUNTRIES.map((t) => [t.name, t.code]));
  if (profile.country_region_preferences && Object.keys(profile.country_region_preferences).length > 0) {
    const beforeRegion = pool.length;
    // skip simulation — region matching is heavy. Just count and warn.
    const hasRegionFilter = Object.entries(profile.country_region_preferences).some(([, v]) => v && v.length > 0);
    if (hasRegionFilter) {
      console.log(`  (region filter present — see country_region_preferences above; could narrow further)`);
    }
    void beforeRegion;
    void nameToCode;
  }

  // ── Now run the FULL matcher and count tiers in the final output ──
  console.log("\n── Final matcher output (with scoring + tier hard filters + per-uni cap) ──");
  const finalScored = recommendPrograms(profile as StudentProfile, programs, 2);
  console.log(`  Total returned: ${finalScored.length}  (matcher's max is 40 across both pages)`);
  const tiers = { safe: 0, reach: 0, ambitious: 0 };
  const uniSet = new Set<string>();
  for (const p of finalScored) {
    tiers[p.tier]++;
    uniSet.add(p.university_name);
  }
  console.log(`  Safe: ${tiers.safe}   Reach: ${tiers.reach}   Ambitious: ${tiers.ambitious}`);
  console.log(`  Distinct universities: ${uniSet.size}`);
  console.log(`  First 10 (programs):`);
  for (const p of finalScored.slice(0, 10)) {
    console.log(`    [${p.tier.padStart(9)}] ${p.match_score}  ${p.university_name}  —  ${p.program_name}`);
  }

  console.log("\n── Diagnosis hints ──");
  if (finalScored.length === 0) console.log("  EMPTY shortlist. Check which filter step above dropped the pool to zero.");
  else if (finalScored.length < 6) console.log("  Small shortlist (<6). Likely culprits:");
  else console.log("  Healthy shortlist.");
  if (allowedCountries.size === 1) console.log(`  - Only 1 country preference (${[...allowedCountries][0]}) — narrow pool by definition.`);
  if (qsMax !== undefined) console.log(`  - QS rank ≤ ${qsMax} excludes the ~${pool.length === 0 ? "many" : ""} unranked / lower-ranked programs.`);
  if (profile.post_study_work_visa === true) console.log("  - PSW required excludes ~25% of programs (non-PSW countries + sub-degree credentials).");
  if (profile.budget_range === "under_20k") console.log("  - under_20k budget excludes most US/UK/AU programs after the 110% hard cap.");
  if (profile.target_intake_semester) console.log(`  - Intake "${profile.target_intake_semester}" excludes programs whose intake_semesters list doesn't include it.`);
  if (profile.academic_score && profile.academic_score < 70) console.log(`  - Academic score ${profile.academic_score} excludes programs with published min above it (+ falls below the bucket's implicitMin floor).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
