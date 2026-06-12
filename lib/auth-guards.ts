import "server-only";

import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import type { Role } from "@prisma/client";

import { auth } from "@/auth";

// Server-only route guards. Each runs an authoritative session check (decoding the
// Auth.js JWT cookie) and redirects when the requirement isn't met. Use these at the
// top of protected Server Components / layouts / Server Actions — close to the data,
// per the Next.js + Auth.js recommendation. We deliberately do NOT gate in middleware:
// the Credentials provider's `authorize` pulls Prisma + bcrypt into `auth.ts`, which
// can't run in the edge middleware runtime, and per-segment server checks are the
// stronger, recommended boundary anyway (see docs/ARCHITECTURE.md §6.1).
//
// `redirect()` throws to halt rendering, so anything after a failed guard never runs.

// Derived from the augmented `Session` (types/next-auth.d.ts), not `ReturnType<typeof auth>`
// — `auth` is overloaded (it also wraps middleware), so ReturnType resolves the wrong shape.
export type SessionUser = Session["user"];

// Signed-in users only. Returns the session user; otherwise sends them to log in.
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

// Guests only (e.g. /login, /signup). A signed-in user has nothing to do here.
export async function requireGuest(): Promise<void> {
  const session = await auth();
  if (session?.user) redirect("/");
}

// Role-gated. Pass every role allowed through. Signed-out → /login (via requireUser);
// signed-in-but-wrong-role → home. Roles map to PRD personas: `applicant`, `member`
// (Jellyfin-linked), `admin`.
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

// Admin-only convenience wrapper (e.g. the application review list, Phase 4.4).
export async function requireAdmin(): Promise<SessionUser> {
  return requireRole("admin");
}
