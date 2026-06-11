import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

// A vertical-rhythm band of page content. Pair with <PageContainer> for horizontal bounds.
// Mobile-first spacing that opens up at sm+.
export function Section({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("py-8 sm:py-12", className)} {...props} />
}
