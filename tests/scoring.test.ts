import { describe, it, expect } from "vitest";
import { scoreProgram, recommendPrograms, teaserSlice } from "@/lib/scoring";
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

  it("30/50/20 proportion is NEVER breached — no tier absorbs another tier's unfilled slots", () => {
    // All-open-university pool: everything lands in the safe pool for a
    // strong profile. Pre-lock, surplus reallocation returned 20 Safe /
    // 0 / 0; the locked rule caps safe at its own quota of 6.
    const programs = Array.from({ length: 30 }, () => mkProgram());
    const results = recommendPrograms(mkProfile({ academic_score: 95 }), programs, 1);
    const count = (t: string) => results.filter((r) => r.tier === t).length;
    expect(count("safe")).toBeLessThanOrEqual(6);
    expect(count("reach")).toBeLessThanOrEqual(10);
    expect(count("ambitious")).toBeLessThanOrEqual(4);
  });
});

describe("aspirational fill (Option A, 10 July 2026)", () => {
  // Pool shape mirroring the real UK-MBA case: plenty of affordable open
  // universities (all Safe for a strong profile) + selective programs
  // that ONLY fail the budget ceiling.
  const tightBudget = () => mkProfile({ academic_score: 90, budget_range: "35k_50k" });
  const pool = () => [
    ...Array.from({ length: 10 }, (_, i) =>
      mkProgram({ university_name: `Open U ${i}`, annual_tuition_usd: 20000, avg_living_cost_usd: 12000 })),
    ...Array.from({ length: 4 }, (_, i) =>
      mkProgram({ university_name: `Selective U ${i}`, qs_ranking: 50, annual_tuition_usd: 60000, avg_living_cost_usd: 20000 })),
    ...Array.from({ length: 4 }, (_, i) =>
      mkProgram({ university_name: `Elite U ${i}`, qs_ranking: 5, annual_tuition_usd: 90000, avg_living_cost_usd: 25000 })),
  ];

  it("fills empty Reach/Ambitious with ≤3 above-budget programs, clearly flagged", () => {
    const results = recommendPrograms(tightBudget(), pool(), 1);
    const reach = results.filter((p) => p.tier === "reach");
    const ambitious = results.filter((p) => p.tier === "ambitious");
    expect(reach.length).toBeGreaterThan(0);
    expect(reach.length).toBeLessThanOrEqual(3);
    expect(reach.every((p) => p.above_budget === true)).toBe(true);
    expect(ambitious.length).toBeGreaterThan(0);
    expect(ambitious.length).toBeLessThanOrEqual(3);
    expect(ambitious.every((p) => p.above_budget === true)).toBe(true);
    // The affordable Safe list is untouched — additive, not displacing.
    const safe = results.filter((p) => p.tier === "safe");
    expect(safe.every((p) => !p.above_budget)).toBe(true);
    expect(safe.length).toBeLessThanOrEqual(6);
  });

  it("does NOT add above-budget programs when the tier already has affordable matches", () => {
    const withAffordableReach = [
      ...pool(),
      // Affordable selective program → lands in Reach on its own merits.
      mkProgram({ university_name: "Affordable Selective", qs_ranking: 50, annual_tuition_usd: 25000, avg_living_cost_usd: 10000 }),
    ];
    const results = recommendPrograms(tightBudget(), withAffordableReach, 1);
    const reach = results.filter((p) => p.tier === "reach");
    expect(reach.some((p) => !p.above_budget)).toBe(true);
    expect(reach.every((p) => !p.above_budget)).toBe(true);
  });

  it("never fires for the open-ended above_70k bracket", () => {
    const results = recommendPrograms(mkProfile({ academic_score: 90, budget_range: "above_70k" }), pool(), 1);
    expect(results.every((p) => !p.above_budget)).toBe(true);
  });
});

