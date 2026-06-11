"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { motion, useReducedMotion } from "motion/react"

// Route-change transition for the content area. Keyed by pathname so each navigation
// re-mounts and plays a short enter (fade + small rise). Header/footer live outside
// this wrapper and stay static.
//
// Note: we use Motion here rather than the View Transitions API — it's reliable in the
// App Router today and matches our reduced-motion strategy; revisit View Transitions later.
// Reduced motion -> render content directly (same layout classes, no animation).
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduce = useReducedMotion()

  if (reduce) {
    return <div className="flex flex-1 flex-col">{children}</div>
  }

  return (
    <motion.div
      key={pathname}
      className="flex flex-1 flex-col"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
