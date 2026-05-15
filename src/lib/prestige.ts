// Prestige-adjusted academic penalty + tier thresholds.
//
// Replaces the previous hard-coded "QS rank → penalty" mapping with a
// two-source approach (14 May 2026):
//
//   1. If the program's university has a `acceptance_rate` in the
//      universities sidecar (Stage 2 populated 134 USA unis from College
//      Scorecard), use that — admit % is a more direct signal than QS
//      proxy.
//   2. Otherwise, fall back to the QS-ranking bucket the matcher used
//      before. This keeps every non-US program scoring identically to
//      what it scored yesterday until the Stage 3/4 sweeps populate
//      acceptance data for those geographies.
//
// Buckets are intentionally aligned across the two sources so a
// program's penalty/threshold doesn't jump when sidecar data becomes
// available — only the BASIS of the bucketing changes.

import type { Program } from "./types";
import { lookupUniversity } from "@/data/universities-helpers";

export interface PrestigeBucket {
  /** Subtractive penalty applied to scoreAcademic. 0–20. */
  prestigePenalty: number;
  /** match_score threshold below which a program is "reach" instead of "safe". */
  safeMin: number;
  /** match_score threshold below which a program is "ambitious" instead of "reach". */
  reachMin: number;
  /** Implicit academic minimum for this bucket — used by scoreAcademic
   *  when the program publishes no min_gpa / min_percentage. Higher for
   *  selective unis, lower for open. */
  implicitMin: number;
  /** Which source drove the bucket — for explainability / debugging. */
  source: "acceptance_rate" | "qs_ranking" | "default";
}

/**
 * Bucket calibration. The five tiers below are aligned so:
 *   - bucket 0 (most selective)  ≈ Harvard / MIT / Stanford  → penalty 20, safe 92, reach 70
 *   - bucket 1                   ≈ Cornell / UCLA / Duke     → penalty 15, safe 89, reach 66
 *   - bucket 2                   ≈ NYU / USC / UT-Austin     → penalty 10, safe 86, reach 62
 *   - bucket 3                   ≈ ASU / OSU / mid-tier      → penalty  5, safe 82, reach 57
 *   - bucket 4 (least selective) ≈ regional state / open     → penalty  0, safe 75, reach 50
 *
 * Buckets land at the same numerical bands when sourced from QS rank
 * vs acceptance rate so a program's threshold doesn't jump as Stage
 * 3/4 sweeps land more data — only the basis of the bucketing changes.
 */
// Each bucket carries:
//   - prestigePenalty : subtractive offset on the academic signal
//   - safeMin / reachMin : tier thresholds on match_score
//   - implicitMin : the "what a competitive applicant scores" % bar
//                   used by scoreAcademic when the program publishes
//                   no min. Lower-prestige unis have a lower bar —
//                   that's what lets a 60 % student score as Safe at
//                   QS > 500 and Ambitious at Cambridge from the same
//                   formula. (15 May 2026, user-requested.)
const BUCKETS = [
  { prestigePenalty: 20, safeMin: 92, reachMin: 70, implicitMin: 85 },
  { prestigePenalty: 15, safeMin: 89, reachMin: 66, implicitMin: 78 },
  { prestigePenalty: 10, safeMin: 86, reachMin: 62, implicitMin: 70 },
  { prestigePenalty: 5,  safeMin: 82, reachMin: 57, implicitMin: 60 },
  { prestigePenalty: 0,  safeMin: 75, reachMin: 50, implicitMin: 50 },
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
  // Tighter than the legacy buckets — the old code drifted toward 7 bands;
  // collapsed to 5 to align with acceptance-rate-derived tiers above.
  if (qs <= 25)  return 0;
  if (qs <= 75)  return 1;
  if (qs <= 200) return 2;
  if (qs <= 500) return 3;
  return 4;
}

export function getPrestigeBucket(program: Program): PrestigeBucket {
  const uni = program.university_name ? lookupUniversity(program.university_name) : null;
  const accept = uni?.acceptance_rate;
  if (accept !== null && accept !== undefined && accept >= 0 && accept <= 100) {
    return { ...BUCKETS[bucketFromAcceptance(accept)], source: "acceptance_rate" };
  }
  const qs = program.qs_ranking;
  if (typeof qs === "number" && qs > 0) {
    return { ...BUCKETS[bucketFromQs(qs)], source: "qs_ranking" };
  }
  // No QS rank, no sidecar data → least-restrictive defaults.
  return { ...BUCKETS[4], source: "default" };
}
