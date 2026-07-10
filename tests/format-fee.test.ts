import { describe, it, expect } from "vitest";
import { formatFee, formatTotalCost, isFeeUnavailable, FEE_UNAVAILABLE_MESSAGE } from "@/lib/format-fee";

/** Product hard rule (CLAUDE.md): never show $0 for a missing fee. */
describe("null-safe fee rendering", () => {
  it("null / undefined / 0 fees are 'unavailable', never $0", () => {
    expect(isFeeUnavailable(null)).toBe(true);
    expect(isFeeUnavailable(undefined)).toBe(true);
    expect(isFeeUnavailable(0)).toBe(true);
    expect(formatFee(null)).toBe(FEE_UNAVAILABLE_MESSAGE);
    expect(formatFee(undefined)).not.toMatch(/\$0/);
    expect(formatFee(0)).not.toMatch(/\$0/);
  });

  it("a real fee renders as currency, not the unavailable message", () => {
    const out = formatFee(41081);
    expect(out).not.toBe(FEE_UNAVAILABLE_MESSAGE);
    expect(out).toMatch(/41,081|41081/);
  });

  it("total cost with null tuition never renders $0", () => {
    expect(formatTotalCost(null, 15000)).not.toMatch(/^\$0/);
  });
});
