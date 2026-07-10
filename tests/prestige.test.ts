import { describe, it, expect } from "vitest";
import { getPrestigeBucket } from "@/lib/prestige";
import { mkProgram } from "./fixtures";

describe("QS bucket boundaries", () => {
  const cases: Array<[number, number]> = [
    [1, 0], [25, 0],
    [26, 1], [75, 1],
    [76, 2], [200, 2],
    [201, 3], [500, 3],
    [501, 4], [1200, 4],
  ];
  for (const [qs, bucket] of cases) {
    it(`QS ${qs} → bucket ${bucket}`, () => {
      expect(getPrestigeBucket(mkProgram({ qs_ranking: qs })).bucket).toBe(bucket);
    });
  }

  it("no QS + no sidecar data → open bucket 4 (least restrictive)", () => {
    const b = getPrestigeBucket(mkProgram({ qs_ranking: null }));
    expect(b.bucket).toBe(4);
    expect(b.source).toBe("default");
  });
});

describe("tier ceilings per bucket", () => {
  it("bucket 0 ceiling is ambitious; bucket 1 is reach; buckets 2-4 are safe", () => {
    expect(getPrestigeBucket(mkProgram({ qs_ranking: 10 })).tierCeiling).toBe("ambitious");
    expect(getPrestigeBucket(mkProgram({ qs_ranking: 50 })).tierCeiling).toBe("reach");
    expect(getPrestigeBucket(mkProgram({ qs_ranking: 150 })).tierCeiling).toBe("safe");
    expect(getPrestigeBucket(mkProgram({ qs_ranking: 400 })).tierCeiling).toBe("safe");
    expect(getPrestigeBucket(mkProgram({ qs_ranking: null })).tierCeiling).toBe("safe");
  });
});

describe("acceptance-rate source is gated to undergraduate profiles", () => {
  // Harvard is in the universities sidecar with a single-digit UG
  // acceptance rate. College Scorecard rates are UNDERGRAD admissions
  // data — PG profiles must not be bucketed by them.
  const harvardProgram = mkProgram({
    university_name: "Harvard University",
    qs_ranking: null, // force the acceptance-vs-default distinction
  });

  it("undergraduate profile → acceptance_rate source (bucket 0)", () => {
    const b = getPrestigeBucket(harvardProgram, "undergraduate");
    expect(b.source).toBe("acceptance_rate");
    expect(b.bucket).toBe(0);
  });

  it("postgraduate profile → never acceptance_rate", () => {
    const b = getPrestigeBucket(harvardProgram, "postgraduate");
    expect(b.source).not.toBe("acceptance_rate");
  });

  it("postgraduate with QS rank → qs_ranking source", () => {
    const b = getPrestigeBucket(
      mkProgram({ university_name: "Harvard University", qs_ranking: 4 }),
      "postgraduate",
    );
    expect(b.source).toBe("qs_ranking");
    expect(b.bucket).toBe(0);
  });
});
