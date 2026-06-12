import { afterEach, describe, expect, it, vi } from "vitest";

// `server-only` throws when imported outside a Server Component; stub it for the test.
vi.mock("server-only", () => ({}));

// Stub the Auth.js entry so the test doesn't pull in Prisma/bcrypt.
const authMock = vi.fn();
vi.mock("@/auth", () => ({ auth: () => authMock() }));

// Mirror Next's real `redirect`, which throws to halt rendering. We surface the target
// as the error message so each guard's destination is assertable.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

import {
  requireAdmin,
  requireGuest,
  requireRole,
  requireUser,
} from "@/lib/auth-guards";

type TestRole = "applicant" | "member" | "admin";

function session(role: TestRole) {
  return { user: { id: "u1", username: "rez", email: "e@x.co", role } };
}

afterEach(() => authMock.mockReset());

describe("requireUser", () => {
  it("returns the user when signed in", async () => {
    authMock.mockResolvedValue(session("applicant"));
    await expect(requireUser()).resolves.toMatchObject({ username: "rez" });
  });

  it("redirects to /login when signed out", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("REDIRECT:/login");
  });
});

describe("requireGuest", () => {
  it("passes for a guest", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireGuest()).resolves.toBeUndefined();
  });

  it("redirects a signed-in user home", async () => {
    authMock.mockResolvedValue(session("member"));
    await expect(requireGuest()).rejects.toThrow("REDIRECT:/");
  });
});

describe("requireRole", () => {
  it("allows a permitted role", async () => {
    authMock.mockResolvedValue(session("member"));
    await expect(requireRole("member", "admin")).resolves.toMatchObject({
      role: "member",
    });
  });

  it("redirects a wrong-role user home", async () => {
    authMock.mockResolvedValue(session("applicant"));
    await expect(requireRole("member", "admin")).rejects.toThrow("REDIRECT:/");
  });

  it("redirects a signed-out user to /login", async () => {
    authMock.mockResolvedValue(null);
    await expect(requireRole("admin")).rejects.toThrow("REDIRECT:/login");
  });
});

describe("requireAdmin", () => {
  it("allows an admin", async () => {
    authMock.mockResolvedValue(session("admin"));
    await expect(requireAdmin()).resolves.toMatchObject({ role: "admin" });
  });

  it("redirects a non-admin home", async () => {
    authMock.mockResolvedValue(session("member"));
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/");
  });
});
