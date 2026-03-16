'use client'

import { motion } from 'framer-motion'

interface AnimatedCheckProps {
  size?: number
  color?: string
}

/**
 * SVG checkmark with sequenced animation: circle traces in first, then tick.
 * Used on the Success screen.
 */
export function AnimatedCheck({ size = 96, color = 'var(--success)' }: AnimatedCheckProps) {
  const r = size / 2
  const strokeWidth = size / 16

  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        aria-hidden="true"
      >
        {/* Outer ring */}
        <motion.circle
          cx={r}
          cy={r}
          r={r - strokeWidth}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.05 }}
        />
        {/* Tick */}
        <motion.polyline
          points={`${r * 0.38},${r} ${r * 0.68},${r * 1.3} ${r * 1.42},${r * 0.58}`}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.30, ease: 'easeOut', delay: 0.38 }}
        />
      </svg>
    </motion.div>
  )
}
