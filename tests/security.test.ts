import { describe, it, expect } from "vitest";
import {
  submitProfileSchema,
  resultsPatchSchema,
  authBodySchema,
  chatBodySchema,
} from "@/lib/schemas";
import { maskEmail, maskPhone, redactProfileContact } from "@/lib/submission-owner";
import { mkProfile } from "./fixtures";

describe("submit profile schema (M3)", () => {
  const valid = () => ({
    full_name: "Test Student",
    email: "test@example.com",
    degree_level: "postgraduate",
    intended_field: "Computer Science & IT",
    academic_score: 85,
    budget_range: "35k_50k",
    country_preferences: ["GB"],
    target_intake_year: 2027,
    target_intake_semester: "fall",
  });

  it("accepts a valid profile and passes unknown optional fields through", () => {
    const r = submitProfileSchema.safeParse({ ...valid(), some_future_field: "x" });
    expect(r.success).toBe(true);
    if (r.success) expect((r.data as Record<string, unknown>).some_future_field).toBe("x");
  });

  it("rejects out-of-range academic scores", () => {
    expect(submitProfileSchema.safeParse({ ...valid(), academic_score: 150 }).success).toBe(false);
    expect(submitProfileSchema.safeParse({ ...valid(), academic_score: -1 }).success).toBe(false);
  });

  it("rejects bad emails, missing countries, absurd intake years", () => {
    expect(submitProfileSchema.safeParse({ ...valid(), email: "not-an-email" }).success).toBe(false);
    expect(submitProfileSchema.safeParse({ ...valid(), country_preferences: [] }).success).toBe(false);
    expect(submitProfileSchema.safeParse({ ...valid(), target_intake_year: 1999 }).success).toBe(false);
  });

  it("rejects unknown budget ranges but accepts legacy keys", () => {
    expect(submitProfileSchema.safeParse({ ...valid(), budget_range: "1_crore" }).success).toBe(false);
    expect(submitProfileSchema.safeParse({ ...valid(), budget_range: "20k_35k" }).success).toBe(true);
  });
});

describe("results PATCH schema (M3)", () => {
  it("accepts stable and legacy program ids", () => {
    const r = resultsPatchSchema.safeParse({
      shortlisted_ids: ["p_4adaa86f679deb64", "prog_123"],
    });
    expect(r.success).toBe(true);
  });

  it("rejects arbitrary strings, oversize arrays and missing field", () => {
    expect(resultsPatchSchema.safeParse({ shortlisted_ids: ["<script>"] }).success).toBe(false);
    expect(
      resultsPatchSchema.safeParse({ shortlisted_ids: Array(100).fill("prog_1") }).success,
    ).toBe(false);
    expect(resultsPatchSchema.safeParse({}).success).toBe(false);
  });
});

describe("auth body schema (M3)", () => {
  it("accepts a register payload", () => {
    const r = authBodySchema.safeParse({
      action: "register",
      name: "Test",
      email: "t@example.com",
      otp_code: "123456",
      terms_accepted: true,
    });
    expect(r.success).toBe(true);
  });

  it("rejects unknown actions and malformed OTP codes", () => {
    expect(authBodySchema.safeParse({ action: "admin", email: "t@example.com" }).success).toBe(false);
    expect(
      authBodySchema.safeParse({ action: "login", email: "t@example.com", otp_code: "12345" }).success,
    ).toBe(false);
  });
});

describe("chat body schema (M3)", () => {
  it("accepts a normal conversation", () => {
    const r = chatBodySchema.safeParse({
      messages: [{ role: "user", content: "Is Germany really tuition-free?" }],
    });
    expect(r.success).toBe(true);
  });

  it("rejects bad roles, empty content, over-long context and >40 turns", () => {
    expect(
      chatBodySchema.safeParse({ messages: [{ role: "system", content: "x" }] }).success,
    ).toBe(false);
    expect(chatBodySchema.safeParse({ messages: [{ role: "user", content: "" }] }).success).toBe(false);
    expect(
      chatBodySchema.safeParse({
        messages: [{ role: "user", content: "hi" }],
        programsContext: "x".repeat(9000),
      }).success,
    ).toBe(false);
    expect(
      chatBodySchema.safeParse({
        messages: Array(41).fill({ role: "user", content: "hi" }),
      }).success,
    ).toBe(false);
  });
});

describe("contact-PII redaction for shared results links", () => {
  it("masks email keeping the domain, masks phone keeping last 4", () => {
    expect(maskEmail("kpiyush@yahoo.com")).toBe("k•••@yahoo.com");
    expect(maskPhone("+919811897478")).toMatch(/^\+91•+7478$/);
    expect(maskEmail(null)).toBe("•••");
    expect(maskPhone("")).toBe("");
  });

  it("redactProfileContact touches only email + phone", () => {
    const p = mkProfile({ email: "student@example.com", phone: "+919876543210", full_name: "Priya S" });
    const r = redactProfileContact(p);
    expect(r.email).toBe("s•••@example.com");
    expect(r.phone).not.toContain("98765");
    expect(r.full_name).toBe("Priya S");
    expect(r.academic_score).toBe(p.academic_score);
  });
});
