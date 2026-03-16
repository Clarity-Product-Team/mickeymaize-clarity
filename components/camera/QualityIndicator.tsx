'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader } from 'lucide-react'
import type { QualityCheck } from '@/lib/types'

interface QualityIndicatorProps {
  checks: QualityCheck[]
}

/**
 * Real-time quality chips displayed inside the camera viewport.
 *
 * Design rules:
 * - Idle: neutral white-tinted chip, Loader icon — the camera is still reading,
 *   not failing. Never show red/danger for "not yet passing."
 * - Passing: success teal tint + check icon.
 * - Icon swaps use spring animation; background uses ease transition.
 */
export function QualityIndicator({ checks }: QualityIndicatorProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'center',
      }}
    >
      {checks.map(({ label, ok }) => (
        <motion.div
          key={label}
          layout
          animate={{
            background: ok ? 'rgba(0,179,125,0.22)' : 'rgba(255,255,255,0.10)',
          }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 11px',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            fontWeight: 500,
            color: ok ? '#5EDEC0' : 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            whiteSpace: 'nowrap',
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {ok ? (
              <motion.span
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <Check size={11} strokeWidth={2.5} />
              </motion.span>
            ) : (
              <motion.span
                key="idle"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.6 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <Loader size={11} strokeWidth={2} />
              </motion.span>
            )}
          </AnimatePresence>
          {label}
        </motion.div>
      ))}
    </div>
  )
}
