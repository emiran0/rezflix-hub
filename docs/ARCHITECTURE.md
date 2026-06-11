# ARCHITECTURE — REZFLIX Hub

> **How** the hub is built. This is a recommended baseline. If a stack or design choice
> changes during the build, that's allowed — update this file in the same commit so it
> stays accurate.

## 1. System context

The hub runs on the **VPS** (already hosting the `rezlab-relay` Caddy reverse proxy).
It is intentionally **independent of the home server**, so the upcoming GPC → new-server
migration does not affect it.

```
        Internet
           │  https://www.rezflixtv.com
           ▼
   ┌─────────────────────────────────────────┐
   │ VPS                                       │
   │                                           │
   │   rezlab-relay (Caddy, TLS)               │
   │        │ reverse_proxy                    │
   │        ▼                                  │
   │   rezflix-hub  (Next.js app container)    │
   │        │ Prisma                           │
   │        ▼                                  │
   │   hub-db  (Postgres container + volume)   │
   │                                           │
   └──────────┬────────────────────────────────┘
              │ Tailscale (WireGuard, private)
              │ JELLYFIN_INTERNAL_URL = http://<gpc-tailnet-ip>:8096
              ▼
        Jellyfin on GPC  (today)  →  Jellyfin on new server (after migration)
```

- **Jellyfin link path is private:** when a user links their Jellyfin account, the hub
  verifies their Jellyfin credentials against Jellyfin over the **Tailnet IP**, not the
  public internet. No Jellyfin API exposure or plugin required.
- **v2 service integrations** (Tracearr, Seer) are reached via their existing public
  **Cloudflare Tunnel** URLs, configured as env vars — not built in v1.
- **Migration insulation:** when Jellyfin moves to the new server, update
  `JELLYFIN_INTERNAL_URL` to the new Tailnet IP. Nothing else changes.

## 2. Frontend / backend / database separation

One Next.js app, with a hard boundary:

- **Frontend** (browser): pages, components, animations. Shows UI and makes authenticated
  requests to our own backend. Holds no secrets and no business logic.
- **Backend** (VPS only): Server Components, Route Handlers, Server Actions. All DB access,
  all Auth.js logic, and the Jellyfin verification call live here. Never ships to the browser.
- **Database**: Postgres in its own container with a persistent named volume. Only the
  backend connects to it.

Deployment view = **two containers** (app + db). Code view = frontend + backend in one
project, divided by the server/client boundary. We do **not** split the backend into a
separate service in v1 — no benefit at this scale.

## 3. Baseline stack & rationale
| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router) + React 19 + TS** | One deployable; server/client boundary; View Transitions + React Compiler help perf & animation; SSR/SSG ready for v2 blog/docs SEO |
| UI | **Tailwind v4 + shadcn/ui (Radix base, `radix-nova` preset)** | Accessible primitives, token-driven theming, dark-first. shadcn 4.11 replaced named styles ("new-york") with presets; `radix-nova` is the Radix + Lucide + Geist successor. |
| Animation | **Motion** (+ Next View Transitions) | Tasteful micro-interactions, reduced-motion aware |
| Auth | **Auth.js v5 (NextAuth)** | Credentials provider maps cleanly onto our own username/password store; the Jellyfin step is a *link/verification*, not a login, so we don't need a provider for it. We own password hashing + the user table; Auth.js owns the session. |
| DB | **PostgreSQL (self-hosted)** | Applicant/member data stays on your VPS (privacy); no third-party DB |
| ORM | **Prisma 6.x** | Guided migrations, readable schema, Studio browser; app is a persistent Node server (not edge), so Drizzle's edge advantages don't apply. Pinned to **6.19.3** rather than the new v7 — v7's `prisma-client` generator/`prisma.config.ts` changes would diverge from the classic layout the Dockerfile + tooling assume; revisit post-v1. |
| Validation | **Zod** | One schema, validated on client and server |
| Tests | **Vitest + Playwright** | Unit + e2e incl. mobile viewports |

