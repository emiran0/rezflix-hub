"use server";

import { Prisma } from "@prisma/client";
import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";

export type SignupResult = {
  error: string;
  field?: "username" | "email" | "password";
};

// Create a Hub account (role defaults to `applicant`). Validation is re-run server-side
// (authoritative); the client schema is only for fast feedback. On success we issue a
// session and redirect home (PRD §5.1). Returns a SignupResult only on failure.
export async function signup(
  values: SignupInput,
): Promise<SignupResult | void> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path[0];
    const field =
      path === "username" || path === "email" || path === "password"
        ? path
        : undefined;
    return { error: issue?.message ?? "Invalid input", field };
  }

  const { username, email, password } = parsed.data;

  try {
    await prisma.user.create({
      data: { username, email, passwordHash: await hashPassword(password) },
    });
  } catch (err) {
    // Unique constraint (P2002) -> map to a specific, friendly field error. The target
    // is the index name on Postgres (e.g. "User_email_key"), so match by substring.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const target = Array.isArray(err.meta?.target)
        ? err.meta.target.join(",")
        : String(err.meta?.target ?? "");
      if (target.includes("email"))
        return { error: "That email is already registered", field: "email" };
      if (target.includes("username"))
        return { error: "That username is taken", field: "username" };
      return { error: "An account with those details already exists" };
    }
    throw err;
  }

  // signIn throws a redirect on success — let it propagate. Only catch auth failures.
  try {
    await signIn("credentials", { username, password, redirectTo: "/" });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Account created — please log in to continue." };
    }
    throw err;
  }
}
