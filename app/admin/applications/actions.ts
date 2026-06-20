"use server";

import { revalidatePath } from "next/cache";
import { Prisma, type ApplicationStatus } from "@prisma/client";

import { requireAdmin } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

export type ReviewDecision = "approve" | "reject";
export type ReviewResult = { error: string } | { success: true };

// approve/reject map to the application's terminal review statuses. Note: approval does
// NOT grant `member` — an admin manually creates the Jellyfin account and the applicant
// links it to become a member (PRD §5.3 / ARCHITECTURE §5.5). Role is untouched here.
const DECISION_STATUS: Record<ReviewDecision, ApplicationStatus> = {
  approve: "approved",
  reject: "rejected",
};

// Admin-only application review (PRD §5.3, task 4.4). Sets the application's status and
// stamps who/when, and mirrors `User.applicationStatus` so the applicant's status view
// stays in sync — both in one transaction so they can't diverge.
export async function reviewApplication(
  applicationId: string,
  decision: ReviewDecision,
): Promise<ReviewResult> {
  const admin = await requireAdmin();

  if (decision !== "approve" && decision !== "reject") {
    return { error: "Invalid decision." };
  }
  if (typeof applicationId !== "string" || applicationId.length === 0) {
    return { error: "Invalid application." };
  }

  const status = DECISION_STATUS[decision];

  try {
    await prisma.$transaction(async (tx) => {
      const application = await tx.application.update({
        where: { id: applicationId },
        data: { status, reviewedBy: admin.id, reviewedAt: new Date() },
        select: { userId: true },
      });
      await tx.user.update({
        where: { id: application.userId },
        data: { applicationStatus: status },
      });
    });
  } catch (err) {
    // P2025 = the application (or its user) no longer exists.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return { error: "That application no longer exists." };
    }
    throw err;
  }

  revalidatePath("/admin/applications");
  return { success: true };
}
