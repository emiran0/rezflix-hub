export type NavLink = { label: string; href: string }

// Guest-facing shell navigation. Auth-aware variants (member/applicant/admin)
// are layered on in task 2.3; the routes below are built in later phases.
export const mainNavLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Apply", href: "/apply" },
]
