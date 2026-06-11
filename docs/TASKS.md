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
- [ ] **1.3** Shared UI building blocks wired to tokens (page container, section, card grid).
- [ ] **1.4** Motion primitives: a reusable entrance animation + page/route transition,
  both guarded by `prefers-reduced-motion`.

## Phase 2 — Identity & username/password auth
- [ ] **2.1** User model fields (role, applicationStatus, username unique, email unique,
  passwordHash, jellyfinUserId unique/nullable, jellyfinLinkedAt). Migrate.
  _Note:_ the `User` model + enums + indexes were created in **0.3**; this task is now mostly
  verifying the shape still matches Phase 2 needs (add fields/migrate only if something's missing).
- [ ] **2.2** Signup (username + email + password). Zod validation; unique username/email
  errors. Hash the password (argon2id/bcrypt). New user = role `applicant`.
- [ ] **2.3** Login (**username + password**) via Auth.js Credentials + logout. httpOnly JWT
  session cookie; generic failure message. Auth-aware nav.
- [ ] **2.4** Route protection: server-side session checks; role/status gating
  (guest vs applicant vs member vs admin).
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
3. Lint + unit pass; e2e where relevant. 4. `reviewer` agent passed (no exposed secrets,
boundary respected, validation present). 5. One focused conventional commit.
