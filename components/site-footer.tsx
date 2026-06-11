import Link from "next/link"

import { mainNavLinks } from "@/components/nav-config"

// App shell footer. Stacks on mobile, spreads on sm+. Tokens only.
export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {year} REZFLIX Hub</p>
        {/* -my-2 keeps the footer compact while min-h-11 gives 44px tap targets (§7). */}
        <nav className="-my-2 flex gap-2 sm:gap-4" aria-label="Footer">
          {[...mainNavLinks, { label: "Sign in", href: "/login" }].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 items-center px-2 transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
