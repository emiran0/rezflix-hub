# REZFLIX Hub

The single entry point for the REZFLIX media service (a self-hosted, Jellyfin-focused
streaming setup). The Hub is where users sign up, sign in, and reach everything the
service offers from one place.

## What it does (v1)

- **Landing page** introducing the service.
- **Hub accounts** — sign up and log in with a Hub-owned username + password.
- **Link your Jellyfin account** — existing members prove ownership of their Jellyfin
  login once to become a full member. Jellyfin is a *link step*, never a login provider,
  and its credentials never leave the server.
- **Apply to join** — people without a Jellyfin account fill out a short questionnaire;
  an admin reviews and approves.
- **Quick-launch links** to the service's apps once you're a member.
- **Profile page** for your account details and Jellyfin link status.

## Stack

- **Next.js (App Router) + React + TypeScript** — one app, strict server/client boundary.
- **Tailwind CSS + shadcn/ui** — dark theme only.
- **PostgreSQL + Prisma** — self-hosted database, guided migrations.
- **Auth.js (NextAuth)** — username/password auth with JWT sessions.
- **Zod** for validation, **Motion** for animation, **Vitest + Playwright** for tests.

## Getting started

Requires Node ≥ 22 and Docker.

```bash
docker compose -f infra/docker-compose.dev.yml up -d   # local Postgres (+ Adminer)
cp .env.example .env                                    # then fill in the values
npm install
npx prisma migrate dev                                  # set up the database schema
npm run dev                                             # http://localhost:3000
```

## Project docs

Design and scope live in [`docs/`](docs/): product requirements (`PRD.md`), system
design and auth flows (`ARCHITECTURE.md`), the theme/design system (`DESIGN-SYSTEM.md`),
and the build checklist (`TASKS.md`).

## Status

Early development — building out the foundations in order. See `docs/TASKS.md` for the
current checklist.
