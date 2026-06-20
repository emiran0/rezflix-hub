export type NavLink = { label: string; href: string };

// Shell navigation links shown to everyone. The signed-in/out distinction (Sign in
// vs. username + Log out) is handled in the header/mobile-nav from the session; these
// per-role link sets (member/applicant/admin) get refined as their routes land.
export const mainNavLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Apply", href: "/apply" },
];

// Admin-only links, rendered (in the header + mobile nav) only when the session role is
// `admin`. The route itself is still guarded server-side via requireAdmin.
export const adminNavLinks: NavLink[] = [
  { label: "Review", href: "/admin/applications" },
];
