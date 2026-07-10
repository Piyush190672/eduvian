import { describe, it, expect } from "vitest";
import { PROGRAMS } from "@/data/programs";
import { INDEXED_PROGRAMS, stableProgramId } from "@/data/programs-indexed";
import { FIELDS_OF_STUDY, TARGET_COUNTRIES } from "@/lib/types";

/**
 * Data-invariant suite. These lock the pipeline's output contract so a
 * bad merge / regex-splice regression fails CI instead of shipping.
 * History: 255 sparse-array holes ('},,') accumulated silently and
 * caused two production 500s before the Phase-1 repair.
 */

const arr = (PROGRAMS as unknown[]).filter(Boolean) as Array<Record<string, unknown>>;

describe("programs.ts structural integrity", () => {
  it("has NO sparse-array holes (length === real entry count)", () => {
    expect((PROGRAMS as unknown[]).length).toBe(arr.length);
  });

  it("carries the expected order of magnitude of programs", () => {
    expect(arr.length).toBeGreaterThanOrEqual(9000);
  });

  it("every entry has the core identity fields", () => {
    for (const p of arr) {
      expect(p.university_name, JSON.stringify(p).slice(0, 120)).toBeTruthy();
      expect(p.program_name).toBeTruthy();
      expect(p.country).toBeTruthy();
      expect(p.field_of_study).toBeTruthy();
    }
  });

  it("degree_level missing count can only shrink (pipeline backlog item #30 — 152 known)", () => {
    const missing = arr.filter((p) => !p.degree_level).length;
    expect(missing).toBeLessThanOrEqual(152);
  });

  it("every field_of_study is in the canonical FIELDS_OF_STUDY enum", () => {
    const allowed = new Set<string>(FIELDS_OF_STUDY as readonly string[]);
    const bad = arr.filter((p) => !allowed.has(p.field_of_study as string));
    expect(bad.map((p) => p.field_of_study)).toEqual([]);
  });

  it("every country is a TARGET_COUNTRIES name (Netherlands regression guard)", () => {
    const allowed = new Set(TARGET_COUNTRIES.map((c) => c.name));
    const bad = [...new Set(arr.map((p) => p.country as string))].filter((c) => !allowed.has(c as never));
    expect(bad).toEqual([]);
  });

  it("TARGET_COUNTRIES lists all 12 destination countries", () => {
    expect(TARGET_COUNTRIES.length).toBe(12);
    expect(TARGET_COUNTRIES.map((c) => c.name)).toContain("Netherlands");
  });
});

describe("stable program identity", () => {
  it("stamps every entry with a p_<16 hex> id", () => {
    expect(INDEXED_PROGRAMS.length).toBe(arr.length);
    for (const p of INDEXED_PROGRAMS) expect(p.id).toMatch(/^p_[0-9a-f]{16}$/);
  });

  it("ids are content-derived and deterministic", () => {
    for (const p of INDEXED_PROGRAMS.slice(0, 500)) {
      expect(stableProgramId(p)).toBe(p.id);
    }
  });

  it("ids are unique except documented ingestion twins (≤ 10)", () => {
    const uniq = new Set(INDEXED_PROGRAMS.map((p) => p.id));
    expect(INDEXED_PROGRAMS.length - uniq.size).toBeLessThanOrEqual(10);
  });
});
