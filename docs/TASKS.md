# TASKS — REZFLIX Hub (v1)

> Ordered, atomic build checklist. **One task ≈ one commit.** Plan each in plan mode,
> implement, run lint + tests, have the `reviewer` agent check it, then commit.
> Tasks are a guide — if reality differs, adjust and note it in the relevant doc.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done.

---

## Phase 0 — Scaffold & foundations

- [ ] **0.1** Init Next.js 16 (App Router, TS, ESLint) + Tailwind v4. Confirm dev server runs.
- [ ] **0.2** Add shadcn/ui (new-york). Configure dark-only tokens in `globals.css` per
      DESIGN-SYSTEM.md (no light theme, no toggle). Verify a sample Button/Card render dark.
- [x] **0.3** Add Prisma + Postgres connection. Wire `infra/docker-compose.dev.yml`.
      Create initial `prisma/schema.prisma`; run first `prisma migrate dev`.
      _Done:_ Prisma **pinned to 6.19.3** (not the just-released v7 — keeps the classic
      `prisma-client-js` layout the `infra/Dockerfile` + docs already assume; revisit v7 later).
      `lib/prisma.ts` = hot-reload-safe client singleton (server-only). Initial migration
      `init` creates the full `User` model + `Role`/`ApplicationStatus` enums + unique indexes
      (username, email, jellyfinUserId) — this **front-loads most of task 2.1** (the foundation
      Auth.js needs in 0.4); 2.1 is now mostly a verification/refinement step.
- [x] **0.4** Add Auth.js v5 (NextAuth) with the Credentials provider (JWT sessions).
      Set `AUTH_SECRET`. Confirm a session cookie can be issued for a test user.
      _Done:_ **No PrismaAdapter** — per the reviewer flag, the Credentials provider only supports
      JWT sessions, so the adapter's DB-session machinery is unused; `authorize` queries
      `prisma.user` directly (`auth.ts`) and verifies the hash via `lib/password.ts` (bcryptjs,
      pure-JS, cost 12). `app/api/auth/[...nextauth]/route.ts` exposes the handlers; `types/next-auth.d.ts`
      augments the session/JWT with `id`/`username`/`role`. **Env rename:** `.env`/`.env.example`
      still carry BetterAuth-era `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL` — these must become
      `AUTH_SECRET`/`AUTH_URL`, and `ADMIN_EMAILS` (ARCHITECTURE §5.4) must be added (owner edits `.env*`).
- [x] **0.5** Add Zod, Motion, `next/font`, Sonner. Set up Vitest + Playwright with one
      trivial passing test each. Add `.env.example` keys to `.env`.
      _Done:_ zod 4, motion 12, sonner 2 added; `next/font` (Geist) was already wired in 0.1.
      Sonner `<Toaster theme="dark">` mounted in the root layout (no next-themes — dark is pinned).
      **Vitest** (jsdom + Testing Library, `@/` alias mirrored) with `components/ui/button.test.tsx`;
      **Playwright** (`e2e/home.spec.ts`) runs on **desktop + Pixel-5 mobile** projects, boots the dev
      server itself. Scripts: `test`, `test:watch`, `test:e2e`. `.env.example` was fully rebuilt with
      placeholders in the prior step; copying the new keys into the real `.env` is owner-managed.
- [ ] **0.6** Project hygiene: `.gitignore` (ensure `.env` ignored), npm scripts
      (`dev/build/start/lint/test/test:e2e`), basic README in-repo.

## Phase 1 — App shell & design system

- [x] **1.1** Root layout: dark theme applied globally, font loaded, base background/foreground.
      _Done:_ mostly satisfied by the 0.2 scaffold (`:root` dark tokens + `color-scheme: dark`,
      `<html class="dark">`, Geist via `next/font`, `@layer base` `body { bg-background text-foreground }`).
      Added a `viewport` export (`colorScheme: "dark"` + `themeColor` ≈ `--background`) so mobile
      browser chrome is dark, and switched the body to `min-h-svh` for correct mobile viewport height.
- [x] **1.2** Responsive nav/top bar (collapses to a sheet on mobile) + footer. Thumb-reachable.
      _Done:_ `SiteHeader` (sticky, translucent, brand + desktop nav at md+) + `MobileNav`
      (client island: hamburger → shadcn `Sheet`, 44px trigger) + `SiteFooter`, all mounted in the
      root layout (content area flex-grows so the footer sits at the bottom). Links come from a
      typed `nav-config.ts` (guest set for now; auth-aware variants in 2.3 — `/login`,`/apply` routes
      arrive in later phases). Playwright now also asserts the desktop-hidden / mobile-sheet behaviour.
