'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader } from 'lucide-react'
import { PROCESSING_STEPS } from '@/lib/constants'
import type { ProcessingScreenProps } from '@/lib/types'

type StepState = 'pending' | 'active' | 'done'

function StepRow({
  label,
  state,
  index,
}: {
  label: string
  state: StepState
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.06 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '13px 16px',
        borderRadius: 'var(--radius-lg)',
        background: state === 'active'
          ? 'var(--accent-muted)'
          : state === 'done'
            ? 'var(--success-muted)'
            : 'var(--surface-0)',
        border: `1px solid ${
          state === 'active'
            ? 'var(--accent)'
            : state === 'done'
              ? 'var(--success)'
              : 'var(--border-1)'
        }`,
        transition: 'background 300ms ease, border-color 300ms ease',
      }}
    >
      {/* State icon */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background:
            state === 'done'
              ? 'var(--success)'
              : state === 'active'
                ? 'var(--accent)'
                : 'var(--border-1)',
          transition: 'background 300ms ease',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {state === 'done' ? (
            <motion.span
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l2.5 2.5L10 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.span>
          ) : state === 'active' ? (
            <motion.span
              key="spin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}
              >
                <Loader size={12} color="#fff" />
              </motion.div>
            </motion.span>
          ) : (
            <motion.span key="pending" initial={{ opacity: 0.4 }} animate={{ opacity: 0.4 }}>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <circle cx="4" cy="4" r="3" fill="#fff" />
              </svg>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Label */}
      <p
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 500,
          color:
            state === 'done'
              ? 'var(--success)'
              : state === 'active'
                ? 'var(--accent)'
                : 'var(--ink-3)',
          transition: 'color 300ms ease',
        }}
      >
        {label}
      </p>
    </motion.div>
  )
}

export function ProcessingScreen({ onComplete }: ProcessingScreenProps) {
  const [completedCount, setCompletedCount] = useState(0)
  const completedRef = useRef(0)

  useEffect(() => {
    let elapsed = 0
    const timers = PROCESSING_STEPS.map(({ durationMs }, i) => {
      elapsed += durationMs
      return setTimeout(() => {
        completedRef.current = i + 1
        setCompletedCount(i + 1)
        if (i === PROCESSING_STEPS.length - 1) {
          setTimeout(onComplete, 500)
        }
      }, elapsed)
    })
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  function getState(index: number): StepState {
    if (index < completedCount) return 'done'
    if (index === completedCount) return 'active'
    return 'pending'
  }

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '8px 24px 0' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          style={{ textAlign: 'center' }}
        >
          <h1 className="t-h2" style={{ color: 'var(--ink-1)', margin: '0 0 8px' }}>
            Verifying your identity
          </h1>
          <p className="t-sm" style={{ color: 'var(--ink-2)', margin: 0 }}>
            This takes just a few seconds — please don&apos;t close the page.
          </p>
        </motion.div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PROCESSING_STEPS.map(({ id, label }, i) => (
            <StepRow key={id} label={label} state={getState(i)} index={i} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
