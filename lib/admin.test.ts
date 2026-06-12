import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `server-only` throws when imported outside a Server Component; stub it for the test.
vi.mock("server-only", () => ({}));

import { isAdminEmail } from "@/lib/admin";

const original = process.env.ADMIN_EMAILS;

beforeEach(() => {
  delete process.env.ADMIN_EMAILS;
});

afterEach(() => {
  if (original === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = original;
});

describe("isAdminEmail", () => {
  it("returns false when ADMIN_EMAILS is unset or empty", () => {
    expect(isAdminEmail("a@b.co")).toBe(false);
    process.env.ADMIN_EMAILS = "   ";
    expect(isAdminEmail("a@b.co")).toBe(false);
  });

  it("matches an allowlisted email", () => {
    process.env.ADMIN_EMAILS = "admin@rezflix.tv";
    expect(isAdminEmail("admin@rezflix.tv")).toBe(true);
    expect(isAdminEmail("someone@else.com")).toBe(false);
  });

  it("is case-insensitive and tolerant of whitespace in the list", () => {
    process.env.ADMIN_EMAILS = " Owner@Rezflix.TV , second@rezflix.tv ";
    expect(isAdminEmail("owner@rezflix.tv")).toBe(true);
    expect(isAdminEmail("OWNER@REZFLIX.TV")).toBe(true);
    expect(isAdminEmail("  second@rezflix.tv  ")).toBe(true);
  });

  it("ignores empty entries from trailing/double commas", () => {
    process.env.ADMIN_EMAILS = "admin@rezflix.tv,,";
    // An empty allowlist entry must not match an empty-ish input.
    expect(isAdminEmail("")).toBe(false);
    expect(isAdminEmail("admin@rezflix.tv")).toBe(true);
  });
});
