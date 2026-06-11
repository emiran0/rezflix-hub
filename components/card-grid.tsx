import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

// Responsive card grid: 1 column on mobile, 2 at sm, 3 at lg — the cadence the
// quick-launch links (task 6.2) and other card lists use. Override via className.
export function CardGrid({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}
      {...props}
    />
  )
}
