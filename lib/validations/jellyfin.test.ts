import { describe, expect, it } from "vitest";

import { linkJellyfinSchema } from "@/lib/validations/jellyfin";

describe("linkJellyfinSchema", () => {
  it("accepts a username + password and trims only the username", () => {
    const result = linkJellyfinSchema.safeParse({
      jellyfinUsername: "  RezFan  ",
      jellyfinPassword: "  keep me  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // Username trimmed; password preserved byte-for-byte (incl. surrounding spaces).
      expect(result.data.jellyfinUsername).toBe("RezFan");
      expect(result.data.jellyfinPassword).toBe("  keep me  ");
    }
  });

  it("does not lowercase the Jellyfin username (case can matter)", () => {
    const result = linkJellyfinSchema.safeParse({
      jellyfinUsername: "MixedCase",
      jellyfinPassword: "x",
    });
    expect(result.success && result.data.jellyfinUsername).toBe("MixedCase");
  });

  it("rejects empty fields", () => {
    expect(
      linkJellyfinSchema.safeParse({
        jellyfinUsername: "",
        jellyfinPassword: "x",
      }).success,
    ).toBe(false);
    expect(
      linkJellyfinSchema.safeParse({
        jellyfinUsername: "rez",
        jellyfinPassword: "",
      }).success,
    ).toBe(false);
  });
});
