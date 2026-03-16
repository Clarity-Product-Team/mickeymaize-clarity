'use client'

import { motion } from 'framer-motion'

interface AnimatedCheckProps {
  size?: number
  color?: string
}

/**
 * Sequenced checkmark animation:
 *   1. Container springs in (scale 0.5 → 1)
 *   2. Soft glow disc scales up behind the ring
 *   3. Circle ring traces in
 *   4. Tick draws
 *   5. Ripple ring expands outward and fades
 */
export function AnimatedCheck({ size = 96, color = 'var(--success)' }: AnimatedCheckProps) {
  const r = size / 2
  const strokeWidth = size / 14

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 150, damping: 18, delay: 0.04 }}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      {/* Soft ambient glow — scales in behind the ring */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.12 }}
        style={{
          position: 'absolute',
          width: size * 0.9,
          height: size * 0.9,
          borderRadius: '50%',
          background: color,
          opacity: 0.1,
          pointerEvents: 'none',
        }}
      />

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
          transition={{ duration: 0.40, ease: 'easeOut', delay: 0.10 }}
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
          transition={{ duration: 0.26, ease: 'easeOut', delay: 0.40 }}
        />
      </svg>

      {/* Ripple ring — expands outward after the tick completes */}
      <motion.div
        initial={{ scale: 0.75, opacity: 0.28 }}
        animate={{ scale: 1.65, opacity: 0 }}
        transition={{ duration: 0.65, ease: 'easeOut', delay: 0.62 }}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  )
}
