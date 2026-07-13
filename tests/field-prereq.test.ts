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
