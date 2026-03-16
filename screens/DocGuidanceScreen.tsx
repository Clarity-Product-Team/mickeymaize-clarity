'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SunMedium, BookOpen, Maximize2, ArrowRight, Camera, CheckCircle } from 'lucide-react'
import { Button } from '@/components/primitives/Button'
import { docGuidance, DOC_LABEL_LOWER } from '@/lib/content'
import type { DocType } from '@/lib/types'

const CHECK_STYLES = [
  { icon: SunMedium, color: '#E8A020', bg: 'var(--warning-muted)' },
  { icon: BookOpen,  color: 'var(--accent)', bg: 'var(--accent-muted)' },
  { icon: Maximize2, color: 'var(--success)', bg: 'var(--success-muted)' },
]

export function DocGuidanceScreen({ docType, onContinue }: { docType: DocType; onContinue: () => void }) {
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const allChecked = checked.size === docGuidance.checks.length
  const label = DOC_LABEL_LOWER[docType] ?? 'document'

  // Auto-check items with natural stagger — gives the user time to read each before it resolves
  useEffect(() => {
    const delays = [900, 1800, 2800]
    const timers = docGuidance.checks.map((_, i) =>
      setTimeout(() => setChecked(prev => new Set([...prev, i])), delays[i] ?? 900 + i * 700)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Scrollable content */}
      <div className="screen-scroll" style={{ padding: '8px 24px 0' }}>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--ink-1)', margin: '0 0 4px' }}>
            {docGuidance.heading}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 18px' }}>
            {docGuidance.subheading}
          </p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {docGuidance.checks.map(({ title, body }, i) => {
            const { icon: Icon, color, bg } = CHECK_STYLES[i]
            const isChecked = checked.has(i)
            return (
              <motion.button
                key={title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06 }}
                onClick={() => setChecked(prev => new Set([...prev, i]))}
                aria-pressed={isChecked}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  minHeight: 60,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-lg)',
                  background: isChecked ? bg : 'var(--surface-0)',
                  border: `1.5px solid ${isChecked ? color : 'var(--border-1)'}`,
                  cursor: 'pointer', textAlign: 'left',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'all 250ms ease',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)', flexShrink: 0,
                  background: isChecked ? color : 'var(--surface-1)',
                  border: `1px solid ${isChecked ? 'transparent' : 'var(--border-1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 250ms ease',
                }}>
                  <AnimatePresence mode="wait" initial={false}>
                    {isChecked ? (
                      <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 340, damping: 20 }}>
                        <CheckCircle size={18} color="#fff" />
                      </motion.div>
                    ) : (
                      <motion.div key="icon" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <Icon size={18} style={{ color }} strokeWidth={1.8} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: isChecked ? 'var(--ink-1)' : 'var(--ink-2)' }}>{title}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>{body}</p>
                </div>
              </motion.button>
            )
          })}
        </div>

      </div>

      {/* Sticky footer: camera notice + CTA */}
      <div className="screen-footer" style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border-1)' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 12px', borderRadius: 'var(--radius-md)',
            background: 'var(--accent-muted)', borderLeft: '3px solid var(--accent)',
          }}
        >
          <Camera size={13} style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }} strokeWidth={2} aria-hidden="true" />
          <p style={{ margin: 0, fontSize: 11.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--ink-1)', fontWeight: 600 }}>{docGuidance.cameraNote.bold}</strong>{' '}
            {docGuidance.cameraNote.body}
          </p>
        </motion.div>

        <Button onClick={onContinue} icon={<ArrowRight size={15} />}>
          {allChecked ? docGuidance.ctaDynamic(label) : docGuidance.ctaDefault}
        </Button>
      </div>
    </div>
  )
}
