'use client'

import { motion } from 'framer-motion'
import { ScanLine, SmilePlus, BadgeCheck, ArrowRight, Lock, Shield, Globe } from 'lucide-react'
import { Button } from '@/components/primitives/Button'
import type { WelcomeScreenProps } from '@/lib/types'

const STEPS = [
  { icon: ScanLine,   label: 'Scan document', desc: 'Passport or ID' },
  { icon: SmilePlus,  label: 'Quick selfie',   desc: 'Live face match' },
  { icon: BadgeCheck, label: 'Verified',       desc: 'Takes ~2 minutes' },
]

const TRUST = [
  { icon: Lock,   label: 'Bank-grade encryption' },
  { icon: Shield, label: 'GDPR compliant' },
  { icon: Globe,  label: 'Used in 180+ countries' },
]

const stagger = (i: number) => ({ delay: 0.08 + i * 0.07 })

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '8px 24px 0' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 32 }}>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
        >
          <p className="t-label" style={{ color: 'var(--accent)', marginBottom: 8 }}>
            Identity verification
          </p>
          <h1 className="t-h1" style={{ color: 'var(--ink-1)', margin: '0 0 10px' }}>
            Verify your identity
          </h1>
          <p className="t-body" style={{ color: 'var(--ink-2)', margin: 0 }}>
            A quick, secure check to confirm who you are. Takes about 2 minutes.
          </p>
        </motion.div>

        {/* Step preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {STEPS.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={stagger(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '13px 16px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-0)',
                border: '1px solid var(--border-1)',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={18} style={{ color: 'var(--accent)' }} strokeWidth={1.8} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink-1)' }}>
                  {label}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)' }}>{desc}</p>
              </div>
              <div
                style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--ink-3)',
                  background: 'var(--border-1)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {i + 1}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.38 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          {TRUST.map(({ icon: Icon, label }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--ink-3)',
              }}
            >
              <Icon size={12} style={{ color: 'var(--accent)', opacity: 0.7 }} strokeWidth={2} />
              {label}
            </div>
          ))}
        </motion.div>
      </div>

      {/* CTA */}
      <motion.div
        style={{ paddingTop: 16, paddingBottom: 8 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
      >
        <Button onClick={onStart} icon={<ArrowRight size={16} />}>
          Start verification
        </Button>
        <p
          className="t-caption"
          style={{ color: 'var(--ink-3)', textAlign: 'center', marginTop: 12 }}
        >
          Your data is encrypted end-to-end and never sold.
        </p>
      </motion.div>
    </motion.div>
  )
}