- [x] **1.3** Shared UI building blocks wired to tokens (page container, section, card grid).
      _Done:_ `PageContainer` (`max-w-6xl` + matching gutters), `Section` (vertical rhythm), and
      `CardGrid` (1→2→3 cols) — all thin `cn()`-mergeable wrappers, tokens/utilities only. The
      shell header + footer were refactored to consume `PageContainer` (DRYs the duplicated rhythm
      the 1.2 review flagged). Unit test covers render + class-merge wiring.
- [x] **1.4** Motion primitives: a reusable entrance animation + page/route transition,
      both guarded by `prefers-reduced-motion`.
      _Done:_ `FadeIn` (subtle fade+rise entrance) and `PageTransition` (route-keyed enter, in the
      layout content area) under `components/motion/`, both JS-guarded via Motion's `useReducedMotion`.
      Plus a **global** `@media (prefers-reduced-motion: reduce)` reset in `globals.css` that
      neutralizes CSS-driven animation (Radix/Sheet, Sonner, tw-animate, hovers) — this resolves the
      deferred Sheet/Sonner reduced-motion items. `FadeIn` demoed on the temp landing card. Unit
      smoke tests + a jsdom `matchMedia` polyfill added. (Used Motion for the route transition rather
      than the View Transitions API — reliable in the App Router today; revisit View Transitions later.)

## Phase 2 — Identity & username/password auth

