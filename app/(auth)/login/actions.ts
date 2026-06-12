"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

export type LoginResult = { error: string };

// Generic on purpose: bad input and wrong credentials both return the same message,
// so we never reveal whether the username exists. On success `signIn` throws a redirect
// (to "/"), which we let propagate. Returns a LoginResult only on failure.
const GENERIC_FAILURE = "Incorrect username or password";

export async function login(values: LoginInput): Promise<LoginResult | void> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: GENERIC_FAILURE };
  }

  const { username, password } = parsed.data;

  try {
    await signIn("credentials", { username, password, redirectTo: "/" });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: GENERIC_FAILURE };
    }
    throw err;
  }
}
