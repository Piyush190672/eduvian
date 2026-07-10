// Prestige buckets: selectivity floors + explicit tier ceilings.
//
// Redesigned 10 July 2026 (Phase 1 algorithm rework, user-approved):
//
// The previous design achieved "elite universities are never Safe" by
// ARITHMETIC — a prestigePenalty (-20..0) subtracted inside scoreAcademic,
// stacked with a raised implicitMin AND a raised safeMin. The invariant
// held, but as an emergent side-effect: match_score stopped being
// comparable across universities, "Safe" at bucket 0 was unreachable by
// silent math rather than stated policy, and 5-20 point cliffs appeared
// at every bucket boundary.
//
// New design separates the two questions:
//   - "How well do you fit?"  → match_score, computed honestly with NO
//     prestige penalty. implicitMin (the academic bar a competitive
//     applicant clears) is the only selectivity input to the score.
//   - "How sure can anyone be?" → tierCeiling, an EXPLICIT rule:
//       bucket 0 (ultra-selective, ≤10% admit / QS ≤25):  Ambitious only.
//         Sub-10% admit rates reject 99th-percentile applicants on
//         cohort-shaping grounds; no profile makes admission likely.
//       bucket 1 (selective, ≤25% / QS ≤75):  never Safe (Reach cap).
//       buckets 2-4: all tiers reachable via thresholds.
//     The ceiling is surfaced to the UI so the rule can be explained in
//     one sentence ("Ultra-selective — we never label this Safe").
//
// Acceptance-rate source is gated to UNDERGRADUATE profiles: College
// Scorecard acceptance rates are undergrad admissions data. MIT admits
// ~4% of undergrads but many MIT masters admit 15-25% — bucketing PG
// programs (the platform's primary audience) by UG rates systematically
// over-penalised them. PG profiles bucket by QS rank until graduate
// admit data exists.

import type { Program, DegreeLevel } from "./types";
import { lookupUniversity } from "@/data/universities-helpers";

export type TierCeiling = "safe" | "reach" | "ambitious";

export interface PrestigeBucket {
  /** 0 = ultra-selective … 4 = open. For explainability + tests. */
  bucket: number;
  /** Highest tier a program in this bucket may receive. */
  tierCeiling: TierCeiling;
  /** match_score threshold for "safe" (only reachable when tierCeiling === "safe"). */
  safeMin: number;
  /** match_score threshold for "reach". */
  reachMin: number;
  /** Implicit academic minimum when the program publishes no min_gpa /
   *  min_percentage — the bar a competitive applicant clears. */
  implicitMin: number;
  /** Which source drove the bucket — for explainability / debugging. */
  source: "acceptance_rate" | "qs_ranking" | "default";
}

// Thresholds recalibrated for the penalty-free score scale (removing the
// old -20..-5 academic penalty raises scores by penalty × academic-weight
// ≈ +11 / +8 / +5.5 / +2.75 points at buckets 0-3):
//   bucket 0: ceiling ambitious — thresholds moot but kept coherent.
//   bucket 1: ceiling reach; reachMin 70 (was 66 on the penalised scale).
//   bucket 2: safe ≥ 88 (was 86), reach ≥ 65 (was 62).
//   bucket 3: safe ≥ 84 (was 82), reach ≥ 59 (was 57).
//   bucket 4: unchanged (penalty was already 0).
const BUCKETS: ReadonlyArray<Omit<PrestigeBucket, "source">> = [
  { bucket: 0, tierCeiling: "ambitious", safeMin: 999, reachMin: 999, implicitMin: 85 },
  { bucket: 1, tierCeiling: "reach",     safeMin: 999, reachMin: 70,  implicitMin: 78 },
  { bucket: 2, tierCeiling: "safe",      safeMin: 88,  reachMin: 65,  implicitMin: 70 },
  { bucket: 3, tierCeiling: "safe",      safeMin: 84,  reachMin: 59,  implicitMin: 60 },
  { bucket: 4, tierCeiling: "safe",      safeMin: 75,  reachMin: 50,  implicitMin: 50 },
] as const;

function bucketFromAcceptance(acceptPct: number): number {
  // Acceptance rate is the percentage admitted (0–100).
  if (acceptPct <= 10) return 0; // ultra-selective
  if (acceptPct <= 25) return 1; // selective
  if (acceptPct <= 50) return 2; // moderately selective
  if (acceptPct <= 75) return 3; // accessible
  return 4;                       // open / least selective
}

function bucketFromQs(qs: number): number {
  if (qs <= 25)  return 0;
  if (qs <= 75)  return 1;
  if (qs <= 200) return 2;
  if (qs <= 500) return 3;
  return 4;
}

/**
 * @param degreeLevel  The APPLICANT's level. Acceptance-rate bucketing
 *   only applies to undergraduate profiles (the data is UG admissions);
 *   postgraduate profiles bucket by QS rank. Omitted → legacy behaviour
 *   (acceptance first) for callers without profile context.
 */
export function getPrestigeBucket(program: Program, degreeLevel?: DegreeLevel): PrestigeBucket {
  const acceptanceApplies = degreeLevel !== "postgraduate";
  if (acceptanceApplies) {
    const uni = program.university_name ? lookupUniversity(program.university_name) : null;
    const accept = uni?.acceptance_rate;
    if (accept !== null && accept !== undefined && accept >= 0 && accept <= 100) {
      return { ...BUCKETS[bucketFromAcceptance(accept)], source: "acceptance_rate" };
    }
  }
  const qs = program.qs_ranking;
  if (typeof qs === "number" && qs > 0) {
    return { ...BUCKETS[bucketFromQs(qs)], source: "qs_ranking" };
  }
  // No usable selectivity data → least-restrictive defaults.
  return { ...BUCKETS[4], source: "default" };
}
