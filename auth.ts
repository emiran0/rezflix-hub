import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { isAdminEmail } from "@/lib/admin";

// Auth.js v5 (NextAuth). Identity is Hub-owned: login is always username + password
// against our own `User` table (see docs/ARCHITECTURE.md §5).
//
// Deliberately NO PrismaAdapter. With the Credentials provider, Auth.js only supports
// the JWT session strategy — the adapter's database-session machinery is unused, so
// attaching it adds confusion without benefit. We query `prisma.user` directly in
// `authorize` instead. (Reviewer note from Phase 0.3.)
export const { handlers, auth, signIn, signOut } = NextAuth({
  // We deploy self-hosted behind the rezlab-relay (Caddy) reverse proxy, not Vercel, so
  // trust the forwarded host. `AUTH_URL` in prod still pins the canonical origin.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // Returning `null` produces a generic failure — we never reveal whether the
      // username or the password was wrong. Full Zod validation of the login form
      // lands in task 2.3; here we just guard against empty input.
      authorize: async (credentials) => {
        const username =
          typeof credentials?.username === "string"
            ? credentials.username.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!username || !password) return null;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        // Admin promotion (ARCHITECTURE §5.4): if this email is in the server-only
        // ADMIN_EMAILS allowlist, persist role = admin on sign-in. Only promotes (never
        // auto-demotes in v1) and only writes when the role actually changes.
        let role = user.role;
        if (role !== "admin" && isAdminEmail(user.email)) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: "admin" },
          });
          role = "admin";
        }

        // Minimal principal — only what the token/session need. Never the passwordHash.
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.displayName ?? user.username,
          role,
        };
      },
    }),
  ],
  callbacks: {
    // Persist id/username/role onto the JWT at sign-in so route handlers and
    // Server Components can authorize without another DB round-trip.
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id as string;
        token.username = (user as { username: string }).username;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
      }
      return session;
    },
  },
});
