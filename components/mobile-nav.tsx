"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { mainNavLinks } from "@/components/nav-config"

// The mobile side of the responsive nav: a hamburger that opens a Sheet.
// Hidden at md+ where the inline desktop nav takes over. Closing on navigation
// is handled by SheetClose wrapping each link.
export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {/* size-11 == 44px: meets the touch-target minimum (DESIGN-SYSTEM §7). */}
        <Button variant="ghost" size="icon" aria-label="Open menu" className="size-11 md:hidden">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-2" aria-label="Mobile">
          {mainNavLinks.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="rounded-md px-3 py-3 text-base hover:bg-accent hover:text-accent-foreground"
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}
          <SheetClose asChild>
            <Button asChild className="mt-3 h-11">
              <Link href="/login">Sign in</Link>
            </Button>
          </SheetClose>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
