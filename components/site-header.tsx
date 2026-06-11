import Link from "next/link"

import { Button } from "@/components/ui/button"
import { MobileNav } from "@/components/mobile-nav"
import { mainNavLinks } from "@/components/nav-config"

// App shell top bar. Server component — the only client island is <MobileNav>.
// Sticky, translucent over the dark background, with a hairline bottom border.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          REZFLIX <span className="text-primary">Hub</span>
        </Link>

        {/* Desktop nav (md+). Collapses into <MobileNav> below md. */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {mainNavLinks.map((link) => (
            <Button key={link.href} variant="ghost" asChild>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          <Button asChild className="ml-2">
            <Link href="/login">Sign in</Link>
          </Button>
        </nav>

        <MobileNav />
      </div>
    </header>
  )
}
