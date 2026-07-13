/**
 * Key-point coverage → interview-readiness verdict for the Interview Coach
 * (founder rule, 14 Jul 2026): every question carries a priority-ordered
 * list of official key points (from the approved knowledge files); a student
 * covering ≥75% of them is told they're ready for the interview, with the
 * missing points called out. The model reports coverage as index lists —
 * the threshold decision is deterministic and lives here, not in the model.
 */

/** Coverage a student needs across the question's key points to be told
 *  they're interview-ready. */
export const READY_THRESHOLD = 0.75;

export interface FeedbackReadiness {
  ready: boolean;
  total: number;
  coveredCount: number;
  /** Every key point in priority order, with coverage status. */
  points: { text: string; covered: boolean }[];
  /** Key points still missing, in priority order (spoken feedback). */
  missing: string[];
}

/** Model output sometimes leaks markdown (## / **) which the client TTS
 *  reads aloud as "hash hash" / "asterisk" (founder report, 14 Jul 2026).
 *  Strip it at the source; the client keeps its own net. Bullet dashes
 *  at line starts are part of the response format and stay. */
export function stripMarkdown(text: string): string {
  return text.replace(/[#*_`~]+/g, "").replace(/[ \t]+\n/g, "\n").replace(/^[ \t]+/gm, "");
}

/** Parse the model's first-line coverage report ("COVERAGE: covered=[1,3] missing=[2]")
 *  against the numbered checklist. Returns null on any malformed output so the
 *  caller falls back to plain feedback rather than inventing a verdict. */
export function parseCoverage(
  text: string,
  checklist: string[],
): { readiness: FeedbackReadiness; rest: string } | null {
  const m = text.match(/^\s*COVERAGE:\s*covered=\[([\d,\s]*)\]\s*missing=\[([\d,\s]*)\]\s*\n?/);
  if (!m) return null;
  const toIdx = (s: string) =>
    s.split(",").map((x) => parseInt(x.trim(), 10)).filter((n) => Number.isInteger(n) && n >= 1 && n <= checklist.length);
  const coveredIdx = [...new Set(toIdx(m[1]))].sort((a, b) => a - b);
  const missingIdx = [...new Set(toIdx(m[2]))].filter((n) => !coveredIdx.includes(n)).sort((a, b) => a - b);
  // Every checklist point must be accounted for exactly once; anything the
  // model forgot to classify counts as missing (conservative).
  for (let n = 1; n <= checklist.length; n++) {
    if (!coveredIdx.includes(n) && !missingIdx.includes(n)) missingIdx.push(n);
  }
  missingIdx.sort((a, b) => a - b);
  const readiness: FeedbackReadiness = {
    ready: coveredIdx.length / checklist.length >= READY_THRESHOLD,
    total: checklist.length,
    coveredCount: coveredIdx.length,
    points: checklist.map((text, i) => ({ text, covered: coveredIdx.includes(i + 1) })),
    missing: missingIdx.map((n) => checklist[n - 1]),
  };
  return { readiness, rest: text.slice(m[0].length) };
}
