'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, ArrowRight } from 'lucide-react'
import { AnimatedCheck } from '@/components/primitives/AnimatedCheck'
import { Button } from '@/components/primitives/Button'
import { generateVerificationId } from '@/lib/utils'

const METRICS = [
  { label: 'Document', value: '98%', description: 'Authenticity score' },
  { label: 'Face match', value: '97%', description: 'Biometric confidence' },
]

const stagger = (i: number) => ({ delay: 0.1 + i * 0.07 })

export function SuccessScreen() {
  const [verificationId] = useState(() => generateVerificationId())

  return (
    <motion.div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: '8px 24px 0',
        alignItems: 'center',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35 }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          width: '100%',
        }}
      >
        {/* Check */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <AnimatedCheck size={96} color="var(--success)" />
        </motion.div>

        {/* Headline */}
        <motion.div
          style={{ textAlign: 'center' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h1 className="t-display" style={{ color: 'var(--ink-1)', margin: '0 0 8px' }}>
            Identity verified
          </h1>
          <p className="t-body" style={{ color: 'var(--ink-2)', margin: 0 }}>
            You&apos;re all set. Your verification was successful.
          </p>
        </motion.div>

        {/* Confidence metrics */}
        <motion.div
          style={{ display: 'flex', gap: 12, width: '100%' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {METRICS.map(({ label, value, description }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={stagger(i)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px 12px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--success-muted)',
                border: '1px solid var(--success)',
              }}
            >
              <p
                className="tabular"
                style={{ margin: '0 0 2px', fontSize: 28, fontWeight: 700, color: 'var(--success)' }}
              >
                {value}
              </p>
              <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>
                {label}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-3)' }}>{description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Data protection note */}
        <motion.div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '12px 14px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-0)',
            border: '1px solid var(--border-1)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
        >
          <Lock
            size={15}
            style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }}
            strokeWidth={2}
          />
          <p className="t-caption" style={{ color: 'var(--ink-2)', margin: 0 }}>
            Your identity data is encrypted and stored securely. It will only be used for
            verification purposes and never shared with third parties.
          </p>
        </motion.div>

        {/* Verification ID */}
        <motion.p
          className="t-mono"
          style={{ color: 'var(--ink-3)', margin: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
        >
          {verificationId}
        </motion.p>
      </div>

      {/* CTA */}
      <motion.div
        style={{ width: '100%', paddingTop: 16 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          onClick={() => alert('Continue to app — integrate your callback here')}
          icon={<ArrowRight size={16} />}
        >
          Continue
        </Button>
      </motion.div>
    </motion.div>
  )
}
