import { describe, expect, it } from "vitest";

import { loginSchema, signupSchema } from "@/lib/validations/auth";

describe("signupSchema", () => {
  it("accepts and normalizes valid input", () => {
    const result = signupSchema.safeParse({
      username: "  Rez_Fan  ",
      email: "  USER@Example.COM ",
      password: "supersecret",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      // trimmed + lowercased
      expect(result.data.username).toBe("rez_fan");
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects short usernames and bad characters", () => {
    expect(
      signupSchema.safeParse({
        username: "ab",
        email: "a@b.co",
        password: "supersecret",
      }).success,
    ).toBe(false);
    expect(
      signupSchema.safeParse({
        username: "has space",
        email: "a@b.co",
        password: "supersecret",
      }).success,
    ).toBe(false);
  });

  it("rejects invalid email and short password", () => {
    expect(
      signupSchema.safeParse({
        username: "valid_user",
        email: "nope",
        password: "supersecret",
      }).success,
    ).toBe(false);
    expect(
      signupSchema.safeParse({
        username: "valid_user",
        email: "a@b.co",
        password: "short",
      }).success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("normalizes the username and accepts any non-empty password", () => {
    const result = loginSchema.safeParse({
      username: "  Rez_Fan  ",
      password: "x",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBe("rez_fan");
    }
  });

  it("rejects empty username or password", () => {
    expect(
      loginSchema.safeParse({ username: "", password: "supersecret" }).success,
    ).toBe(false);
    expect(
      loginSchema.safeParse({ username: "valid_user", password: "" }).success,
    ).toBe(false);
  });
});
