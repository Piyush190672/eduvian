import { describe, it, expect } from "vitest";
import {
  scoreStudentProfile,
  computeImprovementLevers,
} from "@/lib/profile-score";
import { mkProfile } from "./fixtures";

describe("pillar structure", () => {
  it("has three pillars whose weights sum to exactly 100", () => {
    const r = scoreStudentProfile(mkProfile());
    expect(r.pillars.map((p) => p.key)).toEqual(["admissibility", "financial", "visa"]);
    expect(r.pillars.reduce((s, p) => s + p.weight, 0)).toBe(100);
  });

  it("weights are identical for UG and PG (parity)", () => {
    const pg = scoreStudentProfile(mkProfile({ degree_level: "postgraduate" }));
    const ug = scoreStudentProfile(mkProfile({ degree_level: "undergraduate" }));
    expect(pg.pillars.map((p) => ({ k: p.key, w: p.weight }))).toEqual(
      ug.pillars.map((p) => ({ k: p.key, w: p.weight })),
    );
    expect(pg.criteria.map((c) => c.weight)).toEqual(ug.criteria.map((c) => c.weight));
  });

  it("pillar sub-scores are 0-100 and the flat criteria list still exists for email/PDF", () => {
    const r = scoreStudentProfile(mkProfile());
    for (const p of r.pillars) {
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(100);
    }
    expect(r.criteria.length).toBe(r.pillars.reduce((s, p) => s + p.criteria.length, 0));
  });

  it("dropped signals (researched universities, family abroad) are gone", () => {
    const labels = scoreStudentProfile(mkProfile()).criteria.map((c) => c.label.toLowerCase());
    expect(labels.some((l) => l.includes("research") && l.includes("universit"))).toBe(false);
    expect(labels.some((l) => l.includes("abroad"))).toBe(false);
  });

  it("gaming the dropped checkboxes no longer moves the score", () => {
    const base = scoreStudentProfile(mkProfile()).score;
    const gamed = scoreStudentProfile(
      mkProfile({ universities_researched: true, family_abroad: true }),
    ).score;
    expect(gamed).toBe(base);
  });
});

describe("graded test bands", () => {
  it("Duolingo scores points (was hardcoded 0)", () => {
    const withDuo = scoreStudentProfile(
      mkProfile({ english_test: "duolingo", english_score_overall: 130 }),
    );
    const noTest = scoreStudentProfile(
      mkProfile({ english_test: "none", english_score_overall: undefined }),
    );
    expect(withDuo.score).toBeGreaterThan(noTest.score);
  });

  it("ACT scores points for UG (was hardcoded 0)", () => {
    const base = { degree_level: "undergraduate" as const, work_experience_years: 0 };
    const withAct = scoreStudentProfile(
      mkProfile({ ...base, std_test_ug: "act", std_test_ug_score: 33 }),
    );
    const noTest = scoreStudentProfile(
      mkProfile({ ...base, std_test_ug: "none", std_test_ug_score: undefined }),
    );
    expect(withAct.score).toBeGreaterThan(noTest.score);
  });

  it("IELTS 6.5 now scores more than no test (was binary at 7.0)", () => {
    const midBand = scoreStudentProfile(mkProfile({ english_score_overall: 6.5 }));
    const noTest = scoreStudentProfile(
      mkProfile({ english_test: "none", english_score_overall: undefined }),
    );
    expect(midBand.score).toBeGreaterThan(noTest.score);
  });

  it("English bands are monotonic: 7.5 > 7.0 > 6.5", () => {
    const at = (s: number) => scoreStudentProfile(mkProfile({ english_score_overall: s })).score;
    expect(at(7.5)).toBeGreaterThan(at(7.0));
    expect(at(7.0)).toBeGreaterThan(at(6.5));
  });
});

describe("cgpa_10 academic score type", () => {
  it("9.2 CGPA lands the top academic band (same as 92%)", () => {
    const cgpa = scoreStudentProfile(mkProfile({ academic_score_type: "cgpa_10", academic_score: 9.2 }));
    const pct = scoreStudentProfile(mkProfile({ academic_score_type: "percentage", academic_score: 92 }));
    expect(cgpa.score).toBe(pct.score);
  });

  it("bands are monotonic across the CGPA scale", () => {
    const at = (s: number) =>
      scoreStudentProfile(mkProfile({ academic_score_type: "cgpa_10", academic_score: s })).score;
    expect(at(9.5)).toBeGreaterThan(at(8.7));
    expect(at(8.7)).toBeGreaterThan(at(7.8));
    expect(at(7.8)).toBeGreaterThan(at(5.5));
  });
});

describe("reweighting", () => {
  it("family income is worth 5 points (was 10)", () => {
    const income = scoreStudentProfile(mkProfile()).criteria.find((c) => c.label === "Family income");
    expect(income?.weight).toBe(5);
  });

  it("backlogs are worth 8 points (was 5)", () => {
    const backlogs = scoreStudentProfile(mkProfile()).criteria.find((c) => c.label === "Backlogs");
    expect(backlogs?.weight).toBe(8);
  });
});

describe("improvement levers", () => {
  it("returns at most 3, sorted by delta descending, all actionable", () => {
    const weak = mkProfile({
      english_test: "none",
      english_score_overall: undefined,
      std_test_pg: "none",
      std_test_pg_score: undefined,
      research_papers: false,
      work_experience_years: 0,
      passport_available: "no",
    });
    const levers = computeImprovementLevers(weak);
    expect(levers.length).toBeGreaterThan(0);
    expect(levers.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < levers.length; i++) {
      expect(levers[i - 1].delta).toBeGreaterThanOrEqual(levers[i].delta);
    }
    // History is never suggested as a lever.
    const keys = levers.map((l) => l.key);
    expect(keys).not.toContain("backlogs");
    expect(keys).not.toContain("income");
  });

  it("lever deltas match an actual re-score (english lever)", () => {
    const p = mkProfile({ english_test: "ielts", english_score_overall: 6.5 });
    const levers = computeImprovementLevers(p);
    const english = levers.find((l) => l.key === "english");
    expect(english).toBeDefined();
    const before = scoreStudentProfile(p).score;
    const after = scoreStudentProfile({ ...p, english_score_overall: 7.0 }).score;
    expect(english!.delta).toBe(after - before);
    expect(english!.href).toBe("/english-test-lab");
  });

  it("a maxed-out profile produces no english/std-test levers", () => {
    const maxed = mkProfile({
      english_score_overall: 8.0,
      std_test_pg_score: 335,
      research_papers: true,
      research_paper_count: 2,
      passport_available: "yes",
      target_intake_year: new Date().getFullYear(),
    });
    const keys = computeImprovementLevers(maxed).map((l) => l.key);
    expect(keys).not.toContain("english");
    expect(keys).not.toContain("std_test");
  });
});
