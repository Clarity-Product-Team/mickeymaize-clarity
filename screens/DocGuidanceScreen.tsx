'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SunMedium, Eye, Maximize2, ArrowRight, Camera } from 'lucide-react'
import { Button } from '@/components/primitives/Button'
import { NoticeBox } from '@/components/primitives/NoticeBox'
import { DOC_LABEL_LOWER } from '@/lib/constants'
import type { DocGuidanceScreenProps } from '@/lib/types'

interface Tip {
  icon: React.ElementType
  title: string
  description: string
  color: string
  bg: string
}

const TIPS: Tip[] = [
  {
    icon: SunMedium,
    title: 'Good lighting',
    description: 'Place your document on a flat, well-lit surface. Avoid shadows and glare.',
    color: 'var(--warning)',
    bg: 'var(--warning-muted)',
  },
  {
    icon: Eye,
    title: 'Remove from sleeve',
    description: 'Take the document out of any protective sleeve or wallet.',
    color: 'var(--accent)',
    bg: 'var(--accent-muted)',
  },
  {
    icon: Maximize2,
    title: 'All corners visible',
    description: 'Make sure all four corners of the document are within the frame.',
    color: 'var(--success)',
    bg: 'var(--success-muted)',
  },
]

export function DocGuidanceScreen({ docType, onContinue }: DocGuidanceScreenProps) {
  const [tipIndex, setTipIndex] = useState(0)
  const tip = TIPS[tipIndex]
  const docLabel = DOC_LABEL_LOWER[docType] ?? 'document'

  // Auto-advance through tips
  useEffect(() => {
    if (tipIndex >= TIPS.length - 1) return
    const t = setTimeout(() => setTipIndex((i) => i + 1), 2200)
    return () => clearTimeout(t)
  }, [tipIndex])

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '4px 24px 0' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        style={{ marginBottom: 20 }}
      >
        <h2 className="t-h2" style={{ color: 'var(--ink-1)', margin: '0 0 6px' }}>
          Get your {docLabel} ready
        </h2>
        <p className="t-sm" style={{ color: 'var(--ink-2)', margin: 0 }}>
          Follow these tips for the best scan result.
        </p>
      </motion.div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Animated tip card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tipIndex}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.26 }}
            style={{
              borderRadius: 'var(--radius-xl)',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 16,
              minHeight: 170,
              background: tip.bg,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `color-mix(in srgb, ${tip.color} 18%, transparent)`,
              }}
            >
              <tip.icon size={24} style={{ color: tip.color }} strokeWidth={1.8} />
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700, color: 'var(--ink-1)' }}>
                {tip.title}
              </p>
              <p className="t-sm" style={{ color: 'var(--ink-2)', margin: 0 }}>
                {tip.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
          {TIPS.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setTipIndex(i)}
              animate={{
                width: i === tipIndex ? 20 : 8,
                background: i === tipIndex ? 'var(--accent)' : 'var(--border-1)',
              }}
              transition={{ duration: 0.22 }}
              style={{ height: 8, borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer' }}
              aria-label={`Tip ${i + 1}`}
            />
          ))}
        </div>

        {/* All tips summary list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TIPS.map(({ icon: Icon, title, color }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: i <= tipIndex ? 1 : 0.35, x: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: i <= tipIndex ? 'var(--surface-0)' : 'transparent',
                border: '1px solid var(--border-1)',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `color-mix(in srgb, ${color} 15%, transparent)`,
                  flexShrink: 0,
                }}
              >
                <Icon size={14} style={{ color }} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)' }}>{title}</span>
              {i < tipIndex && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    marginLeft: 'auto',
                    width: 20,
                    height: 20,
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Camera permission notice + CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 16 }}>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <NoticeBox variant="info" icon={Camera} title="Camera access needed">
            Your browser will ask for permission when you tap the button below.
            We never store your camera feed.
          </NoticeBox>
        </motion.div>
        <Button onClick={onContinue} icon={<ArrowRight size={16} />}>
          I&apos;m ready — scan now
        </Button>
      </div>
    </motion.div>
  )
}
