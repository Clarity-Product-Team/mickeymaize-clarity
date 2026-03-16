'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CameraFrame } from '@/components/camera/CameraFrame'
import { FaceOverlay } from '@/components/camera/FaceOverlay'
import { QualityIndicator } from '@/components/camera/QualityIndicator'
import { useQualitySimulation } from '@/hooks/useQualitySimulation'
import { QUALITY_CHECKS_SELFIE } from '@/lib/constants'
import type { SelfieCaptureScreenProps } from '@/lib/types'

export function SelfieCaptureScreen({ onCapture, onRetry }: SelfieCaptureScreenProps) {
  const [captured, setCaptured] = useState(false)
  const [scanActive, setScanActive] = useState(true)

  const { checks, allGood } = useQualitySimulation(QUALITY_CHECKS_SELFIE, scanActive)

  // Auto-capture once all checks pass
  useEffect(() => {
    if (!allGood || captured) return
    const t = setTimeout(() => {
      setCaptured(true)
      setScanActive(false)
      setTimeout(onCapture, 900)
    }, 700)
    return () => clearTimeout(t)
  }, [allGood, captured, onCapture])

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div style={{ padding: '4px 24px 10px' }}>
        <h2 className="t-h3" style={{ color: 'var(--ink-1)', margin: '0 0 2px' }}>
          Take your selfie
        </h2>
        <p className="t-caption" style={{ color: 'var(--ink-2)', margin: 0 }}>
          {captured
            ? 'Selfie captured — moving on…'
            : "Look straight ahead. We'll capture automatically."}
        </p>
      </div>

      {/* Camera */}
      <CameraFrame style={{ flex: 1 }} minHeight={320}>
        {/* Quality chips */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ display: 'flex', justifyContent: 'center', padding: '20px 16px 0' }}
        >
          <QualityIndicator checks={checks} />
        </motion.div>

        {/* Face oval */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <FaceOverlay allGood={captured} />
        </div>

        {/* Success overlay */}
        {captured && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,179,125,0.10)',
            }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18 }}
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-full)',
                background: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M6 14l5.5 5.5L22 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </motion.div>
        )}

        {/* Warm caption */}
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
            {allGood && !captured
              ? 'Almost there — looking great'
              : captured
                ? 'Perfect!'
                : 'Keep your face in the oval'}
          </p>
        </div>
      </CameraFrame>

      {/* Trouble link */}
      <div style={{ padding: '12px 24px 4px', textAlign: 'center' }}>
        <button
          onClick={() => onRetry('face_mismatch')}
          style={{ fontSize: 13, color: 'var(--ink-3)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Having trouble? See help
        </button>
      </div>
    </motion.div>
  )
}
