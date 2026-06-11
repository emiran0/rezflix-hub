import { z } from "zod";

// Shared client/server validation for auth. Username and email are normalized
// (trim + lowercase) so uniqueness is consistent and login lookups match signup.
// bcrypt only uses the first 72 bytes of a password, so we cap length there.

export const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Use only lowercase letters, numbers, and underscores",
    ),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  // bcrypt only hashes the first 72 *bytes*; cap by byte length (not char count) so
  // multibyte passwords aren't silently truncated. TextEncoder works on client + server.
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .refine(
      (p) => new TextEncoder().encode(p).length <= 72,
      "Password is too long (max 72 bytes)",
    ),
});

// `input` = what the form holds (pre-normalization); `output` = normalized values.
export type SignupInput = z.input<typeof signupSchema>;
export type SignupValues = z.output<typeof signupSchema>;
