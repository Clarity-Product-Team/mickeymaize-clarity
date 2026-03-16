'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock } from 'lucide-react'
import { processing } from '@/lib/content'

const PROCESSING_STEPS = processing.steps

type State = 'pending' | 'active' | 'done'

function Step({ label, state, index }: { label: string; state: State; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px', borderRadius: 'var(--radius-lg)',
        background: state === 'done' ? 'var(--success-muted)' : state === 'active' ? 'var(--accent-muted)' : 'var(--surface-0)',
        border: `1px solid ${state === 'done' ? 'var(--success)' : state === 'active' ? 'var(--accent)' : 'var(--border-1)'}`,
        transition: 'background 400ms ease, border-color 400ms ease',
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: state === 'done' ? 'var(--success)' : state === 'active' ? 'var(--accent)' : 'var(--border-1)',
        transition: 'background 400ms ease',
      }}>
        <AnimatePresence mode="wait" initial={false}>
          {state === 'done' ? (
            <motion.span key="ck" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 340, damping: 22 }}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </motion.span>
          ) : state === 'active' ? (
            <motion.span key="sp" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.svg width="14" height="14" viewBox="0 0 24 24" fill="none" animate={{ rotate: 360 }} transition={{ duration: 0.8, ease: 'linear', repeat: Infinity }}>
                <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"/>
                <path d="M12 3a9 9 0 0 1 9 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
              </motion.svg>
            </motion.span>
          ) : (
            <motion.span key="dot" initial={{ opacity: 0.35 }} animate={{ opacity: 0.35 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <p style={{
        margin: 0, fontSize: 14, fontWeight: 500,
        color: state === 'done' ? 'var(--success)' : state === 'active' ? 'var(--accent)' : 'var(--ink-3)',
        transition: 'color 400ms ease',
      }}>
        {label}
      </p>
      {state === 'active' && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.45, 1] }}
          transition={{ duration: 1.4, times: [0, 0.15, 0.6, 1], repeat: Infinity, repeatDelay: 0.1 }}
          style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.2px' }}
        >
          {processing.activeLabel}
        </motion.span>
      )}
    </motion.div>
  )
}

export function ProcessingScreen({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let elapsed = 0
    const timers = PROCESSING_STEPS.map(({ durationMs }, i) => {
      elapsed += durationMs
      return setTimeout(() => {
        setCount(i + 1)
        if (i === PROCESSING_STEPS.length - 1) setTimeout(onComplete, 600)
      }, elapsed)
    })
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  const getState = (i: number): State => i < count ? 'done' : i === count ? 'active' : 'pending'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '8px 24px', paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>

        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.06, type: 'spring', stiffness: 140, damping: 22 }}
          style={{ textAlign: 'center' }}
        >
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--ink-1)', margin: '0 0 8px' }}>
            {processing.heading}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0 }}>
            {processing.subheading}
          </p>
        </motion.div>

        {/* role="status" + aria-live announces step completions without interrupting */}
        <div role="status" aria-live="polite" aria-atomic="false" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PROCESSING_STEPS.map(({ id, label }, i) => (
            <Step key={id} label={label} state={getState(i)} index={i} />
          ))}
        </div>

        {/* Trust note at bottom */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
        >
          <Lock size={11} style={{ color: 'var(--ink-3)', flexShrink: 0 }} strokeWidth={2} />
          <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, textAlign: 'center' }}>
            {processing.trustNote}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
