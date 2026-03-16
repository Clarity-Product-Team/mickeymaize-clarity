'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CameraFrame } from '@/components/camera/CameraFrame'
import { FaceOverlay } from '@/components/camera/FaceOverlay'
import type { LivenessScreenProps } from '@/lib/types'

const TOTAL_MS = 3000
const TICK_MS = 40

export function LivenessScreen({ onComplete }: LivenessScreenProps) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  const secondsLeft = Math.ceil((1 - progress) * (TOTAL_MS / 1000))

  useEffect(() => {
    const step = TICK_MS / TOTAL_MS
    const id = setInterval(() => {
      setProgress((p) => {
        const next = p + step
        if (next >= 1) {
          clearInterval(id)
          setDone(true)
          setTimeout(onComplete, 700)
          return 1
        }
        return next
      })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [onComplete])

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
          Presence check
        </h2>
        <p className="t-caption" style={{ color: 'var(--ink-2)', margin: 0 }}>
          Hold still for a moment while we confirm you&apos;re present
        </p>
      </div>

      {/* Camera */}
      <CameraFrame style={{ flex: 1 }} minHeight={320}>
        {/* Status chip */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 16px 0' }}>
          <div
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(6px)',
              fontSize: 13,
              fontWeight: 500,
              color: '#fff',
            }}
          >
            <AnimatePresence mode="wait">
              {done ? (
                <motion.span key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Presence confirmed ✓
                </motion.span>
              ) : (
                <motion.span key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Scanning… keep still
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Face oval with arc progress */}
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
          <FaceOverlay allGood={done} livenessProgress={progress} showArc />
        </div>

        {/* Countdown */}
        {!done && (
          <div
            style={{
              position: 'absolute',
              bottom: 24,
              left: 0,
              right: 0,
              textAlign: 'center',
            }}
          >
            <motion.p
              key={secondsLeft}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.18 }}
              className="tabular"
              style={{ fontSize: 36, fontWeight: 700, color: '#fff', margin: 0 }}
            >
              {secondsLeft}
            </motion.p>
          </div>
        )}
      </CameraFrame>

      {/* Sub-caption */}
      <div style={{ padding: '12px 24px 4px', textAlign: 'center' }}>
        <p className="t-caption" style={{ color: 'var(--ink-3)', margin: 0 }}>
          {done
            ? 'All done — moving on…'
            : 'Look directly at the camera. No action needed.'}
        </p>
      </div>
    </motion.div>
  )
}
