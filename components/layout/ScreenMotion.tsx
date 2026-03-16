'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ScreenMotionProps {
  children: ReactNode
  direction?: 1 | -1
  /** Camera screens use fade-only — no vertical movement */
  mode?: 'default' | 'camera'
}

// ── Default (content) screens ─────────────────────────────────────────────────
// Per-variant transitions: crisp ease-out-quint entrance, snappier ease-in exit.
// A hairline scale (0.988) adds depth without distraction.

const defaultVariants = {
  initial: (dir: number) => ({
    opacity: 0,
    y: dir > 0 ? 26 : -20,
    scale: 0.988,
  }),
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
  exit: (dir: number) => ({
    opacity: 0,
    y: dir > 0 ? -18 : 26,
    scale: 0.988,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1] as [number, number, number, number],
    },
  }),
}

// ── Camera screens ─────────────────────────────────────────────────────────────
// Pure cross-fade: vertical movement is distracting when a camera viewport fills the screen.

const cameraVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22 } },
  exit:    { opacity: 0, transition: { duration: 0.16 } },
}

/**
 * Direction-aware screen transition wrapper.
 * Wrap every screen's root element with this instead of a raw motion.div.
 * The `direction` prop controls whether content slides up (forward) or down (back).
 */
export function ScreenMotion({ children, direction = 1, mode = 'default' }: ScreenMotionProps) {
  const isCamera = mode === 'camera'

  return (
    <motion.div
      custom={direction}
      variants={isCamera ? cameraVariants : defaultVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}
    >
      {children}
    </motion.div>
  )
}
