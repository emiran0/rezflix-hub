"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { requireUser } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { getJellyfinClient } from "@/lib/jellyfin";
import {
  linkJellyfinSchema,
  type LinkJellyfinInput,
} from "@/lib/validations/jellyfin";

export type LinkJellyfinResult = { error: string } | { success: true };

// Map the low-level client outcomes to user-facing copy. Refined further in task 3.3.
const REASON_MESSAGE: Record<string, string> = {
  invalid_credentials:
    "Those Jellyfin credentials didn't work. Check your username and password.",
  unreachable: "Can't reach Jellyfin right now. Please try again shortly.",
  unexpected:
    "Something went wrong verifying your Jellyfin account. Please try again.",
};

// Link the **current** signed-in Hub user to a Jellyfin account (ARCHITECTURE §5.3): verify
// the Jellyfin credentials as proof of ownership, then store `jellyfinUserId` +
// `jellyfinLinkedAt` and become a `member`. The Jellyfin password is never stored. This is
// the only path to `member`. Endpoint rate-limiting + edge-case polish land in task 3.3.
export async function linkJellyfin(
  values: LinkJellyfinInput,
): Promise<LinkJellyfinResult> {
  const sessionUser = await requireUser();

  const parsed = linkJellyfinSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Re-read current link state (the session doesn't carry it). One Hub user links once.
  const current = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { role: true, jellyfinUserId: true },
  });
  if (!current) return { error: "Account not found." };
  if (current.jellyfinUserId) {
    return { error: "Your account is already linked to a Jellyfin account." };
  }

  const result = await getJellyfinClient().authenticateByName(
    parsed.data.jellyfinUsername,
    parsed.data.jellyfinPassword,
  );
  if (!result.ok) {
    return {
      error: REASON_MESSAGE[result.reason] ?? REASON_MESSAGE.unexpected,
    };
  }

  // Linking makes a non-admin a `member`; admins keep `admin` (higher privilege, and it's
  // re-asserted from ADMIN_EMAILS on sign-in anyway) — never self-demote.
  const nextRole = current.role === "admin" ? "admin" : "member";

  try {
    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        jellyfinUserId: result.jellyfinUserId,
        jellyfinLinkedAt: new Date(),
        role: nextRole,
      },
    });
  } catch (err) {
    // Unique constraint on `jellyfinUserId`: that Jellyfin account is already linked to a
    // different Hub user (one Jellyfin account ↔ one Hub user). 3.3 expands edge cases.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        error:
          "That Jellyfin account is already linked to another Hub account.",
      };
    }
    throw err;
  }

  revalidatePath("/profile");
  return { success: true };
}
