'use client'

import { motion } from 'framer-motion'
import { ArrowRight, ScanLine, SmilePlus, BadgeCheck, Lock, Shield, Clock, RotateCcw } from 'lucide-react'
import { Button } from '@/components/primitives/Button'
import { welcome } from '@/lib/content'
import type { WelcomeMode } from '@/lib/types'

const STEP_ICONS = [ScanLine, SmilePlus, BadgeCheck]
const TRUST_ICONS = [Lock, Shield]

// ── Context notice — shown in resume / restart modes instead of the step list ──

function ContextNotice({ mode }: { mode: 'resume' | 'restart' }) {
  const isRestart = mode === 'restart'
  const modeContent = welcome.modes[mode]
  const Icon = isRestart ? RotateCcw : Clock
  const color = isRestart ? 'var(--warning)' : 'var(--accent)'
  const bg = isRestart ? 'var(--warning-muted)' : 'var(--accent-muted)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        padding: '16px',
        borderRadius: 'var(--radius-lg)',
        background: bg,
        border: `1px solid ${color}`,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--radius-md)', flexShrink: 0,
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color="#fff" strokeWidth={2} />
      </div>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55 }}>
        {modeContent.notice}
      </p>
    </motion.div>
  )
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export function WelcomeScreen({ onStart, mode = 'fresh' }: { onStart: () => void; mode?: WelcomeMode }) {
  const isFresh = mode === 'fresh'
  const modeContent = isFresh ? null : welcome.modes[mode]

  const badge = modeContent?.badge ?? welcome.badge
  const subheading = modeContent?.subheading ?? welcome.subheading
  const cta = modeContent?.cta ?? welcome.cta

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Scrollable content — justifyContent:center floats it nicely on tall screens */}
      <div
        className="screen-scroll"
        style={{ padding: '12px 24px 4px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 4.5vh, 36px)' }}>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 9999,
              background: 'var(--accent-muted)', marginBottom: 14,
            }}>
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.45, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }}
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.3px' }}>
                {badge.toUpperCase()}
              </span>
            </div>
            <h1 style={{
              fontSize: 'clamp(28px, 7vw, 32px)', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2,
              color: 'var(--ink-1)', margin: '0 0 10px',
            }}>
              {isFresh ? <>Verify your<br />identity</> : modeContent!.heading.split('\n').reduce<React.ReactNode[]>(
                (acc, line, i) => i === 0 ? [line] : [...acc, <br key={i} />, line], []
              )}
            </h1>
            <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: 0, lineHeight: 1.55 }}>
              {subheading}
            </p>
          </motion.div>

          {/* Step preview (fresh) or contextual notice (resume / restart) */}
          {isFresh ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {welcome.steps.map(({ label, hint }, i) => {
                const Icon = STEP_ICONS[i]
                return (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ y: -1, boxShadow: 'var(--shadow-sm)' }}
                    transition={{ delay: 0.18 + i * 0.07, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--surface-0)',
                      border: '1px solid var(--border-1)',
                      cursor: 'default',
                    }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 'var(--radius-md)',
                      background: 'var(--accent-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={19} style={{ color: 'var(--accent)' }} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink-1)' }}>{label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>{hint}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <ContextNotice mode={mode} />
          )}

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.48 }}
            style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}
          >
            {welcome.trust.map((label, i) => {
              const Icon = TRUST_ICONS[i]
              return (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 500, color: 'var(--ink-3)',
                }}>
                  <Icon size={11} style={{ color: 'var(--accent)', opacity: 0.7 }} strokeWidth={2} />
                  {label}
                </div>
              )
            })}
          </motion.div>

        </div>
      </div>

      {/* Sticky CTA footer — safe-area aware */}
      <motion.div
        className="screen-footer"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.35 }}
      >
        <Button onClick={onStart} icon={<ArrowRight size={16} />}>
          {cta}
        </Button>
        <p style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', margin: '10px 0 0', lineHeight: 1.5 }}>
          {welcome.privacyNote}
        </p>
      </motion.div>
    </div>
  )
}
