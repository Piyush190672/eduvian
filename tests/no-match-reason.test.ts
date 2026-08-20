import { describe, it, expect } from "vitest";
import { recommendPrograms, type MatchDiagnostics } from "@/lib/scoring";
import { explainNoMatches, applyRelaxation } from "@/lib/no-match-reason";
import { INDEXED_PROGRAMS } from "@/data/programs-indexed";
import type { StudentProfile } from "@/lib/types";

const mkDiag = (): MatchDiagnostics => ({
  rejects: {}, totalPrograms: 0, survivedHardFilters: 0, scored: 0, returned: 0,
});

const base = {
  full_name: "T", email: "t@e.com", phone: "9", nationality: "India", city: "Mumbai",
  degree_level: "undergraduate", intended_field: "Computer Science & IT", intended_field_extra: [],
  country_preferences: ["MY"], qs_ranking_preference: "top_200", budget_range: "25k_35k",
  target_intake_semester: "fall", target_intake_year: 2027,
  academic_score: 40, academic_score_type: "ib", post_study_work_visa: true,
  english_test: "none", country_region_preferences: {},
} as unknown as StudentProfile;

// Regression: a real submission (token 659b7c35, 14 Jul 2026) returned an
// empty shortlist and the page showed nothing actionable.
describe("explainNoMatches — measured empty-shortlist explanation", () => {
  it("reports a recoverable empty shortlist with options that really produce matches", () => {
    const diag = mkDiag();
    const got = recommendPrograms(base, INDEXED_PROGRAMS, 2, diag);
    expect(got).toHaveLength(0);

    const ex = explainNoMatches(base, INDEXED_PROGRAMS, diag);
    expect(ex.structural).toBe(false);
    expect(ex.causes.length).toBeGreaterThan(0);
    expect(ex.options.length).toBeGreaterThan(0);

    // Every advertised option must actually deliver the count it promises.
    for (const o of ex.options) {
      expect(o.matches).toBeGreaterThan(0);
      const actual = recommendPrograms(
        applyRelaxation(base, o.key), INDEXED_PROGRAMS, 2,
      ).length;
      expect(actual).toBe(o.matches);
    }
  });

  it("flags a structurally empty field instead of promising a quick fix", () => {
    // Synthetic dataset, NOT the live DB: this test asserts the *behaviour*
    // when a field is genuinely empty. Pinning it to a real field made it
    // fail the moment the Jul-2026 UG campaign added programs to
    // International Relations — a data change should never break a unit test.
    const emptyField = [
      {
        university_name: "Test University", country: "UK", city: "London",
        qs_ranking: 100, program_name: "BA Something Else",
        degree_level: "undergraduate", field_of_study: "Economics & Finance",
        is_active: true, intake_semesters: ["fall"], annual_tuition_usd: 20000,
      },
    ] as unknown as Parameters<typeof explainNoMatches>[1];

    const profile = { ...base, intended_field: "International Relations" } as StudentProfile;
    const diag = mkDiag();
    expect(recommendPrograms(profile, emptyField, 2)).toHaveLength(0);

    const ex = explainNoMatches(profile, emptyField, diag);
    expect(ex.structural).toBe(true);
    expect(ex.options).toHaveLength(0);
    // Owns the data gap rather than blaming the student's filters.
    expect(ex.causes[0]).toMatch(/coverage gap|don't yet carry/i);
    expect(ex.fieldPoolSize).toBe(0);
  });

  it("never mutates the caller's profile when relaxing", () => {
    const snapshot = JSON.stringify(base);
    applyRelaxation(base, "psw");
    applyRelaxation(base, "countries");
    expect(JSON.stringify(base)).toBe(snapshot);
  });
});

// PSW list correction (founder, 14 Jul 2026) — see PSW_COUNTRIES in scoring.ts.
describe("post-study-work country list", () => {
  const pswProfile = (over: Partial<StudentProfile>) => ({
    ...base, qs_ranking_preference: "any", budget_range: "above_70k",
    post_study_work_visa: true, ...over,
  }) as StudentProfile;

  it("keeps Netherlands and Singapore programs when PSW is required", () => {
    for (const code of ["NL", "SG"]) {
      const got = recommendPrograms(
        pswProfile({ country_preferences: [code] }), INDEXED_PROGRAMS, 2,
      );
      expect(got.length, `${code} should survive the PSW filter`).toBeGreaterThan(0);
    }
  });

  it("excludes French UNDERGRADUATE programs — the APS starts at licence-pro/master's", () => {
    const ug = recommendPrograms(
      pswProfile({ country_preferences: ["FR"], degree_level: "undergraduate" }),
      INDEXED_PROGRAMS, 2,
    );
    expect(ug).toHaveLength(0);
  });

  it("keeps French POSTGRADUATE programs when PSW is required", () => {
    const pg = recommendPrograms(
      pswProfile({
        country_preferences: ["FR"], degree_level: "postgraduate",
        current_degree: "B.Tech Computer Science", major_stream: "Computer Science & IT",
      }),
      INDEXED_PROGRAMS, 2,
    );
    expect(pg.length).toBeGreaterThan(0);
  });

  it("still excludes destinations with no post-study work route (Malaysia, UAE)", () => {
    for (const code of ["MY", "AE"]) {
      const got = recommendPrograms(
        pswProfile({ country_preferences: [code] }), INDEXED_PROGRAMS, 2,
      );
      expect(got, `${code} has no PSW route`).toHaveLength(0);
    }
  });
});
