// Smoke test for §35.17 threshold tuning — PG / CS / fall.
// Profile is a "strong applicant" (GPA 3.8, GRE 325, IELTS 7.5, 1yr exp) so we
// can see how scoring at TOP-100 schools behaves now that realistic_min_*
// data is in play. Prints sorted by qs ranking, per-program academic score
// component + tier assignment for the top 20 matches.

import { recommendPrograms } from "@/lib/scoring";
import type { StudentProfile, Program } from "@/lib/types";
import { PROGRAMS as RAW } from "@/data/programs";
const programs = (RAW as Program[]).map((p, i) => ({ ...p, id: `prog_${i}`, is_active: true, last_updated: new Date().toISOString() })) as Program[];

const profile: StudentProfile = {
  full_name: "Smoke Test",
  email: "smoke@test",
  phone: "+0",
  nationality: "Indian",
  city: "Mumbai",
  passport_available: "yes",
  visa_history: "never_applied",
  family_abroad: false,
  family_income_inr: "20L_40L",
  degree_level: "undergraduate",
  current_degree: "12th Grade",
  major_stream: "Science (PCM)",
  institution_name: "DPS RK Puram",
  graduation_year: 2026,
  academic_score_type: "percentage",
  academic_score: 88,
  backlogs: false,
  backlog_count: 0,
  academic_gap: false,
  english_test: "ielts",
  english_score_overall: 7.0,
  std_test_ug: "sat",
  std_test_ug_score: 1450,
  country_preferences: ["US", "GB", "CA", "AU", "DE", "SG", "IE", "NZ", "FR"],
  target_intake_year: 2026,
  target_intake_semester: "fall",
  budget_range: "above_70k",
  intended_field: "Engineering (Mechanical/Civil/Electrical)",
  qs_ranking_preference: "any",
  post_study_work_visa: false,
};

const matches = recommendPrograms(profile, programs as Program[]);

console.log(`\nMatches returned: ${matches.length}\n`);

const header = [
  "QS".padStart(4),
  "Score".padStart(5),
  "Tier".padEnd(10),
  "Acad".padStart(5),
  "minGPA",
  "realGPA",
  "Country".padEnd(11),
  "Program",
].join("  ");
console.log(header);
console.log("-".repeat(140));

for (const m of matches) {
  const row = [
    String(m.qs_ranking ?? "—").padStart(4),
    String(m.match_score).padStart(5),
    m.tier.padEnd(10),
    String(m.score_breakdown.academic).padStart(5),
    String(m.min_gpa ?? "—").padEnd(6),
    String(m.realistic_min_gpa ?? "—").padEnd(7),
    (m.country ?? "").padEnd(11),
    `${m.university_name} · ${m.program_name}`,
  ].join("  ");
  console.log(row);
}

console.log("\n--- Tier distribution ---");
const tierCounts = matches.reduce<Record<string, number>>((acc, m) => {
  acc[m.tier] = (acc[m.tier] ?? 0) + 1;
  return acc;
}, {});
console.log(tierCounts);

// All scored programs (not just top 20) — by QS bucket to see the prestige
// effect across the full filtered set.
import { scoreProgram } from "@/lib/scoring";
const fullScored = (programs as Program[])
  .filter((p) =>
    p.is_active &&
    p.degree_level === "undergraduate" &&
    p.field_of_study === "Engineering (Mechanical/Civil/Electrical)" &&
    (p.intake_semesters?.includes("fall") ?? true) &&
    p.annual_tuition_usd != null
  )
  .map((p) => scoreProgram(profile, p));

const buckets: Array<{ label: string; min: number; max: number }> = [
  { label: "QS 1-25",     min: 1,    max: 25   },
  { label: "QS 26-50",    min: 26,   max: 50   },
  { label: "QS 51-100",   min: 51,   max: 100  },
  { label: "QS 101-200",  min: 101,  max: 200  },
  { label: "QS 201-400",  min: 201,  max: 400  },
  { label: "QS 401-700",  min: 401,  max: 700  },
  { label: "QS 701+",     min: 701,  max: 9998 },
  { label: "Unranked",    min: 9999, max: 99999 },
];

console.log("\n--- Full scored set (PG CS, fall-or-intake-empty, has tuition) by QS bucket ---");
console.log("bucket          n   safe  reach  amb  | min-score  med-score  max-score  med-acad");
console.log("-".repeat(95));
for (const b of buckets) {
  const inB = fullScored.filter((p) => (p.qs_ranking ?? 9999) >= b.min && (p.qs_ranking ?? 9999) <= b.max);
  if (inB.length === 0) continue;
  const tally = { safe: 0, reach: 0, ambitious: 0 };
  for (const p of inB) tally[p.tier]++;
  const scores = inB.map((p) => p.match_score).sort((a, b) => a - b);
  const acads  = inB.map((p) => p.score_breakdown.academic).sort((a, b) => a - b);
  const med = (arr: number[]) => arr[Math.floor(arr.length / 2)];
  console.log(
    b.label.padEnd(15),
    String(inB.length).padStart(3),
    " ",
    String(tally.safe).padStart(4),
    String(tally.reach).padStart(5),
    String(tally.ambitious).padStart(4),
    " | ",
    String(scores[0]).padStart(8),
    String(med(scores)).padStart(9),
    String(scores[scores.length - 1]).padStart(9),
    String(med(acads)).padStart(9),
  );
}
