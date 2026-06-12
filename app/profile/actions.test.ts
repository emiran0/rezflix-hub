import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@prisma/client";

// Stub the server-only deps so the action is unit-testable in isolation.
vi.mock("server-only", () => ({}));

const requireUserMock = vi.fn();
vi.mock("@/lib/auth-guards", () => ({
  requireUser: () => requireUserMock(),
}));

const findUnique = vi.fn();
const update = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (args: unknown) => findUnique(args),
      update: (args: unknown) => update(args),
    },
  },
}));

const authenticateByName = vi.fn();
vi.mock("@/lib/jellyfin", () => ({
  getJellyfinClient: () => ({ authenticateByName }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { linkJellyfin } from "@/app/profile/actions";

const creds = { jellyfinUsername: "rezfan", jellyfinPassword: "s3cret" };

beforeEach(() => {
  requireUserMock.mockResolvedValue({
    id: "u1",
    username: "rez",
    email: "rez@x.co",
    role: "applicant",
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("linkJellyfin", () => {
  it("verifies, stores the link, and promotes a non-admin to member", async () => {
    findUnique.mockResolvedValue({ role: "applicant", jellyfinUserId: null });
    authenticateByName.mockResolvedValue({
      ok: true,
      jellyfinUserId: "jf-9",
      jellyfinUsername: "rezfan",
    });
    update.mockResolvedValue({});

    const result = await linkJellyfin(creds);

    expect(result).toEqual({ success: true });
    expect(authenticateByName).toHaveBeenCalledWith("rezfan", "s3cret");
    const data = update.mock.calls[0][0].data;
    expect(data.jellyfinUserId).toBe("jf-9");
    expect(data.role).toBe("member");
    expect(data.jellyfinLinkedAt).toBeInstanceOf(Date);
  });

  it("keeps an admin as admin (never self-demote)", async () => {
    findUnique.mockResolvedValue({ role: "admin", jellyfinUserId: null });
    authenticateByName.mockResolvedValue({
      ok: true,
      jellyfinUserId: "jf-9",
      jellyfinUsername: "rezfan",
    });
    update.mockResolvedValue({});

    await linkJellyfin(creds);
    expect(update.mock.calls[0][0].data.role).toBe("admin");
  });

  it("rejects invalid input before any DB or Jellyfin call", async () => {
    const result = await linkJellyfin({
      jellyfinUsername: "",
      jellyfinPassword: "x",
    });
    expect("error" in result).toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
    expect(authenticateByName).not.toHaveBeenCalled();
  });

  it("short-circuits if the current user is already linked", async () => {
    findUnique.mockResolvedValue({ role: "member", jellyfinUserId: "jf-old" });
    const result = await linkJellyfin(creds);
    expect(result).toEqual({
      error: "Your account is already linked to a Jellyfin account.",
    });
    expect(authenticateByName).not.toHaveBeenCalled();
  });

  it("surfaces invalid Jellyfin credentials and does not write", async () => {
    findUnique.mockResolvedValue({ role: "applicant", jellyfinUserId: null });
    authenticateByName.mockResolvedValue({
      ok: false,
      reason: "invalid_credentials",
    });
    const result = await linkJellyfin(creds);
    expect("error" in result && result.error).toMatch(
      /credentials didn't work/i,
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("maps a unique-constraint violation to already-linked-elsewhere", async () => {
    findUnique.mockResolvedValue({ role: "applicant", jellyfinUserId: null });
    authenticateByName.mockResolvedValue({
      ok: true,
      jellyfinUserId: "jf-shared",
      jellyfinUsername: "rezfan",
    });
    update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "6.19.3",
      }),
    );

    const result = await linkJellyfin(creds);
    expect(result).toEqual({
      error: "That Jellyfin account is already linked to another Hub account.",
    });
  });
});