- [x] **2.1** User model fields (role, applicationStatus, username unique, email unique,
      passwordHash, jellyfinUserId unique/nullable, jellyfinLinkedAt). Migrate.
      _Done:_ verification only — the 0.3 `init` migration already covers every Phase-2 field: `role`
      (enum, default `applicant`), `applicationStatus` (enum, default `none`), unique `username`/`email`,
      `passwordHash`, nullable+unique `jellyfinUserId`, nullable `jellyfinLinkedAt` (+ `displayName`,
      `avatar`, timestamps). `prisma validate` passes; `prisma migrate status` = up to date, no drift.
      **No schema change / no new migration needed.** (No Account/Session/VerificationToken tables —
      Credentials+JWT without the Prisma adapter doesn't use them.)
- [x] **2.2** Signup (username + email + password). Zod validation; unique username/email
      errors. Hash the password (argon2id/bcrypt). New user = role `applicant`.
      _Done:_ `/signup` page + `SignupForm` (shadcn Form + RHF + zod resolver). Shared `signupSchema`
      (`lib/validations/auth.ts`) normalizes username/email (trim+lowercase) and caps password at 72
      (bcrypt limit); login `authorize` now lowercases to match. Server action (`app/(auth)/signup/actions.ts`)
      re-validates server-side, hashes via `lib/password.ts` (bcryptjs), creates the user (defaults
      `applicant`/`none`), maps Prisma **P2002** to a specific field error ("username taken" / "email
      already registered"), then auto-signs-in and redirects home (PRD §5.1). Signed-in users are
      redirected off `/signup`. Verified end-to-end against the live DB (create→session→redirect, and
      the duplicate-email error path). Unit tests cover the schema. Rate-limiting is task 2.6.
- [x] **2.3** Login (**username + password**) via Auth.js Credentials + logout. httpOnly JWT
      session cookie; generic failure message. Auth-aware nav.
      _Done:_ `/login` page + `LoginForm` (shadcn Form + RHF + zod resolver) mirror signup. Shared
      `loginSchema` (`lib/validations/auth.ts`) normalizes the username (trim+lowercase) to match the
      `authorize` lookup; password just non-empty. Server action (`app/(auth)/login/actions.ts`) calls
      `signIn("credentials", …)` and returns **one** generic `"Incorrect username or password"` for
      both bad input and wrong creds — never reveals whether the username exists. Logout = `SignOutButton`
      (server component: inline `signOut` server-action form) consumed by the auth-aware shell.
      **Auth-aware nav:** `SiteHeader` is now async, reads `auth()` server-side, and renders username +
      Log out vs. Sign in; `MobileNav` takes `user` + a server-rendered `signOutSlot`. Signed-in users
      are redirected off `/login`. e2e `login.spec.ts` (desktop + Pixel-5): no horizontal scroll + empty-
      submit field errors; unit tests cover `loginSchema`. Rate-limiting is task 2.6; ADMIN_EMAILS is 2.5.
- [x] **2.4** Route protection: server-side session checks; role/status gating
      (guest vs applicant vs member vs admin).
      _Done:_ `lib/auth-guards.ts` (server-only) exposes `requireUser` (→ `/login` if signed out),
      `requireGuest` (→ `/` if signed in), `requireRole(...roles)` (signed-out → `/login`, wrong role
      → `/`), and a `requireAdmin` wrapper — each decodes the Auth.js JWT via `auth()` and `redirect()`s
      to halt. `SessionUser` is derived from the augmented `Session` (not `ReturnType<typeof auth>`,
      which resolves `auth`'s middleware overload). `/login` + `/signup` now call `requireGuest()`
      instead of the inline check. Roles map to PRD §3 personas (`member` = Jellyfin-linked, `admin`
      from `ADMIN_EMAILS`). **No edge middleware (deliberate):** `authorize` pulls Prisma+bcrypt into
      `auth.ts`, which can't run in the edge runtime, and per-segment server checks are the stronger
      boundary — documented in ARCHITECTURE §6.1. Unit tests cover all four guards (both pass + redirect
      branches). The guards get consumed as protected routes land (apply/profile/admin, Phases 4–5).
- [ ] **2.5** Admin promotion: on sign-in, set role `admin` for emails in `ADMIN_EMAILS`.
- [ ] **2.6** Basic rate-limiting on signup + login.

## Phase 3 — Link Jellyfin Account (becoming a member)

- [ ] **3.1** Server-side Jellyfin client: `AuthenticateByName` against `JELLYFIN_INTERNAL_URL`
      (Tailnet), server-only, no plugin/admin token. Make it stubbable for local tests.
- [ ] **3.2** "Link Jellyfin Account" flow (signed-in only): verify Jellyfin creds → store
      `jellyfinUserId` + `jellyfinLinkedAt` on the **current** user → role member. Never store the
      Jellyfin password. Enforce `jellyfinUserId` uniqueness (one Jellyfin account ↔ one Hub user).
- [ ] **3.3** Handle edge cases: wrong Jellyfin creds, Jellyfin unreachable, that Jellyfin
      account already linked to another Hub user. Clear, specific errors. Rate-limit the endpoint.
- [ ] **3.4** Tests: link success, wrong creds, unreachable, already-linked (mocked Jellyfin).

## Phase 4 — Application / questionnaire

- [ ] **4.1** `application` model + migration (schema-driven answers).
- [ ] **4.2** Questionnaire form (shadcn Form + Zod), mobile-friendly, saves against the
      applicant. Shows submitted state + status.
- [ ] **4.3** Applicant status view (pending/approved/rejected); allow edit/resubmit per PRD.
- [ ] **4.4** Admin-only review list with approve/reject; approve flips role to member.

## Phase 5 — Profile

- [ ] **5.1** Profile page: shows username, email, role/status, Jellyfin-link status; hosts the
      **Link Jellyfin Account** action (Phase 3) for unlinked users.
- [ ] **5.2** Edit display name, password, optional avatar. Validated.
- [ ] **5.3** Leave a clear, empty seam for future watch-stats (v2 Tracearr) — no stats now.

## Phase 6 — Quick-launch links

- [ ] **6.1** Config-driven service links (start as a typed config file: label/url/icon/order/
      role-visibility).
- [ ] **6.2** Responsive link grid on the member home (1 col mobile → 2–3 desktop), tap-friendly,
      subtle hover/entry motion.

## Phase 7 — Landing page

- [ ] **7.1** Guest landing: hero, value statement, CTAs (Sign in / Apply), entrance animation.
- [ ] **7.2** Authenticated redirect: members land on quick-launch home; applicants on status.

## Phase 8 — Harden, test, deploy

- [ ] **8.1** Security headers; confirm no secret has a `NEXT_PUBLIC_` prefix; audit the
      client bundle for leaked env/values (reviewer agent + manual check).
- [ ] **8.2** Error/empty/loading states across pages; 404/500 pages on-theme.
- [ ] **8.3** Full Playwright pass incl. **mobile viewport** for: landing, signup→apply,
      Jellyfin login (mocked), profile edit.
- [ ] **8.4** Production build: `infra/Dockerfile` + `infra/docker-compose.prod.yml`;
      `prisma migrate deploy`; add `infra/Caddyfile.snippet` to rezlab-relay; smoke-test
      `www.rezflixtv.com`.
- [ ] **8.5** Backups: confirm the Postgres volume is backed up.

---

### Definition of done (per task)

1. Behaviour matches PRD + ARCHITECTURE. 2. On-theme + mobile-checked (DESIGN-SYSTEM).
2. Lint + unit pass; e2e where relevant. 4. `reviewer` agent passed (no exposed secrets,
   boundary respected, validation present). 5. One focused conventional commit.
