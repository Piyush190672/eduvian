import { describe, it, expect } from "vitest";
import { getFieldAlignmentError, isAcademicallyEligibleForField } from "@/lib/field-prereq";
import type { StudentProfile } from "@/lib/types";

// Regression: selecting current_degree alone (before the stream question)
// must not trigger the form-blocking eligibility error. Reported by the
// founder 14 Jul 2026 — a non-STEM degree label (e.g. "B.Com") fired
// "not eligible" for a STEM intended field before major_stream was set.
describe("getFieldAlignmentError — PG form gating order", () => {
  const base = {
    degree_level: "postgraduate" as const,
    intended_field: "Data Science",
  };

  it("stays silent when only current_degree is set (stream not chosen yet)", () => {
    expect(
      getFieldAlignmentError(
        { ...base, current_degree: "B.Com (Bachelor of Commerce)", major_stream: "" },
        "Data Science",
      ),
    ).toBeNull();
  });

  it("stays silent when nothing is set", () => {
    expect(getFieldAlignmentError({ ...base }, "Data Science")).toBeNull();
  });

  it("errors once a non-eligible stream is chosen", () => {
    expect(
      getFieldAlignmentError(
        { ...base, current_degree: "B.A.", major_stream: "History" },
        "Data Science",
      ),
    ).toMatch(/not eligible/i);
  });

  it("passes once an eligible stream is chosen", () => {
    expect(
      getFieldAlignmentError(
        { ...base, current_degree: "B.Sc.", major_stream: "Computer Science & IT" },
        "Data Science",
      ),
    ).toBeNull();
  });

  it("degree keyword still rescues eligibility when the stream alone would fail", () => {
    // The matcher haystack joins stream + degree; a STEM degree name keeps
    // the user eligible even with a vague stream label.
    expect(
      getFieldAlignmentError(
        { ...base, current_degree: "B.Tech Computer Engineering", major_stream: "General" },
        "Data Science",
      ),
    ).toBeNull();
  });

  it("matcher-side check is unchanged: degree-only profiles still evaluated at match time", () => {
    // isAcademicallyEligibleForField (hard filter) keeps its permissive
    // haystack semantics — this guards against accidentally changing it.
    const p = {
      degree_level: "postgraduate",
      current_degree: "B.Tech Computer Science",
      major_stream: "",
    } as unknown as StudentProfile;
    expect(isAcademicallyEligibleForField(p, "Data Science")).toBe(true);
  });
});

// Founder rule (14 Jul 2026): UG Medicine requires any 3 of Class XII
// Physics, Chemistry, Biology, Mathematics — Mathematics is NOT mandatory.
describe("getFieldAlignmentError — UG Medicine 3-of-4 rule", () => {
  const ug = { degree_level: "undergraduate" as const };
  const med = "Medicine";

  it("PCB without Mathematics is eligible", () => {
    expect(
      getFieldAlignmentError({ ...ug, major_stream: "Physics, Chemistry, Biology" }, med),
    ).toBeNull();
  });

  it("PCM without Biology is eligible", () => {
    expect(
      getFieldAlignmentError({ ...ug, major_stream: "Physics, Chemistry, Mathematics" }, med),
    ).toBeNull();
  });

  it("only 2 of the 4 is not eligible", () => {
    expect(
      getFieldAlignmentError({ ...ug, major_stream: "Physics, Chemistry, English" }, med),
    ).toMatch(/3 of/i);
  });

  it("no subjects selected yet — stays silent", () => {
    expect(getFieldAlignmentError({ ...ug, major_stream: "" }, med)).toBeNull();
  });


  it("legacy 'Medicine & Public Health' drafts still get the 3-of-4 rule", () => {
    expect(
      getFieldAlignmentError(
        { degree_level: "undergraduate", major_stream: "Physics, Chemistry, Biology" },
        "Medicine & Public Health",
      ),
    ).toBeNull();
    expect(
      getFieldAlignmentError(
        { degree_level: "undergraduate", major_stream: "Physics, English" },
        "Medicine & Public Health",
      ),
    ).toMatch(/3 of/i);
  });

  it("PCM gate for other STEM UG fields unchanged (Biotech still requires Math)", () => {
    expect(
      getFieldAlignmentError(
        { ...ug, major_stream: "Physics, Chemistry, Biology" },
        "Biotechnology & Life Sciences",
      ),
    ).toMatch(/Mathematics/);
  });
});

// Founder decision (14 Jul 2026): Public Health is gated at PG like
// Medicine — health-sciences background required. UG Public Health has
// no subject rule (the 3-of-4 rule is Medicine-only, founder rule).
describe("Public Health gating", () => {
  const pg = { degree_level: "postgraduate" as const };

  it("PG Public Health blocks a non-health background", () => {
    expect(
      getFieldAlignmentError(
        { ...pg, current_degree: "B.A.", major_stream: "History" },
        "Public Health",
      ),
    ).toMatch(/not eligible/i);
  });

  it("PG Public Health passes a health-sciences background", () => {
    expect(
      getFieldAlignmentError(
        { ...pg, current_degree: "B.Sc. Nursing", major_stream: "Nursing" },
        "Public Health",
      ),
    ).toBeNull();
  });

  it("matcher hard-filter gates Public Health programs for non-health PG profiles", () => {
    const p = {
      degree_level: "postgraduate",
      current_degree: "B.Com",
      major_stream: "Commerce",
    } as unknown as StudentProfile;
    expect(isAcademicallyEligibleForField(p, "Public Health")).toBe(false);
    expect(isAcademicallyEligibleForField(p, "Medicine & Public Health")).toBe(false); // legacy rows
  });

  it("UG Public Health has no subject gate (3-of-4 is Medicine-only)", () => {
    expect(
      getFieldAlignmentError(
        { degree_level: "undergraduate", major_stream: "History, English" },
        "Public Health",
      ),
    ).toBeNull();
  });
});
