import "server-only"
import bcrypt from "bcryptjs"

// Password hashing lives server-side only. bcryptjs is a pure-JS implementation
// (no native build step), which suits this environment. Cost 12 is a sensible
// default for an interactive login — not over-engineered.
const COST = 12

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
