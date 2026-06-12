"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type LoginResult = { error: string };

// Generic on purpose: bad input and wrong credentials both return the same message,
// so we never reveal whether the username exists. On success `signIn` throws a redirect
// (to "/"), which we let propagate. Returns a LoginResult only on failure.
const GENERIC_FAILURE = "Incorrect username or password";

export async function login(values: LoginInput): Promise<LoginResult | void> {
  // Throttle credential stuffing: 5 attempts / minute per IP, before any DB work.
  const rl = rateLimit(`login:${await clientIp()}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (!rl.success) {
    return {
      error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.`,
    };
  }

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
