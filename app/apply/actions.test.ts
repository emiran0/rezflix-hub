import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const requireUserMock = vi.fn();
vi.mock("@/lib/auth-guards", () => ({
  requireUser: () => requireUserMock(),
}));

const upsert = vi.fn();
const update = vi.fn();
const $transaction = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    application: { upsert: (a: unknown) => upsert(a) },
    user: { update: (a: unknown) => update(a) },
    $transaction: (a: unknown) => $transaction(a),
  },
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { submitApplication } from "@/app/apply/actions";

const answers = {
  displayName: "Rez Fan",
  contact: "rez@example.com",
  referralSource: "reddit",
  watchInterests: "Sci-fi and prestige TV",
  devices: "Apple TV",
  agreeToRules: true,
  note: "",
};

beforeEach(() => {
  requireUserMock.mockResolvedValue({ id: "u1", role: "applicant" });
  $transaction.mockResolvedValue([{}, {}]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("submitApplication", () => {
  it("stores the answers and flips status to pending atomically", async () => {
    const result = await submitApplication(answers);

    expect(result).toEqual({ success: true });
    // Both writes are handed to a single $transaction call.
    expect($transaction).toHaveBeenCalledTimes(1);

    const upsertArg = upsert.mock.calls[0][0];
    expect(upsertArg.where).toEqual({ userId: "u1" });
    expect(upsertArg.create.status).toBe("pending");
    expect(upsertArg.create.answers.referralSource).toBe("reddit");
    // A resubmit clears any prior review and returns to pending.
    expect(upsertArg.update.status).toBe("pending");
    expect(upsertArg.update.reviewedBy).toBeNull();

    expect(update.mock.calls[0][0]).toEqual({
      where: { id: "u1" },
      data: { applicationStatus: "pending" },
    });
  });

  it("blocks non-applicants (members/admins)", async () => {
    requireUserMock.mockResolvedValue({ id: "u1", role: "member" });
    const result = await submitApplication(answers);
    expect("error" in result).toBe(true);
    expect($transaction).not.toHaveBeenCalled();
  });

  it("rejects invalid input before any write", async () => {
    const result = await submitApplication({ ...answers, agreeToRules: false });
    expect("error" in result && result.error).toMatch(/house rules/i);
    expect($transaction).not.toHaveBeenCalled();
  });
});
