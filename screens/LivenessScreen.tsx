'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { CameraFrame } from '@/components/camera/CameraFrame'
import { FaceOverlay } from '@/components/camera/FaceOverlay'
import { liveness } from '@/lib/content'

const DURATION_MS = 3200
const TICK_MS = 32

// ── Status text progression ───────────────────────────────────────────────────

function getStatusText(progress: number, done: boolean): { text: string; color: string } {
  if (done) return { text: liveness.status.done, color: 'var(--success)' }
  if (progress > 0.75) return { text: liveness.status.almost, color: 'rgba(255,255,255,0.85)' }
  if (progress > 0.35) return { text: liveness.status.steady, color: 'rgba(255,255,255,0.72)' }
  return { text: liveness.status.start, color: 'rgba(255,255,255,0.6)' }
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function LivenessScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const step = TICK_MS / DURATION_MS

    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + step
        if (next >= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setDone(true)
          setTimeout(onComplete, 820)
          return 1
        }
        return next
      })
    }, TICK_MS)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [onComplete])

  const status = getStatusText(progress, done)
  const statusKey = done ? 'done' : progress > 0.75 ? 'almost' : progress > 0.35 ? 'steady' : 'start'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '4px 24px 10px' }}>
        <h2
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--ink-1)',
            margin: '0 0 3px',
          }}
        >
          {liveness.heading}
        </h2>
        <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0, lineHeight: 1.45 }}>
          {liveness.subheading}
        </p>
      </div>

      {/* ── Camera viewport ──────────────────────────────────────────────── */}
      <CameraFrame style={{ flex: 1 }} minHeight={320}>

        {/* Face oval + arc */}
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
          <FaceOverlay
            allGood={done}
            livenessProgress={progress}
            showArc
          />
        </div>

        {/* Status text — bottom of camera frame */}
        <div
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            padding: '0 16px 18px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={statusKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24 }}
              style={{
                padding: '8px 20px',
                borderRadius: 99,
                background: 'rgba(8, 8, 18, 0.78)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: status.color,
                  lineHeight: 1,
                  transition: 'color 0.4s ease',
                }}
              >
                {status.text}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Done: green success overlay */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,179,125,0.07)',
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>
      </CameraFrame>

      {/* ── Below camera ─────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 24px', paddingBottom: 'max(14px, env(safe-area-inset-bottom, 0px))' }}>

        {/* Privacy + compliance note — combined */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-0)',
            border: '1px solid var(--border-1)',
          }}
        >
          <ShieldCheck size={13} style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }} strokeWidth={2} />
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              {liveness.privacy.short}{' '}{liveness.privacy.long}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--ink-3)' }}>
              {liveness.trustBadge}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
