import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

// Centers page content to the app-shell rhythm (max width + matching gutters) so the
// header, footer, and page bodies all line up. Utilities/tokens only — no fixed pixels.
export function PageContainer({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6", className)} {...props} />
}
