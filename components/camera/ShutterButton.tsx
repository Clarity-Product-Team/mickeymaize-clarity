'use client'

import { motion, AnimatePresence } from 'framer-motion'

const SIZE = 72
const INNER = 50
const RADIUS = 30
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface ShutterButtonProps {
  /** True when all quality checks pass */
  allClear: boolean
  /** 0–1: drives the progress ring stroke; fires onCapture when it reaches 1 */
  progress: number
  onCapture: () => void
  /** True while the ring is being suppressed (e.g. during upload or review) */
  disabled?: boolean
}

/**
 * Circular shutter button with an SVG progress ring.
 *
 * States:
 *   - idle: grey ring track only, dimmed camera icon
 *   - allClear: green ring fills clockwise; inner circle pulses; auto-fires at 100%
 *   - disabled: fully dimmed, not interactive
 */
export function ShutterButton({ allClear, progress, onCapture, disabled = false }: ShutterButtonProps) {
  const dashOffset = CIRCUMFERENCE * (1 - progress)
  const canTap = (allClear || !disabled) && !disabled

  return (
    <motion.button
      onClick={canTap ? onCapture : undefined}
      whileTap={canTap ? { scale: 0.88 } : {}}
      aria-label="Capture document"
      style={{
        position: 'relative',
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: canTap ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        WebkitTapHighlightColor: 'transparent',
        flexShrink: 0,
      }}
    >
      {/* SVG ring */}
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={allClear ? 'rgba(0,179,125,0.22)' : 'rgba(255,255,255,0.14)'}
          strokeWidth="3"
        />
        {/* Progress arc */}
        <AnimatePresence>
          {allClear && (
            <motion.circle
              key="arc"
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--success)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              initial={{ strokeDashoffset: CIRCUMFERENCE }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0, ease: 'linear' }}
            />
          )}
        </AnimatePresence>
      </svg>

      {/* Inner circle */}
      <motion.div
        animate={{
          background: disabled
            ? 'rgba(255,255,255,0.18)'
            : allClear
              ? 'var(--success)'
              : 'rgba(255,255,255,0.42)',
          scale: allClear && !disabled ? [1, 1.05, 1] : 1,
        }}
        transition={{
          background: { duration: 0.45, ease: 'easeInOut' },
          scale: allClear ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : {},
        }}
        style={{
          width: INNER,
          height: INNER,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Camera icon */}
        <svg
          width={22} height={22}
          viewBox="0 0 24 24"
          fill="none"
          stroke={disabled ? 'rgba(255,255,255,0.35)' : allClear ? '#fff' : 'rgba(255,255,255,0.82)'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </motion.div>
    </motion.button>
  )
}
