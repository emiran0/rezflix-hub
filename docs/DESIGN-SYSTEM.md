# DESIGN SYSTEM — REZFLIX Hub

> The visual contract. The aim: **clean, modern, dark-only** — not a "cinematic streaming"
> look. Consistency is enforced through tokens; components must consume tokens, never
> hardcode colors. Values below are sensible defaults that can be refined — but the
> *principles* (dark-only, token-driven, mobile parity) are fixed.

## 1. Principles
- **Dark mode only.** No light theme, no toggle. Don't ship light tokens.
- **Clean & modern**, not flashy: generous spacing, strong type hierarchy, restrained color,
  one clear accent. Think calm product UI, not a movie poster.
- **Token-driven & global.** Every color/space/radius/motion value is a token in
  `globals.css`. Components reference tokens (`bg-background`, `text-foreground`, …). A
  component with a raw hex value is a bug.
- **Mobile parity is non-negotiable.** Same features, same quality, on phones.
- **Motion is seasoning.** Subtle, purposeful, always reduced-motion aware.

## 2. Color tokens (dark, OKLCH)
Use shadcn/ui semantic tokens (Radix base, `radix-nova` preset), defined once in the `:root`
block of `globals.css` (we're dark-only, so the dark palette lives in `:root`; `<html>` also
carries `class="dark"` so shadcn `dark:` variants resolve) and mapped via Tailwind v4
`@theme inline`.
Indicative palette — tune for the REZFLIX feel, keep contrast AA+:

```css
:root {
  /* surfaces */
  --background:        oklch(0.16 0.005 270);  /* near-black, slightly cool */
  --card:              oklch(0.205 0.006 270);
  --popover:           oklch(0.205 0.006 270);
  --muted:             oklch(0.26 0.006 270);
  /* text */
  --foreground:        oklch(0.95 0.005 270);
  --muted-foreground:  oklch(0.72 0.01 270);
  /* accent — pick ONE brand accent and stay disciplined */
  --primary:           oklch(0.70 0.16 25);    /* example: warm red-orange; adjust to brand */
  --primary-foreground:oklch(0.16 0.005 270);
  --accent:            oklch(0.26 0.006 270);
  --accent-foreground: oklch(0.95 0.005 270);
  /* feedback */
  --destructive:       oklch(0.70 0.19 22);
  --ring:              oklch(0.55 0.02 270);
  /* lines */
  --border:            oklch(1 0 0 / 10%);     /* translucent white hairlines */
  --input:             oklch(1 0 0 / 15%);
  --radius:            0.625rem;
}
```
Map each to Tailwind utilities with `@theme inline` so `bg-background`, `text-foreground`,
`border-border`, etc. exist. (See shadcn Tailwind v4 docs.)

## 3. Typography
- One sans for UI (e.g. Inter / Geist) loaded via `next/font` (self-hosted, no layout shift).
- Type scale (rough): display 2.25–3rem, h1 1.875rem, h2 1.5rem, h3 1.25rem, body 1rem,
  small 0.875rem. Comfortable line-height (1.5 body), tight on headings.
- Limit to ~2 weights. Don't mix more than one display + one body family.

## 4. Spacing, radius, layout
- Spacing scale: Tailwind defaults (4px base). Be consistent; prefer fewer, larger gaps.
- Radius from `--radius`; cards/inputs/buttons share the family.
- Content max-width ~1100–1200px, centered, with comfortable gutters.
- Use a small set of surface elevations (background → card → popover), not many.

## 5. Components
- Build on shadcn/ui primitives (Button, Input, Card, Dialog, Dropdown, Form, Sonner toast).
- Compose, don't restyle ad-hoc. New variants go through the token system.
- Forms (login, signup, questionnaire, profile) use shadcn Form + Zod resolver; inline,
  specific error messages; visible focus states; disabled/loading states on submit.

## 6. Motion (Motion / Framer)
- Use for: button press/hover feedback, entry of cards/list items (subtle fade+rise),
  dialog/sheet transitions, and page/route transitions (pair with Next View Transitions).
- Keep it short (≈150–250ms) and eased; no bouncing, no long or attention-grabbing motion.
- **Always** wrap/guard with `prefers-reduced-motion`: if reduced, drop to instant/none.
- Animate transform/opacity (cheap), not layout properties.

## 7. Responsive / mobile
- **Mobile-first.** Design the small layout first, enhance up.
- Breakpoints: Tailwind defaults (`sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280).
- Navigation: a clean top bar that collapses to a sheet/drawer on mobile; thumb-reachable.
- Touch targets ≥ 44px; quick-launch links are comfortably tappable as a responsive grid
  (1 col mobile → 2–3 desktop).
- No horizontal scroll; test forms and the profile page at 360–390px widths.
- Playwright e2e includes at least one mobile viewport pass for the core flows.

## 8. Accessibility
- AA contrast minimum on text and interactive elements.
- Full keyboard nav; visible focus ring (`--ring`); correct labels/aria on forms.
- Respect reduced-motion (see §6). Don't convey state by color alone.

## 9. Theme consistency rule
Whenever a new page is added (profile now; docs/FAQ/blog/leaderboards later), it inherits
these tokens and components automatically. No page introduces its own palette, font, or
one-off colors. If something can't be expressed with the tokens, add a token — don't bypass
the system.
