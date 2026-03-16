'use client'

import { motion } from 'framer-motion'

interface SpinnerProps {
  size?: number
  color?: string
  className?: string
}

/**
 * Inline SVG spinner — avoids Lucide dependency for loading state.
 * Renders a partial ring that rotates continuously.
 */
export function Spinner({ size = 18, color = 'currentColor', className }: SpinnerProps) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.75, ease: 'linear', repeat: Infinity }}
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke={color}
        strokeWidth="2.5"
        strokeOpacity="0.20"
      />
      <path
        d="M12 3a9 9 0 0 1 9 9"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </motion.svg>
  )
}
