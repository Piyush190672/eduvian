import { describe, it, expect } from "vitest";
import { scoreProgram, recommendPrograms } from "@/lib/scoring";
import { mkProfile, mkProgram } from "./fixtures";

const perfectProfile = () =>
  mkProfile({
    academic_score: 100,
    english_score_overall: 9,
    std_test_pg_score: 340,
    work_experience_years: 6,
    research_papers: true,
    research_paper_count: 3,
  });

describe("tier ceilings (elite is never Safe — explicit rule)", () => {
  it("bucket 0 (QS ≤ 25) is ALWAYS Ambitious, even for a perfect profile", () => {
    const scored = scoreProgram(perfectProfile(), mkProgram({ qs_ranking: 5 }));
    expect(scored.tier).toBe("ambitious");
    expect(scored.prestige?.bucket).toBe(0);
    expect(scored.prestige?.tierCeiling).toBe("ambitious");
  });

  it("bucket 1 (QS 26-75) can be Reach but never Safe", () => {
    const scored = scoreProgram(perfectProfile(), mkProgram({ qs_ranking: 50 }));
    expect(scored.tier).not.toBe("safe");
    expect(scored.prestige?.bucket).toBe(1);
    expect(scored.prestige?.tierCeiling).toBe("reach");
  });

  it("bucket 2 (QS 76-200) Safe is reachable for a genuinely strong profile", () => {
    const scored = scoreProgram(perfectProfile(), mkProgram({ qs_ranking: 150 }));
    expect(scored.prestige?.bucket).toBe(2);
    expect(scored.tier).toBe("safe");
  });

  it("unranked / open programs behave normally", () => {
    const scored = scoreProgram(perfectProfile(), mkProgram({ qs_ranking: null }));
    expect(scored.prestige?.bucket).toBe(4);
    expect(scored.tier).toBe("safe");
  });
});

describe("monotonicity", () => {
  it("a higher academic score never lowers match_score", () => {
    const program = mkProgram({ qs_ranking: 150 });
    let prev = -1;
    for (const pct of [55, 60, 65, 70, 75, 80, 85, 90, 95, 100]) {
      const s = scoreProgram(mkProfile({ academic_score: pct }), program).match_score;
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });

  it("a higher IELTS score never lowers match_score", () => {
    const program = mkProgram({ min_ielts: 6.5 });
    let prev = -1;
    for (const ielts of [6.5, 7, 7.5, 8, 8.5, 9]) {
      const s = scoreProgram(mkProfile({ english_score_overall: ielts }), program).match_score;
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });
});

describe("budget as filter, not signal", () => {
  it("budget carries zero weight — a cheaper program does not outscore an equally-good pricier one", () => {
    const profile = mkProfile({ budget_range: "above_70k" });
    const cheap = scoreProgram(profile, mkProgram({ annual_tuition_usd: 12000 }));
    const pricey = scoreProgram(profile, mkProgram({ annual_tuition_usd: 55000 }));
    expect(cheap.match_score).toBe(pricey.match_score);
  });

  it("unaffordable programs are hard-filtered out (110% cap)", () => {
    // budget 35k_50k → cap 50k * 1.1 = 55k; program totals 75k
    const profile = mkProfile({ budget_range: "35k_50k" });
    const results = recommendPrograms(profile, [
      mkProgram({ annual_tuition_usd: 60000, avg_living_cost_usd: 15000 }),
    ]);
    expect(results).toHaveLength(0);
  });

  it("above_70k (top bracket) is unbounded — no budget ceiling applies", () => {
    const profile = mkProfile({ budget_range: "above_70k" });
    const results = recommendPrograms(profile, [
      mkProgram({ annual_tuition_usd: 90000, avg_living_cost_usd: 25000 }),
    ]);
    expect(results).toHaveLength(1);
  });

  it("null-tuition programs score a NEUTRAL budget fit, not 100", () => {
    const scored = scoreProgram(mkProfile(), mkProgram({ annual_tuition_usd: null as unknown as number }));
    expect(scored.score_breakdown.budget).toBe(60);
  });

  it("null-tuition programs are capped at 2 per tier in recommendations", () => {
    const priced = Array.from({ length: 10 }, () => mkProgram());
    const unpriced = Array.from({ length: 6 }, () =>
      mkProgram({ annual_tuition_usd: null as unknown as number }),
    );
    const results = recommendPrograms(mkProfile(), [...unpriced, ...priced]);
    const byTier = new Map<string, number>();
    for (const r of results) {
      if (typeof r.annual_tuition_usd !== "number" || r.annual_tuition_usd <= 0) {
        byTier.set(r.tier, (byTier.get(r.tier) ?? 0) + 1);
      }
    }
    for (const [, count] of byTier) expect(count).toBeLessThanOrEqual(2);
  });
});

describe("score_breakdown shape", () => {
  it("has no scholarship key (badge-only per product decision) and keeps informational budget", () => {
    const scored = scoreProgram(mkProfile(), mkProgram());
    expect("scholarship" in scored.score_breakdown).toBe(false);
    expect(typeof scored.score_breakdown.budget).toBe("number");
  });
});

describe("dedup + quotas", () => {
  it("ingestion twins (same country+url+name) collapse to one result", () => {
    const url = "https://twin.example.edu/msc-cs";
    const a = mkProgram({ program_url: url, program_name: "Master of Cyber Security", university_name: "UNSW Sydney", field_of_study: "Computer Science & IT" });
    const b = mkProgram({ program_url: url, program_name: "Master of Cyber Security", university_name: "University of New South Wales", field_of_study: "Computer Science & IT" });
    const results = recommendPrograms(mkProfile(), [a, b]);
    expect(results).toHaveLength(1);
  });

  it("pages=1 fills exactly 6/10/4 when every tier pool has surplus", () => {
    const programs = [
      ...Array.from({ length: 30 }, () => mkProgram()),                    // unranked → safe pool
      ...Array.from({ length: 20 }, () => mkProgram({ qs_ranking: 50 })),  // bucket 1 → reach-capped
      ...Array.from({ length: 10 }, () => mkProgram({ qs_ranking: 5 })),   // bucket 0 → ambitious-only
    ];
    const results = recommendPrograms(mkProfile({ academic_score: 100 }), programs, 1);
    const count = (t: string) => results.filter((r) => r.tier === t).length;
    expect(results.length).toBe(20);
    expect(count("safe")).toBe(6);
    expect(count("reach")).toBe(10);
    expect(count("ambitious")).toBe(4);
  });

  it("ambitious is a HARD cap — never exceeds quota even when other pools are empty", () => {
    const programs = Array.from({ length: 30 }, () => mkProgram({ qs_ranking: 5 })); // all bucket 0
    const results = recommendPrograms(mkProfile(), programs, 1);
    expect(results.filter((r) => r.tier === "ambitious").length).toBeLessThanOrEqual(4);
  });
});

describe("field-prerequisite gate", () => {
  it("a commerce undergrad is not matched to STEM PG programs", () => {
    const profile = mkProfile({
      intended_field: "Artificial Intelligence",
      major_stream: "B.Com Accounting & Finance",
      current_degree: "B.Com",
    });
    const results = recommendPrograms(profile, [
      mkProgram({ field_of_study: "Artificial Intelligence", program_name: "MSc Artificial Intelligence" }),
    ]);
    expect(results).toHaveLength(0);
  });
});
