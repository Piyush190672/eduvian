import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseProgramEntries,
  extractField,
  makeKey,
  buildExistingKeys,
} from "../scripts/verify/merge-keys";

// Batch-B blocker, open since handoff #21 and fixed 14 Jul 2026: entries
// whose program_name contains an escaped quote keyed on a truncated prefix,
// so they re-inserted on EVERY merge run.
describe("merge dedup key — escaped quotes", () => {
  const ENTRY = `{
    university_name: "Sciences Po",
    country: "France", city: "Paris", qs_ranking: 259,
    program_name: "Bachelor of Arts and Sciences (BASC) : \\"Politics and Government\\"", degree_level: "undergraduate",
    field_of_study: "Social Sciences & Humanities",
  }`;

  it("reads the FULL program_name, unescaped, not a prefix", () => {
    expect(extractField(ENTRY, "program_name")).toBe(
      'Bachelor of Arts and Sciences (BASC) : "Politics and Government"',
    );
  });

  it("the key matches the one built from the verifier's raw JSON value", () => {
    // What merge.ts computes from programs.ts …
    const fromFile = makeKey(
      extractField(ENTRY, "university_name"),
      extractField(ENTRY, "program_name"),
      extractField(ENTRY, "degree_level"),
    );
    // … must equal what it computes from the output JSON for the same program.
    const fromJson = makeKey(
      "Sciences Po",
      'Bachelor of Arts and Sciences (BASC) : "Politics and Government"',
      "undergraduate",
    );
    expect(fromFile).toBe(fromJson);
  });

  it("does not let a shorter key match the tail of a longer one", () => {
    const e = `{ university_name: "X University", program_name: "Y", degree_level: "postgraduate" }`;
    expect(extractField(e, "name")).toBe("");
  });

  it("returns empty string for a null field rather than throwing", () => {
    const e = `{ university_name: "X", program_name: "Y", degree_level: null }`;
    expect(extractField(e, "degree_level")).toBe("");
    expect(makeKey("X", "Y", "")).toBe("x|y|");
  });
});

describe("merge dedup key — against the real programs.ts", () => {
  const programsTs = readFileSync(
    join(__dirname, "..", "src", "data", "programs.ts"),
    "utf8",
  );

  it("every entry yields a complete, untruncated identity", () => {
    const entries = parseProgramEntries(programsTs);
    expect(entries.length).toBeGreaterThan(10_000);

    // A trailing backslash is the fingerprint of the old truncation bug.
    const truncated = entries.filter((e) => {
      const uni = extractField(e, "university_name");
      const pn = extractField(e, "program_name");
      return uni.endsWith("\\") || pn.endsWith("\\");
    });
    expect(truncated).toHaveLength(0);
  });

  it("re-merging the existing DB would insert nothing (idempotent)", () => {
    const entries = parseProgramEntries(programsTs);
    const existing = buildExistingKeys(programsTs);

    // Simulate merge.ts's check for every row already in the DB: each one
    // must be recognised as a duplicate, or it re-inserts on the next run.
    const wouldReinsert = entries.filter((e) => {
      const uni = extractField(e, "university_name");
      const pn = extractField(e, "program_name");
      if (!uni || !pn) return false;
      return !existing.has(makeKey(uni, pn, extractField(e, "degree_level")));
    });
    expect(wouldReinsert).toHaveLength(0);
  });
});
