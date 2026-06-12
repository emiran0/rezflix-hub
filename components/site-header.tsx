import Link from "next/link";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import { PageContainer } from "@/components/page-container";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { mainNavLinks } from "@/components/nav-config";

// App shell top bar. Server component — it reads the session server-side and the only
// client island is <MobileNav>. Sticky, translucent over the dark background, with a
// hairline bottom border.
export async function SiteHeader() {
  const session = await auth();
  const user = session?.user ?? null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <PageContainer className="flex h-16 items-center justify-between">
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
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link href="/profile">Profile</Link>
              </Button>
              <span className="text-muted-foreground ml-2 text-sm">
                {user.username}
              </span>
              <SignOutButton />
            </>
          ) : (
            <Button asChild className="ml-2">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>

        {/* The server-rendered logout control is handed to the client island as a slot. */}
        <MobileNav
          user={user}
          signOutSlot={<SignOutButton className="h-11 w-full justify-start" />}
        />
      </PageContainer>
    </header>
  );
}
