import { describe, expect, it } from "vitest";

import {
  applicationSchema,
  isResubmittable,
} from "@/lib/validations/application";

const valid = {
  displayName: "Rez Fan",
  contact: "rez@example.com",
  referralSource: "reddit",
  watchInterests: "Sci-fi films and prestige TV",
  devices: "Apple TV, iPhone",
  agreeToRules: true,
  note: "",
};

describe("applicationSchema", () => {
  it("accepts a complete, valid application", () => {
    expect(applicationSchema.safeParse(valid).success).toBe(true);
  });

  it("requires agreement to the house rules", () => {
    const result = applicationSchema.safeParse({
      ...valid,
      agreeToRules: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/house rules/i);
    }
  });

  it("rejects an unknown referral source", () => {
    expect(
      applicationSchema.safeParse({ ...valid, referralSource: "tiktok" })
        .success,
    ).toBe(false);
  });

  it("requires the core text fields", () => {
    expect(
      applicationSchema.safeParse({ ...valid, displayName: "" }).success,
    ).toBe(false);
    expect(
      applicationSchema.safeParse({ ...valid, watchInterests: " " }).success,
    ).toBe(false);
  });

  it("allows the note to be omitted", () => {
    const { note: _omit, ...withoutNote } = valid;
    void _omit;
    expect(applicationSchema.safeParse(withoutNote).success).toBe(true);
  });
});

describe("isResubmittable", () => {
  it("allows editing from pending and rejected, not approved", () => {
    expect(isResubmittable("pending")).toBe(true);
    expect(isResubmittable("rejected")).toBe(true);
    expect(isResubmittable("approved")).toBe(false);
    expect(isResubmittable("none")).toBe(false);
  });
});