> **Auth decision (locked):** we use **Auth.js v5**, not BetterAuth. Rationale: identity is
> Hub-owned username/password, and Jellyfin is a *link step* rather than a login provider, so
> the Credentials provider is the natural fit. Trade-off: the Credentials provider supports
> only the **JWT session strategy**, not DB-backed revocable sessions — accepted for v1 (see §6).
> Drizzle remains the documented ORM fallback if Prisma proves awkward.

## 4. Data model (sketch — refine during build)
We own the `user` table (username/password identity); Auth.js reads it directly in the
Credentials `authorize` callback (**no Prisma adapter** — the adapter only manages DB sessions,
which the Credentials provider doesn't use). Because we use the **Credentials provider with JWT
sessions**, there is **no `session` table** — the session lives in a signed httpOnly cookie.
Indicative shape:

- **user**: id, username (unique), email (unique), passwordHash, displayName, role
  (`applicant`/`member`/`admin`), applicationStatus (`none`/`pending`/`approved`/`rejected`),
  jellyfinUserId (unique, nullable), jellyfinLinkedAt (nullable), avatar (nullable),
  createdAt, updatedAt.
  - `member` is defined by having a non-null `jellyfinUserId` (Jellyfin link = membership).
  - `admin` is derived at sign-in from the `ADMIN_EMAILS` env var (see §5.4), persisted to `role`.
- **account / verificationToken**: only if/when Auth.js needs them (e.g. a future OAuth or
  email-verification provider). Not required for the Credentials + JWT setup in v1.
- **application**: id, userId (fk, unique), answers (structured/JSON or columns), status
  (`pending`/`approved`/`rejected`), reviewedBy (nullable), reviewedAt (nullable), createdAt.
  Index on userId and status.
- **service_link** (optional; can start as a config file): id, label, url, icon, order,
  visibleToRole.

Add indexes on all foreign keys. Use `prisma migrate`, never `db push`, for anything kept.

## 5. Authentication flows

**Core principle: the Hub owns identity.** Everyone — including existing Jellyfin members —
creates a Hub account first, so every user and email is tracked from day one. **Login is
always username + password.** Jellyfin is never a login provider; it is a *link step* that
proves a user owns a Jellyfin account and thereby makes them a `member`.

### 5.1 Sign up (everyone)
1. Browser submits **username + email + password** to a server action / route (Zod-validated).
2. Enforce unique username **and** unique email. Hash the password (e.g. argon2/bcrypt);
   store on `user`. New user = role `applicant`, `applicationStatus = none`.
3. Issue a session (Auth.js JWT cookie). The new user lands on a home that offers two paths:
   **"Link Jellyfin Account"** (if they already have one) and **"Apply to join"** (if they don't).

### 5.2 Log in (everyone)
1. Browser submits **username + password** to the Auth.js Credentials provider.
2. Server looks up the user by username, verifies the password hash, and on success issues
   the JWT session cookie. Generic error on failure (don't reveal which field was wrong).

### 5.3 Link Jellyfin Account → become a member
This is the **only** path to `member`, and it needs **no Jellyfin plugin or admin API token**.
1. A signed-in user opens "Link Jellyfin Account" on their profile and enters their
   **Jellyfin username + password**.
2. **Server-side only**, the hub POSTs to Jellyfin `…/Users/AuthenticateByName` at
   `JELLYFIN_INTERNAL_URL` (Tailnet) with the app's `X-Emby-Authorization` header. This is
   pure proof-of-ownership — we authenticate as the user, then discard the result.
3. On success, Jellyfin returns the user object (incl. `User.Id`). The hub stores
   `jellyfinUserId` + `jellyfinLinkedAt` on the **current** Hub user and sets role = `member`.
   Enforce `jellyfinUserId` uniqueness so one Jellyfin account can't link to two Hub accounts.
4. The Jellyfin password is used once for verification and **never stored or logged**.
5. Failure modes (surface clear messages): wrong Jellyfin creds; Jellyfin unreachable;
   that Jellyfin account is already linked to another Hub user.

Because the Jellyfin server is the source of truth for "are you a member," **existing members
can link immediately**. **New applicants cannot link until an admin manually creates their
Jellyfin account** (post-approval, see 5.5), after which they link the same way.

### 5.4 Admin role
Admins are not self-served. At sign-in, if the user's email is in the server-only
`ADMIN_EMAILS` env var (comma-separated), the hub sets/persists role = `admin`. Removing the
email does not auto-demote in v1 — fine at this scale; revisit if needed.

### 5.5 Apply to join (users without a Jellyfin account)
1. Applicant completes the questionnaire (Zod-validated) → stored in `application`;
   `applicationStatus = pending`.
2. Admin reviews (admin-only list) → approve/reject (`approved`/`rejected`).
3. On approval, the admin **manually creates the user's Jellyfin account** in Jellyfin (v1 has
   no automated provisioning). The user then links it via 5.3, which is what actually makes
   them a `member`. Approval alone does not grant `member` — the Jellyfin link does.

## 6. Client/server security boundary (what is and isn't exposed)
- **Never exposed to the browser:** DB connection string, `AUTH_SECRET`, `ADMIN_EMAILS`,
  `JELLYFIN_INTERNAL_URL` + any Jellyfin/API credentials, any service API keys. These are
  plain (non-`NEXT_PUBLIC_`) env vars, read only in server code.
- **The Jellyfin link/verification** happens entirely server-side; the browser never contacts
  Jellyfin and never holds the Jellyfin password beyond the form submit.
- **Sessions** are Auth.js **JWT** cookies — httpOnly + Secure + SameSite, signed with
  `AUTH_SECRET`, unreadable by client JS. JWT is a constraint of the Credentials provider;
  sessions are therefore not DB-revocable, so keep token lifetimes **short** (e.g. ≤7d, with
  a sensible idle expiry) to bound the blast radius. Acceptable for v1.
- **The browser** only receives rendered UI and data we deliberately return from the server.

## 7. Security baseline (normal, not gold-plated)
Do these; don't go beyond them for v1:
- HTTPS everywhere (Caddy handles TLS at `rezlab-relay`).
- Hashed passwords (argon2id or bcrypt, our own hashing); no plaintext, no secret logging.
- Zod validation at every server entry point.
- Basic rate-limiting on signup, login, **and the Jellyfin link endpoint** (per-IP/per-account,
  simple in-memory or DB is fine for v1; Redis later if needed). Note: in-memory counters
  reset on container restart — acceptable for v1, move to DB/Redis if it needs to be durable.
- Standard security headers (CSP can start report-only), sensible CORS (same-origin app).
- Least-privilege DB user. Backups of the Postgres volume.
- **Not** in scope: WAF, custom crypto, pen-test-grade hardening, exhaustive audit logging.

## 8. Deployment

### Local (development / v1 testing)
```bash
docker compose -f infra/docker-compose.dev.yml up -d   # Postgres (+ Adminer)
cp .env.example .env                                    # fill values
npm install
npx prisma migrate dev
npm run dev                                             # http://localhost:3000
```
To test real Jellyfin login locally, be on the Tailnet and set `JELLYFIN_INTERNAL_URL` to
the GPC Tailnet IP. Otherwise stub the Jellyfin client so the rest of auth is testable.

### Production (VPS)
1. Build the image from `infra/Dockerfile` (Next.js standalone output).
2. Bring up app + db with `infra/docker-compose.prod.yml` (real secrets via `.env`).
3. Add `infra/Caddyfile.snippet` to **rezlab-relay** so `www.rezflixtv.com` reverse-proxies
   to the hub container; Caddy issues/renews TLS automatically.
4. Run `npx prisma migrate deploy` against the prod DB on release.

## 9. Open items to confirm during build
- Exact Jellyfin base URL/port over Tailnet (`JELLYFIN_INTERNAL_URL`).
- Whether `service_link` starts as a config file (simplest) or a DB table.
- Final questionnaire fields (kept schema-driven so they're easy to change).
