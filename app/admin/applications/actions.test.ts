import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("server-only", () => ({}));

const requireAdminMock = vi.fn();
vi.mock("@/lib/auth-guards", () => ({
  requireAdmin: () => requireAdminMock(),
}));

const appUpdate = vi.fn();
const userUpdate = vi.fn();
const tx = {
  application: { update: (a: unknown) => appUpdate(a) },
  user: { update: (a: unknown) => userUpdate(a) },
};
vi.mock("@/lib/prisma", () => ({
  prisma: {
    // Interactive transaction: run the callback against the mocked tx client.
    $transaction: (cb: (t: typeof tx) => unknown) => cb(tx),
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { reviewApplication } from "@/app/admin/applications/actions";

beforeEach(() => {
  requireAdminMock.mockResolvedValue({ id: "admin1", role: "admin" });
  appUpdate.mockResolvedValue({ userId: "u1" });
  userUpdate.mockResolvedValue({});
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("reviewApplication", () => {
  it("approves: sets status approved + stamps reviewer and mirrors the user", async () => {
    const result = await reviewApplication("app1", "approve");

    expect(result).toEqual({ success: true });

    const appArg = appUpdate.mock.calls[0][0];
    expect(appArg.where).toEqual({ id: "app1" });
    expect(appArg.data.status).toBe("approved");
    expect(appArg.data.reviewedBy).toBe("admin1");
    expect(appArg.data.reviewedAt).toBeInstanceOf(Date);

    // The user's mirrored status is updated, but role is NOT touched (membership
    // comes from the Jellyfin link, not approval).
    const userArg = userUpdate.mock.calls[0][0];
    expect(userArg).toEqual({
      where: { id: "u1" },
      data: { applicationStatus: "approved" },
    });
    expect("role" in userArg.data).toBe(false);
  });

  it("rejects: sets status rejected on both rows", async () => {
    const result = await reviewApplication("app1", "reject");
    expect(result).toEqual({ success: true });
    expect(appUpdate.mock.calls[0][0].data.status).toBe("rejected");
    expect(userUpdate.mock.calls[0][0].data.applicationStatus).toBe("rejected");
  });

  it("rejects an invalid decision before any write", async () => {
    const result = await reviewApplication("app1", "maybe" as never);
    expect("error" in result).toBe(true);
    expect(appUpdate).not.toHaveBeenCalled();
  });

  it("rejects an empty application id before any write", async () => {
    const result = await reviewApplication("", "approve");
    expect("error" in result).toBe(true);
    expect(appUpdate).not.toHaveBeenCalled();
  });

  it("returns a friendly error when the application is gone (P2025)", async () => {
    appUpdate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("not found", {
        code: "P2025",
        clientVersion: "x",
      }),
    );
    const result = await reviewApplication("app1", "approve");
    expect("error" in result && result.error).toMatch(/no longer exists/i);
    expect(userUpdate).not.toHaveBeenCalled();
  });
});
