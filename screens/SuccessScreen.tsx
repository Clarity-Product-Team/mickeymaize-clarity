'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { AnimatedCheck } from '@/components/primitives/AnimatedCheck'
import { Button } from '@/components/primitives/Button'
import { generateVerificationId } from '@/lib/utils'
import { success } from '@/lib/content'

export function SuccessScreen() {
  const [id] = useState(generateVerificationId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Scrollable content */}
      <div className="screen-scroll" style={{ padding: '8px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>

        {/* Check — ambient glow sits behind the SVG ring */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Radial glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.14 }}
            style={{
              position: 'absolute',
              width: 160, height: 160,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,179,125,0.20) 0%, transparent 68%)',
              pointerEvents: 'none',
            }}
          />
          <AnimatedCheck size={100} color="var(--success)" />
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.34, type: 'spring', stiffness: 120, damping: 20 }}
          style={{ textAlign: 'center', width: '100%' }}
        >
          <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--ink-1)', margin: '0 0 8px' }}>
            {success.heading}
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: 0 }}>
            {success.subheading}
          </p>
        </motion.div>

        {/* Verification status cards — staggered spring entrance */}
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          {success.metrics.map(({ label, status }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 14, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.50 + i * 0.08, type: 'spring', stiffness: 160, damping: 20 }}
              style={{
                flex: 1, padding: '14px 12px', borderRadius: 'var(--radius-lg)',
                background: 'var(--success-muted)', border: '1px solid var(--success)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              }}
            >
              <CheckCircle2 size={22} style={{ color: 'var(--success)' }} strokeWidth={1.8} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--ink-3)' }}>{status}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Privacy note */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
          style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-0)', border: '1px solid var(--border-1)' }}
        >
          <Lock size={14} style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }} strokeWidth={2} />
          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
            {success.privacyNote}
          </p>
        </motion.div>

        {/* ID string */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
          style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--ink-3)', margin: 0 }}>
          {id}
        </motion.p>

      </div>

      {/* Sticky CTA footer */}
      <motion.div
        className="screen-footer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.72 }}
        style={{ borderTop: '1px solid var(--border-1)' }}
      >
        <Button onClick={() => alert('Continue — integrate your callback here')} icon={<ArrowRight size={15} />}>
          {success.cta}
        </Button>
      </motion.div>

    </div>
  )
}
