'use client'

import { motion } from 'framer-motion'

interface DocumentOverlayProps {
  /** Number of quality checks currently passing (0 – total). */
  quality: number
  /** Total number of quality checks. */
  total: number
}

/**
 * Rectangular capture overlay with corner brackets.
 *
 * Three-state colour coding (design system REQ-01):
 *   0 checks  → neutral white
 *   1–(n-1)   → amber  --warning
 *   all pass  → green  --success
 */
export function DocumentOverlay({ quality, total }: DocumentOverlayProps) {
  const allGood = quality >= total
  const anyGood = quality > 0

  const color = allGood
    ? 'var(--success)'
    : anyGood
      ? 'var(--warning)'
      : 'rgba(255,255,255,0.55)'

  const borderColor = allGood
    ? 'var(--success)'
    : anyGood
      ? 'var(--warning)'
      : 'rgba(255,255,255,0.22)'

  const CORNER = 22
  const STROKE = 3

  const corners = [
    { top: -2, left:  -2, rotate: '0deg'   },
    { top: -2, right: -2, rotate: '90deg'  },
    { bottom: -2, right: -2, rotate: '180deg' },
    { bottom: -2, left:  -2, rotate: '270deg' },
  ] as const

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '88%',
          maxWidth: 340,
          aspectRatio: '1.586 / 1',
        }}
      >
        {/* Dashed inner border */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 8,
            border: `1.5px dashed ${borderColor}`,
            transition: 'border-color 400ms ease',
          }}
        />

        {/* Corner bracket SVGs */}
        {corners.map((pos, i) => (
          <svg
            key={i}
            width={CORNER}
            height={CORNER}
            viewBox="0 0 22 22"
            style={{
              position: 'absolute',
              ...pos,
              transition: 'all 400ms ease',
            }}
            aria-hidden="true"
          >
            <path
              d="M2 10 L2 2 L10 2"
              fill="none"
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              style={{ transform: `rotate(${pos.rotate})`, transformOrigin: 'center' }}
            />
          </svg>
        ))}

        {/* Ready flash pulse */}
        {allGood && (
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 8,
              background: 'var(--success)',
              opacity: 0,
              pointerEvents: 'none',
            }}
            animate={{ opacity: [0, 0.14, 0] }}
            transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 1.6 }}
          />
        )}
      </div>
    </div>
  )
}