describe("teaserSlice (registration gate, Phase 2 #7)", () => {
  it("returns at most 5 with tier breadth, preserving display order", () => {
    const programs = [
      ...Array.from({ length: 12 }, (_, i) => mkProgram({ university_name: `Safe U ${i}` })),
      ...Array.from({ length: 10 }, (_, i) => mkProgram({ qs_ranking: 50, university_name: `Reach U ${i}` })),
      ...Array.from({ length: 4 },  (_, i) => mkProgram({ qs_ranking: 5,  university_name: `Amb U ${i}` })),
    ];
    const scored = recommendPrograms(mkProfile({ academic_score: 100 }), programs, 2);
    const teaser = teaserSlice(scored, 5);
    expect(teaser.length).toBe(5);
    expect(teaser.filter((p) => p.tier === "safe").length).toBe(2);
    expect(teaser.filter((p) => p.tier === "reach").length).toBe(2);
    expect(teaser.filter((p) => p.tier === "ambitious").length).toBe(1);
    // Order matches the full list's order.
    const order = new Map(scored.map((p, i) => [p.id, i]));
    for (let i = 1; i < teaser.length; i++) {
      expect(order.get(teaser[i].id)!).toBeGreaterThan(order.get(teaser[i - 1].id)!);
    }
  });

  it("backfills when a tier can't supply its share", () => {
    const programs = Array.from({ length: 8 }, (_, i) => mkProgram({ university_name: `Only Safe ${i}` }));
    const scored = recommendPrograms(mkProfile({ academic_score: 95 }), programs, 2);
    const teaser = teaserSlice(scored, 5);
    expect(teaser.length).toBe(Math.min(5, scored.length));
  });
});

describe("within-tier ordering (locked 10 July 2026)", () => {
  it("each tier's quota goes to the highest match scores, displayed in descending order", () => {
    // 10 unranked bucket-4 programs at distinct universities with rising
    // published minimums → falling academic surplus → falling match
    // scores. Safe quota is 6: the six lowest-minimum (highest-scoring)
    // programs must win the slots, in descending score order.
    const programs = Array.from({ length: 10 }, (_, i) =>
      mkProgram({ min_percentage: 50 + i * 2, university_name: `Distinct Uni ${i}` }),
    );
    const profile = mkProfile({ academic_score: 90 });
    const results = recommendPrograms(profile, programs, 1);
    const safe = results.filter((r) => r.tier === "safe");
    expect(safe.length).toBeGreaterThan(0);
    for (let i = 1; i < safe.length; i++) {
      expect(safe[i - 1].match_score).toBeGreaterThanOrEqual(safe[i].match_score);
    }
    // Selection, not just ordering: every returned Safe program outscores
    // every excluded Safe-tier candidate.
    const allSafe = programs.map((p) => scoreProgram(profile, p)).filter((p) => p.tier === "safe");
    const returnedIds = new Set(safe.map((p) => p.id));
    const excluded = allSafe.filter((p) => !returnedIds.has(p.id));
    if (excluded.length > 0) {
      const returnedMin = Math.min(...safe.map((p) => p.match_score));
      const excludedMax = Math.max(...excluded.map((p) => p.match_score));
      expect(returnedMin).toBeGreaterThanOrEqual(excludedMax);
    }
  });

  it("a QS-ranked program no longer takes a tier slot from higher-scoring unranked ones", () => {
    // Pre-lock, the ranked-first sort put the QS-600 program at the head
    // of the pool, so it claimed a Safe slot (and top display position)
    // over six higher-scoring unranked programs. Now the lowest scorer
    // is the one squeezed out of the 6-slot quota.
    const unranked = Array.from({ length: 6 }, (_, i) =>
      mkProgram({ min_percentage: 50, university_name: `Open Uni ${i}` }),
    );
    const ranked = mkProgram({ qs_ranking: 600, min_percentage: 62, university_name: "Ranked Uni" });
    const profile = mkProfile({ academic_score: 90 });
    const results = recommendPrograms(profile, [...unranked, ranked], 1);
    const safe = results.filter((r) => r.tier === "safe");
    expect(safe.length).toBe(6);
    expect(safe.some((p) => p.university_name === "Ranked Uni")).toBe(false);
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
