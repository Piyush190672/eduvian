import { describe, it, expect } from "vitest";
import { explainEmptyTier } from "@/lib/empty-tier-reason";
import { mkProfile } from "./fixtures";

describe("empty-tier explainer — MBA work-experience awareness", () => {
  it("leads with the work-experience requirement for MBA profiles with none recorded", () => {
    const profile = mkProfile({ intended_field: "MBA", work_experience_years: 0 });
    for (const tier of ["reach", "ambitious"] as const) {
      const expl = explainEmptyTier(tier, profile, []);
      expect(expl.suggestions[0]).toContain("work experience");
      expect(expl.suggestions.length).toBeLessThanOrEqual(3);
    }
  });

  it("states the current years when below the typical floor", () => {
    const profile = mkProfile({ intended_field: "MBA", work_experience_years: 1 });
    const expl = explainEmptyTier("reach", profile, []);
    expect(expl.suggestions[0]).toContain("your profile shows 1");
  });

  it("says nothing about work experience for non-MBA or experienced-MBA profiles", () => {
    const nonMba = explainEmptyTier("reach", mkProfile({ intended_field: "Computer Science & IT", work_experience_years: 0 }), []);
    expect(nonMba.suggestions.join(" ")).not.toContain("work-experience");
    const seasoned = explainEmptyTier("reach", mkProfile({ intended_field: "MBA", work_experience_years: 5 }), []);
    expect(seasoned.suggestions.join(" ")).not.toContain("Selective MBA");
  });
});
