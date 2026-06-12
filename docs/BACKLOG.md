# BACKLOG — REZFLIX Hub

Captured enhancements **not yet scheduled or built**. This is a holding pen, not a commitment —
items graduate into `PRD.md` / `TASKS.md` when we decide to build them.

Tags:

- **[schema]** — an additive DB column/model; fold into a migration deliberately (cheap now, expensive to retrofit later).
- **[ui]** — presentation only; safe to defer to a polish pass.
- **[design]** — needs a decision or new infrastructure before it can be built.

---

## Profile / identity enrichment (from owner, 2026-06-12)

### Schema fields to fold in early — low-risk additive columns on `User`

| Field                            | Tag             | Notes                                                                                                                                                                                                                                                                            |
| -------------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `jellyfinUsername String?`       | [schema]        | **We currently _discard_ this.** `linkJellyfin` gets `result.jellyfinUsername` from `AuthenticateByName` but only stores `jellyfinUserId`. To show the linked Rezflix username on the profile we must persist it (a snapshot; refresh on re-auth). Small add to the link action. |
| `birthday`                       | [schema + form] | Required at **sign-up**, must be **≥16 years**. Validate age client + server (Zod). Touches the already-built signup flow (2.2). Open decision below on required-ness.                                                                                                           |
| `bio String?`                    | [schema]        | Public, length-limited (suggest ≤280 chars, enforced in Zod). Optional, user-editable.                                                                                                                                                                                           |
| `points Int @default(0)`         | [schema]        | Loyalty/activity points (hub + watch side). **System-set only**, not user-editable. Earning logic is a separate subsystem (largely v2 — depends on watch data). Final name TBD.                                                                                                  |
| `tier` enum `@default(<lowest>)` | [schema]        | Bronze/Silver/Gold/Platinum… (themed names TBD). System-set. Derivation (from points thresholds vs manual) decided later. New `Tier` enum.                                                                                                                                       |
| `letterboxd String?`             | [schema]        | Social link. Store username (build the URL) vs full URL — decide once. Optional.                                                                                                                                                                                                 |
| `instagram String?`              | [schema]        | Social link. Optional.                                                                                                                                                                                                                                                           |
| `serializd String?`              | [schema]        | Social link (Letterboxd-for-TV). Optional.                                                                                                                                                                                                                                       |
| `bannerImage String?`            | [schema]        | URL/path to an uploaded profile banner (YouTube/X style). Null → default look. Column is cheap; the **upload** is [design].                                                                                                                                                      |
| `favorites Json?`                | [schema]        | Up to 4–5 favorite picks (movie or show) shown on profile. The **column** is cheap; the **picker + content source** is [design].                                                                                                                                                 |
| `avatar String?`                 | exists          | Already in schema. The **upload** is [design].                                                                                                                                                                                                                                   |

> All of the above except **points** and **tier** start empty and are user-fillable. Most can ride
> along when we touch **Phase 5 (Profile)** — add the columns in one migration, wire UI incrementally.

### Display-only — defer to a polish pass

- **[ui]** "Joined on [date]" — derive from existing `createdAt` (no schema change).
- **[ui]** Show linked Rezflix username (depends on storing `jellyfinUsername` above).
- **[ui]** Tier badge + points display on profile.
- **[ui]** Followers / Following boxes + counts (depends on the follow subsystem below).

### Needs a decision or infra first — [design]

- **Image upload storage (avatar + banner).** Not in the current stack. Decide the target:
  local volume on the VPS vs object storage (Cloudflare R2 / S3). Affects `ARCHITECTURE.md`,
  plus validation (size/type), and probably image processing (resize/crop). Blocks avatar + banner upload UI.
- **Public profile pages + privacy boundary.** Bio / socials / favorites / tier are "shown publicly
  when someone checks their profile" — that implies a **new route** (e.g. `/u/[username]`) and a
  public-vs-private split. The current PRD only covers the owner viewing their _own_ profile, so this
  is a **scope expansion** (a social layer). Decide what's public before building.
- **Follow system.** New `Follow` model (self-relation on `User`: `followerId` + `followingId`,
  unique pair, `createdAt`) + follow/unfollow server actions + follower/following counts & lists.
  Additive at the schema level, but a real feature; depends on public profiles existing.
- **Points earning + Tier derivation.** Columns are trivial; the _logic_ (what grants points;
  thresholds → tier) is a subsystem and partly depends on **watch-side data** (Jellyfin / Tracearr) →
  largely **v2**. Add the columns now, defer the engine.
- **Favorites content source.** Picking a movie/show needs a searchable catalog + metadata (poster,
  title, id). Decide the source: TMDB API vs the Jellyfin library itself.

---

## Open decisions (resolve before the matching item is built)

1. **Upload storage** — local VPS volume vs object storage (R2/S3)?
2. **Public profiles** — build `/u/[username]` public pages? What's public vs private?
3. **Birthday** — hard-required (`NOT NULL`, needs backfill) vs required-going-forward (nullable
   column + enforced in the signup Zod schema)? _(Recommended: nullable column + Zod requirement —
   no real users yet, avoids migration pain, still enforced for new sign-ups.)_
4. **Socials** — store usernames (we render the URL) vs store full URLs?
5. **Tier** — derived from points (thresholds) vs manually assigned?
6. **Favorites** — content source: TMDB vs Jellyfin library?
