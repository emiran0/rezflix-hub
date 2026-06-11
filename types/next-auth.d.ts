import type { DefaultSession } from "next-auth"
import type { Role } from "@prisma/client"

// Augment Auth.js types with the fields we carry on the session/JWT. Keeps
// `session.user.role`, `.id`, `.username` strongly typed across the app.
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      role: Role
    } & DefaultSession["user"]
  }

  interface User {
    username: string
    role: Role
  }
}

// Augment the canonical JWT source. `next-auth/jwt` only re-exports (`export *`) from
// `@auth/core/jwt`, so augmenting it does not merge — augment the source module instead.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    username: string
    role: Role
  }
}
