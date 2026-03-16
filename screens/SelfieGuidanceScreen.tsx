'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Lock, Sun, Smile, Glasses } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/primitives/Button'
import { useTheme } from '@/components/layout/ThemeProvider'

// ── Face preview illustration ─────────────────────────────────────────────────

function FacePreview() {
  return (
    <div style={{ position: 'relative', width: 160, height: 186 }}>
      {/* Outer ring — mirrors the liveness arc aesthetic */}
      <motion.div
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: -8,
          borderRadius: '50%',
          border: '1.5px solid var(--border-2)',
        }}
      />

      {/* Oval — matches the in-camera face oval shape */}
      <div
        style={{
          position: 'relative',
          width: 160,
          height: 186,
          borderRadius: '50%',
          border: '2.5px solid var(--border-2)',
          background: 'var(--surface-0)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 12,
        }}
      >
        {/* Head */}
        <div
          style={{
            position: 'absolute',
            top: 34,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 80,
            height: 90,
            borderRadius: '50% 50% 44% 44%',
            background: 'var(--border-2)',
          }}
        />
        {/* Neck + shoulders */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 110,
            height: 52,
            borderRadius: '50% 50% 0 0 / 70% 70% 0 0',
            background: 'var(--border-1)',
          }}
        />
      </div>

      {/* Rotating accent arc — suggests the green oval the user will see */}
      <motion.div
        animate={{ rotate: [0, 12, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          inset: -4,
          borderRadius: '50%',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 168 194"
          fill="none"
          style={{ position: 'absolute', inset: 0 }}
        >
          <ellipse
            cx={84} cy={97}
            rx={80} ry={93}
            stroke="var(--success)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="60 260"
            strokeDashoffset="-10"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '84px 97px' }}
          />
        </svg>
      </motion.div>
    </div>
  )
}

// ── Tip chip ──────────────────────────────────────────────────────────────────

function TipChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '8px 14px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--surface-0)',
        border: '1px solid var(--border-1)',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', color: 'var(--accent)', flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>{label}</span>
    </div>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function SelfieGuidanceScreen({ onContinue }: { onContinue: () => void }) {
  const { illustrations } = useTheme()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Scrollable content */}
      <div className="screen-scroll" style={{ padding: '8px 24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ textAlign: 'center', width: '100%', marginBottom: 4 }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--ink-1)', margin: '0 0 6px' }}>
            Now a quick selfie
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>
            We match your face to the document photo.
            <br />
            Takes about 10 seconds.
          </p>
        </motion.div>

        {/* Face illustration — decorative guide, hidden when theme sets illustrations:'none' */}
        {illustrations !== 'none' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: illustrations === 'minimal' ? 0.45 : 1, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 180, damping: 22 }}
            aria-hidden="true"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0 8px' }}
          >
            <FacePreview />
          </motion.div>
        )}

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 18 }}
        >
          <TipChip icon={<Sun size={14} strokeWidth={2} />}     label="Face a light source" />
          <TipChip icon={<Smile size={14} strokeWidth={2} />}   label="Look naturally" />
          <TipChip icon={<Glasses size={14} strokeWidth={2} />} label="Remove glasses" />
        </motion.div>

      </div>

      {/* Sticky footer: privacy note + CTA */}
      <motion.div
        className="screen-footer"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        style={{ borderTop: '1px solid var(--border-1)', display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-0)', border: '1px solid var(--border-1)' }}>
          <Lock size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} strokeWidth={2} />
          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.45 }}>
            Your photo is used only for this verification and{' '}
            <strong style={{ color: 'var(--ink-2)', fontWeight: 600 }}>never stored for facial recognition</strong>.
          </p>
        </div>
        <Button onClick={onContinue} icon={<ArrowRight size={15} />}>
          Open camera
        </Button>
      </motion.div>

    </div>
  )
}
