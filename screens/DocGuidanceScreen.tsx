'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SunMedium, BookOpen, Maximize2, FlipHorizontal, Camera, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/primitives/Button'
import { docGuidance, DOC_LABEL_LOWER } from '@/lib/content'
import type { DocType } from '@/lib/types'

// ── Item type definitions ─────────────────────────────────────────────────────
//
// Items are keyed, not positional. This lets the screen build a variable-length
// list from context without relying on array indices for icon / colour assignment.
// Adding a new item type only requires an entry here and in checkItems (content.ts).

type CheckItemId = keyof typeof docGuidance.checkItems

const ITEM_STYLES: Record<CheckItemId, {
  icon: typeof SunMedium
  color: string
  bg: string
}> = {
  lighting:         { icon: SunMedium,      color: '#E8A020',       bg: 'var(--warning-muted)' },
  removeFromWallet: { icon: BookOpen,       color: 'var(--accent)', bg: 'var(--accent-muted)'  },
  bothSides:        { icon: FlipHorizontal, color: 'var(--accent)', bg: 'var(--accent-muted)'  },
  cornersVisible:   { icon: Maximize2,      color: 'var(--success)',bg: 'var(--success-muted)' },
  cameraAccess:     { icon: Camera,         color: 'var(--ink-2)',  bg: 'var(--surface-1)'     },
}

// ── Item list builder ─────────────────────────────────────────────────────────
//
// Returns the ordered list of items for the current doc context.
// Production path: the session config API would return a pre-resolved list;
// this function is the local equivalent until that layer exists.

function buildItems(requiresBackCapture: boolean): CheckItemId[] {
  return [
    'lighting',
    'removeFromWallet',
    ...(requiresBackCapture ? (['bothSides'] as CheckItemId[]) : []),
    'cornersVisible',
    'cameraAccess',
  ]
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function DocGuidanceScreen({
  docType,
  requiresBackCapture,
  onContinue,
}: {
  docType: DocType
  requiresBackCapture: boolean
  onContinue: () => void
}) {
  const label = DOC_LABEL_LOWER[docType] ?? 'document'
  const items = useMemo(() => buildItems(requiresBackCapture), [requiresBackCapture])

  const [checked, setChecked] = useState<Set<CheckItemId>>(new Set())
  const allChecked = checked.size === items.length

  function check(id: CheckItemId) {
    setChecked((prev) => new Set([...prev, id]))
  }

  // Auto-check items with a natural stagger — gives the user time to read each
  // before it resolves. 900 ms per item matches the existing cadence.
  useEffect(() => {
    const timers = items.map((id, i) =>
      setTimeout(() => check(id), (i + 1) * 900),
    )
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Scrollable content */}
      <div className="screen-scroll" style={{ padding: '8px 24px 0' }}>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--ink-1)', margin: '0 0 4px' }}>
            {docGuidance.heading}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 18px' }}>
            {docGuidance.subheading}
          </p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((id, i) => {
            const { title, body } = docGuidance.checkItems[id]
            const { icon: Icon, color, bg } = ITEM_STYLES[id]
            const isChecked = checked.has(id)

            return (
              <motion.button
                key={id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06 }}
                onClick={() => check(id)}
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
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 340, damping: 20 }}
                      >
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
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: isChecked ? 'var(--ink-1)' : 'var(--ink-2)' }}>
                    {title}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                    {body}
                  </p>
                </div>
              </motion.button>
            )
          })}
        </div>

      </div>

      {/* Sticky footer — CTA only; camera awareness is now in the checklist */}
      <div
        className="screen-footer"
        style={{ borderTop: '1px solid var(--border-1)' }}
      >
        <Button onClick={onContinue} icon={<ArrowRight size={15} />}>
          {allChecked ? docGuidance.ctaDynamic(label) : docGuidance.ctaDefault}
        </Button>
      </div>
    </div>
  )
}
