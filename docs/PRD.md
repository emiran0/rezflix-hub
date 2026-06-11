# PRD — REZFLIX Hub (v1)

> Source of truth for **what** we're building and **why**. Scope is deliberately small;
> everything not in v1 is explicitly deferred. If scope changes, edit this file.

## 1. Summary
The REZFLIX Hub is a web app at `www.rezflixtv.com` that gives REZFLIX users one place to
land, sign in, jump into services, and manage a profile — instead of memorising a handful
of sub-domains. It is **Jellyfin-focused** (Plex is intentionally out of scope here).

## 2. Goals (v1)
- A polished, dark, modern front door at `www.rezflixtv.com`.
- Everyone uses a **Hub account** (username + email + password) — login is username + password.
- Existing REZFLIX members become **members** by **linking their Jellyfin account** from their profile.
- People outside REZFLIX create a Hub account and **apply** to join.
- Members get **quick-launch links** to services and a **profile page**.
- Works equally well on mobile and desktop.

## 3. Non-goals (deferred to v2+)
Blog / news, documentation, FAQ, setup guides, leaderboards, watch-stats dashboards,
embedded request UI, admin analytics, automated Jellyfin provisioning, email
notifications. Keep hooks/space for these but **do not build them in v1.**

## 4. Users & roles
| Role | Who | Can |
|---|---|---|
| **Guest** | Not signed in | See landing page; sign up or log in |
| **Applicant** | Signed up, no linked Jellyfin yet | Link a Jellyfin account, or apply to join; see application status; edit profile basics |
| **Member** | Has a linked Jellyfin account | Quick-launch links, full profile |
| **Admin** | Email in `ADMIN_EMAILS` | Everything + review/approve applications |

## 5. v1 features & requirements

### 5.1 Landing page (Guest)
- Branded REZFLIX hero, short value statement, clear CTAs: **Sign in** and **Apply**.
- Responsive; dark theme; tasteful entrance animation.
- No sensitive data; safe to be publicly reachable.

### 5.2 Authentication
The **Hub owns identity**: one `users` table, with **username and email unique across the
whole Hub**. **Everyone signs up first** (including existing Jellyfin members) so we track
all users and emails from day one. Sessions are httpOnly cookies (Auth.js JWT).

**Sign up — "Create a Hub account"**
- Collect **username + email + password**. Username and email both unique.
- New account = role `applicant`. After signup the user lands on a home offering two next
  steps: **Link Jellyfin Account** (existing members) or **Apply to join** (new people).

**Log in**
- Always **username + password** (no email login, no "sign in with Jellyfin").

**Become a member — "Link Jellyfin Account"** (on the profile)
- A signed-in user enters their **Jellyfin username + password**.
- Server-side, the Hub verifies them against Jellyfin (`AuthenticateByName`) over the Tailnet
  — purely as proof of ownership, **no Jellyfin plugin or admin token**. On success it stores
  the Jellyfin user id on the current account and sets role = member.
- Hub never stores the Jellyfin password. **Linking is the only way to become a member.**
- New applicants can't link until an admin has created their Jellyfin account (see 5.3).

Requirements:
- Passwords hashed (argon2id/bcrypt; never plaintext, never logged).
- Friendly, specific validation errors (e.g. "username taken"); generic login-failure message.
- Basic rate-limiting on signup, login, and the Jellyfin link endpoint.

### 5.3 Application / questionnaire (Applicant)
- A form gathering: display name, contact (e.g. email/Discord), how they heard about
  REZFLIX, what they want to watch, devices they'll use, agreement to house rules, plus a
  free-text note. (Final fields are easy to adjust — keep them config/schema-driven.)
- Stored against the applicant's Hub account; status: `pending` → `approved` / `rejected`.
- Applicant can see their status. Re-submission allowed if rejected (configurable).
- **Admin review (minimal):** a simple admin-only list of applications with approve/reject.
  On approval the admin **manually creates the user's Jellyfin account** (no automated
  provisioning in v1); the user then becomes a member by linking it on their profile.
  Approval by itself does not grant member — the Jellyfin link does.

### 5.4 Quick-launch links (Member)
- A grid of links to REZFLIX services (e.g. watch / request / others), each opening the
  relevant `*.rezflixtv.com` URL.
- **Config-driven** (a links config file/table), so adding a service later is trivial.
- Optional simple "is it up?" indicator is **v2** — v1 just links.

### 5.5 Profile (Member / Applicant)
- Shows account basics: username, email, role/status, Jellyfin-link status.
- **Link Jellyfin Account** action for unlinked users (the path to becoming a member; see 5.2).
- Edit: display name, password, avatar (optional/simple).
- **No watch statistics in v1** (that's a v2 Tracearr integration). Leave a clear seam.

## 6. Non-functional requirements
- **Design:** dark-only, clean/modern, globally consistent theme (see DESIGN-SYSTEM.md).
- **Mobile:** full parity — same features and quality on phones.
- **Accessibility:** keyboard-navigable, sufficient contrast, focus states, reduced-motion.
- **Security:** normal/sensible level (see ARCHITECTURE.md → Security). Not gold-plated.
- **Performance:** fast first load; lean client JS; images optimised.
- **Privacy:** applicant/member data stays on the self-hosted Postgres (no third-party DB).

## 7. Acceptance criteria (v1 "done")
- A guest can reach the landing page on mobile and desktop and read it comfortably.
- Anyone can sign up (username + email + password) and log in with username + password.
- A signed-in user can link their Jellyfin account, become a member, and land on a page with
  working quick-launch links.
- A new person can sign up, complete the application, and see a pending status.
- An admin (email in `ADMIN_EMAILS`) can view applications and approve/reject.
- A member can view and edit their profile.
- Secrets verified absent from the client bundle; sessions are httpOnly cookies.
- Lint + unit + e2e (incl. one mobile-viewport pass) all green.
