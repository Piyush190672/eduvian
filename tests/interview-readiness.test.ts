import { describe, it, expect } from "vitest";
import { parseCoverage, stripMarkdown } from "@/lib/interview-readiness";

const CHECKLIST = [
  "Name the specific course and university",
  "Explain why this course fits your background",
  "State who is funding your studies",
  "Career plan after graduation",
];

// Founder rule (14 Jul 2026): ≥75% key-point coverage → student is told
// they're ready for the interview; missing points are always named.
describe("parseCoverage — 75% readiness rule", () => {
  it("3 of 4 covered (75%) → ready, missing point named", () => {
    const r = parseCoverage("COVERAGE: covered=[1,2,4] missing=[3]\n\nWhat you did well:\n- x", CHECKLIST);
    expect(r).not.toBeNull();
    expect(r!.readiness.ready).toBe(true);
    expect(r!.readiness.coveredCount).toBe(3);
    expect(r!.readiness.missing).toEqual(["State who is funding your studies"]);
    expect(r!.rest).toMatch(/^What you did well/);
  });

  it("2 of 4 covered (50%) → not ready", () => {
    const r = parseCoverage("COVERAGE: covered=[1,2] missing=[3,4]\nrest", CHECKLIST);
    expect(r!.readiness.ready).toBe(false);
    expect(r!.readiness.missing).toHaveLength(2);
  });

  it("points keep priority order with per-point status", () => {
    const r = parseCoverage("COVERAGE: covered=[2,4] missing=[1,3]\nrest", CHECKLIST);
    expect(r!.readiness.points.map((p) => p.covered)).toEqual([false, true, false, true]);
    expect(r!.readiness.points.map((p) => p.text)).toEqual(CHECKLIST);
  });

  it("unclassified points count as missing (conservative)", () => {
    const r = parseCoverage("COVERAGE: covered=[1] missing=[2]\nrest", CHECKLIST);
    expect(r!.readiness.missing).toHaveLength(3); // 2 plus unclassified 3 & 4
    expect(r!.readiness.ready).toBe(false);
  });

  it("out-of-range and duplicate indices are ignored safely", () => {
    const r = parseCoverage("COVERAGE: covered=[1,1,9] missing=[2,3,4]\nrest", CHECKLIST);
    expect(r!.readiness.coveredCount).toBe(1);
    expect(r!.readiness.total).toBe(4);
  });

  it("malformed output → null (fall back to plain feedback, never invent a verdict)", () => {
    expect(parseCoverage("What you did well:\n- x", CHECKLIST)).toBeNull();
    expect(parseCoverage("COVERAGE: covered=1,2 missing=3\nrest", CHECKLIST)).toBeNull();
  });
});

describe("stripMarkdown — TTS must never hear 'hash hash' / 'asterisk'", () => {
  it("removes markdown symbols, keeps text", () => {
    expect(stripMarkdown("## What you did well\n**Great** _energy_ `code`")).toBe(
      "What you did well\nGreat energy code",
    );
  });
});
