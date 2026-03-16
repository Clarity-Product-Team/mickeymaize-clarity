'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sun, UserRound, Glasses } from 'lucide-react'
import { Button } from '@/components/primitives/Button'
import type { SelfieGuidanceScreenProps } from '@/lib/types'

const TIPS = [
  {
    icon: Sun,
    title: 'Face the light',
    description: 'Make sure light falls on your face evenly, not from behind.',
    color: 'var(--warning)',
    bg: 'var(--warning-muted)',
  },
  {
    icon: UserRound,
    title: 'Look straight ahead',
    description: 'Face the camera directly with a neutral expression.',
    color: 'var(--accent)',
    bg: 'var(--accent-muted)',
  },
  {
    icon: Glasses,
    title: 'Remove glasses',
    description: 'Glasses can cause glare or partial obstruction. Remove them if possible.',
    color: 'var(--success)',
    bg: 'var(--success-muted)',
  },
]

export function SelfieGuidanceScreen({ onContinue }: SelfieGuidanceScreenProps) {
  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '4px 24px 0' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      {/* Heading */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h2 className="t-h2" style={{ color: 'var(--ink-1)', margin: '0 0 6px' }}>
          Now a quick selfie
        </h2>
        <p className="t-sm" style={{ color: 'var(--ink-2)', margin: '0 0 20px' }}>
          We&apos;ll match your face to the document photo. Takes just a few seconds.
        </p>
      </motion.div>

      {/* Face diagram */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 22 }}
        style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}
      >
        <div
          style={{
            width: 140,
            height: 170,
            borderRadius: 'var(--radius-full)',
            background: 'var(--surface-0)',
            border: '2.5px solid var(--border-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="80" height="100" viewBox="0 0 80 100" fill="none" aria-hidden="true">
            <circle cx="40" cy="32" r="20" fill="var(--border-1)" />
            <circle cx="40" cy="32" r="14" fill="var(--border-2)" />
            <path d="M10 85c0-16.6 13.4-30 30-30s30 13.4 30 30" fill="var(--border-1)" />
          </svg>
        </div>
      </motion.div>

      {/* Tips */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TIPS.map(({ icon: Icon, title, description, color, bg }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.16 + i * 0.07 }}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              padding: '12px 16px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-0)',
              border: '1px solid var(--border-1)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={16} style={{ color }} strokeWidth={2} />
            </div>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: 'var(--ink-1)' }}>
                {title}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                {description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
        style={{ paddingTop: 16 }}
      >
        <Button onClick={onContinue} icon={<ArrowRight size={16} />}>
          Take selfie
        </Button>
      </motion.div>
    </motion.div>
  )
}
