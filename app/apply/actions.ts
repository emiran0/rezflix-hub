"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import {
  applicationSchema,
  isResubmittable,
  type ApplicationInput,
} from "@/lib/validations/application";

export type ApplyResult = { error: string } | { success: true };

// Submit (or resubmit) the join questionnaire for the **current** signed-in applicant
// (PRD §5.3 / ARCHITECTURE §5.5). Stores the answers on `Application` and flips both the
// row and the user's `applicationStatus` to `pending`, atomically. Only applicants apply —
// members/admins don't need to. Approval here does NOT grant `member`; the Jellyfin link does.
export async function submitApplication(
  values: ApplicationInput,
): Promise<ApplyResult> {
  const sessionUser = await requireUser();

  // Server-side gate (defense in depth; the page also redirects non-applicants).
  if (sessionUser.role !== "applicant") {
    return { error: "Only applicants can submit the join questionnaire." };
  }

  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // A first submission (no row yet) is always allowed; an existing one can only be
  // edited/resubmitted from a resubmittable status (not once approved). Defense in depth —
  // the page already hides the form when locked.
  const existing = await prisma.application.findUnique({
    where: { userId: sessionUser.id },
    select: { status: true },
  });
  if (existing && !isResubmittable(existing.status)) {
    return { error: "Your application can no longer be edited." };
  }

  const answers = parsed.data as unknown as Prisma.InputJsonObject;

  // One application per user (`userId` unique). Upsert covers first submit + resubmit, and
  // a resubmit returns to `pending` and clears any prior review. Both writes run in one
  // transaction so the row status and the user's mirror can't diverge.
  await prisma.$transaction([
    prisma.application.upsert({
      where: { userId: sessionUser.id },
      create: { userId: sessionUser.id, answers, status: "pending" },
      update: {
        answers,
        status: "pending",
        reviewedBy: null,
        reviewedAt: null,
      },
    }),
    prisma.user.update({
      where: { id: sessionUser.id },
      data: { applicationStatus: "pending" },
    }),
  ]);

  revalidatePath("/apply");
  return { success: true };
}
