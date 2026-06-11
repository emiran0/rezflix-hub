"use client"

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react"

type FadeInProps = HTMLMotionProps<"div"> & {
  /** Stagger helper for lists — seconds before this item animates in. */
  delay?: number
}

// Reusable entrance: a subtle fade + small rise (transform/opacity only — cheap).
// When the user prefers reduced motion we render the final state immediately
// (`initial={false}`, no animation), per DESIGN-SYSTEM §6.
export function FadeIn({ delay = 0, children, ...props }: FadeInProps) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      {...props}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={reduce ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  )
}
