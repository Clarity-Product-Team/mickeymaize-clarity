'use client'

import { motion } from 'framer-motion'

interface ProgressBarProps {
  /** 0.0 – 1.0 */
  value: number
}

export function ProgressBar({ value }: ProgressBarProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Verification progress"
      style={{
        height: 4,
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
        background: 'var(--border-1)',
      }}
    >
      <motion.div
        style={{
          height: '100%',
          borderRadius: 'var(--radius-full)',
          background: 'var(--accent)',
          transformOrigin: 'left',
        }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  )
}
