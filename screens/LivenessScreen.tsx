'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ArrowRight, CameraOff, RotateCcw } from 'lucide-react'
import { CameraFrame } from '@/components/camera/CameraFrame'
import { FaceOverlay } from '@/components/camera/FaceOverlay'
import { Button } from '@/components/primitives/Button'
import { liveness } from '@/lib/content'
import type { LivenessPhase, LivenessScreenProps } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Duration of the motion arc fill — matches original implementation. */
const DURATION_MS = 3200
/** Interval tick for motion progress — matches original implementation. */
const TICK_MS = 32
/** Stub: auto-advance from align → motion after this many ms. */
const ALIGN_DURATION_MS = 600
/** Stub: post-motion quality check before transitioning to complete. */
const VALIDATING_DURATION_MS = 1200
/** Delay before onComplete() fires after reaching 'complete'. */
const COMPLETE_DELAY_MS = 820
/** Failed retries allowed before escalating to onFailed(). */
const MAX_ATTEMPTS = 2

// ── Status text progression (motion phase) ────────────────────────────────────

function getMotionStatus(progress: number): { text: string; color: string } {
  if (progress > 0.75) return { text: liveness.status.almost, color: 'rgba(255,255,255,0.85)' }
  if (progress > 0.35) return { text: liveness.status.steady, color: 'rgba(255,255,255,0.72)' }
  return { text: liveness.status.start, color: 'rgba(255,255,255,0.6)' }
}

function getMotionStatusKey(progress: number): string {
  if (progress > 0.75) return 'almost'
  if (progress > 0.35) return 'steady'
  return 'start'
}

// ── Camera permission blocked ─────────────────────────────────────────────────

function CameraPermissionDenied({ onReload }: { onReload: () => void }) {
  const c = liveness.cameraPermissionDenied
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', gap: 16, textAlign: 'center',
      }}
    >
      <div style={{
        width: 72, height: 72, borderRadius: 'var(--radius-xl)',
        background: 'var(--warning-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CameraOff size={30} style={{ color: 'var(--warning)' }} strokeWidth={1.6} />
      </div>
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 8px', letterSpacing: '-0.2px' }}>
          {c.heading}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, lineHeight: 1.55 }}>
          {c.body}
        </p>
      </div>
      <Button variant="secondary" onClick={onReload}>{c.reload}</Button>
    </motion.div>
  )
}

// ── Validating overlay (inside camera frame) ──────────────────────────────────
//
// Shown during 'validating' phase. Dark overlay + spinner communicates that a
// quality check is running. In production this covers a backend round-trip.

function ValidatingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 20,
        background: 'rgba(8, 8, 18, 0.76)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 12,
      }}
    >
      <motion.svg
        width="34" height="34" viewBox="0 0 24 24" fill="none"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}
      >
        <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
        <path d="M12 3a9 9 0 0 1 9 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      </motion.svg>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>
        {liveness.phases.validating.label}
      </p>
    </motion.div>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function LivenessScreen({ onComplete, onFailed }: LivenessScreenProps) {
  const [phase, setPhase] = useState<LivenessPhase>('intro')
  const [motionProgress, setMotionProgress] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Camera permission check ─────────────────────────────────────────────
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return
    navigator.permissions
      .query({ name: 'camera' as PermissionName })
      .then((status) => {
        if (status.state === 'denied') setPhase('camera_denied')
        status.onchange = () => {
          if (status.state === 'denied') setPhase('camera_denied')
        }
      })
      .catch(() => {})
  }, [])

  // ── align: stub timer auto-advances to motion ──────────────────────────
  useEffect(() => {
    if (phase !== 'align') return
    const t = setTimeout(() => setPhase('motion'), ALIGN_DURATION_MS)
    return () => clearTimeout(t)
  }, [phase])

  // ── motion: interval drives motionProgress 0→1 ────────────────────────
  useEffect(() => {
    if (phase !== 'motion') return
    const step = TICK_MS / DURATION_MS
    intervalRef.current = setInterval(() => {
      setMotionProgress((p) => {
        const next = p + step
        if (next >= 1) {
          clearInterval(intervalRef.current!)
          setPhase('validating')
          return 1
        }
        return next
      })
    }, TICK_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [phase])

  // ── validating: stub always succeeds → complete ────────────────────────
  useEffect(() => {
    if (phase !== 'validating') return
    const t = setTimeout(() => setPhase('complete'), VALIDATING_DURATION_MS)
    return () => clearTimeout(t)
  }, [phase])

  // ── complete: brief success state → onComplete() ─────────────────────
  useEffect(() => {
    if (phase !== 'complete') return
    const t = setTimeout(onComplete, COMPLETE_DELAY_MS)
    return () => clearTimeout(t)
  }, [phase, onComplete])

  // ── Handlers ────────────────────────────────────────────────────────────

  function handleBegin() { setPhase('align') }

  function handleRetry() {
    const next = attemptCount + 1
    if (next >= MAX_ATTEMPTS) {
      onFailed?.()
      return
    }
    setAttemptCount(next)
    setMotionProgress(0)
    setPhase('align')
  }

  // ── Derived values ───────────────────────────────────────────────────────

  const isCameraPhase = phase === 'align' || phase === 'motion' || phase === 'validating' || phase === 'complete'
  const motionStatus = getMotionStatus(motionProgress)
  const motionStatusKey = getMotionStatusKey(motionProgress)

  // ── Phase: camera_denied ─────────────────────────────────────────────────
  if (phase === 'camera_denied') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <CameraPermissionDenied onReload={() => window.location.reload()} />
      </div>
    )
  }

  // ── Phase: intro ─────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

        <div className="screen-scroll" style={{ padding: '8px 24px 0', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--ink-1)', margin: '0 0 6px' }}>
              {liveness.heading}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, lineHeight: 1.55 }}>
              {liveness.subheading}
            </p>
          </motion.div>

          {/* Spacer + trust badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            style={{ flex: 1, display: 'flex', alignItems: 'flex-end', paddingBottom: 12 }}
          >
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '10px 14px', borderRadius: 'var(--radius-md)',
              background: 'var(--surface-0)', border: '1px solid var(--border-1)',
              width: '100%',
            }}>
              <ShieldCheck size={13} style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }} strokeWidth={2} />
              <div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  {liveness.privacy.short}{' '}{liveness.privacy.long}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--ink-3)' }}>
                  {liveness.trustBadge}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="screen-footer"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          style={{ borderTop: '1px solid var(--border-1)' }}
        >
          <Button onClick={handleBegin} icon={<ArrowRight size={15} />}>
            {liveness.phases.intro.cta}
          </Button>
        </motion.div>

      </div>
    )
  }

  // ── Phase: failed ─────────────────────────────────────────────────────────
  if (phase === 'failed') {
    const f = liveness.phases.failed
    const attemptsRemaining = MAX_ATTEMPTS - attemptCount
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
      >
        <div className="screen-scroll" style={{ padding: '16px 24px 0', flex: 1 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--ink-1)', margin: '0 0 8px' }}>
            {f.heading}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, lineHeight: 1.55 }}>
            {f.body}
          </p>
          {attemptsRemaining > 0 && (
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '10px 0 0' }}>
              {attemptsRemaining === 1 ? '1 attempt remaining' : `${attemptsRemaining} attempts remaining`}
            </p>
          )}
        </div>

        <div
          className="screen-footer"
          style={{ borderTop: '1px solid var(--border-1)', display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {attemptsRemaining > 0 && (
            <Button onClick={handleRetry} iconLeading={<RotateCcw size={14} />}>
              {f.retryCta}
            </Button>
          )}
          {onFailed && (
            <Button variant="ghost" onClick={onFailed}>
              {f.helpCta}
            </Button>
          )}
        </div>
      </motion.div>
    )
  }

  // ── Camera phases: align | motion | validating | complete ──────────────────

  // Header subtitle content per phase
  function getCameraSubtitle(): { text: string; color: string } {
    if (phase === 'complete')   return { text: liveness.status.done,               color: 'var(--success)' }
    if (phase === 'validating') return { text: liveness.phases.validating.label,   color: 'var(--ink-2)' }
    if (phase === 'motion')     return { text: motionStatus.text,                  color: motionStatus.color === 'rgba(255,255,255,0.6)' ? 'var(--ink-2)' : motionStatus.color }
    return                             { text: liveness.phases.align.instruction,  color: 'var(--ink-2)' }
  }

  const cameraSubtitle = getCameraSubtitle()
  const subtitleKey = phase === 'motion' ? motionStatusKey : phase

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '4px 24px 10px' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-1)', margin: '0 0 3px' }}>
          {liveness.heading}
        </h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={subtitleKey}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: 12, margin: 0, lineHeight: 1.45,
              color: cameraSubtitle.color,
              transition: 'color 0.4s ease',
            }}
          >
            {cameraSubtitle.text}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* ── Camera viewport ──────────────────────────────────────────────── */}
      {isCameraPhase && (
        <CameraFrame style={{ flex: 1 }} minHeight={320}>

          {/* Face oval + arc */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <FaceOverlay
              allGood={phase === 'complete'}
              livenessProgress={motionProgress}
              showArc={phase === 'motion' || phase === 'validating' || phase === 'complete'}
            />
          </div>

          {/* align: instruction badge at bottom */}
          <AnimatePresence>
            {phase === 'align' && (
              <motion.div
                key="align-badge"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.24 }}
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '0 16px 18px',
                  display: 'flex', justifyContent: 'center',
                }}
              >
                <div style={{
                  padding: '8px 20px', borderRadius: 99,
                  background: 'rgba(8, 8, 18, 0.78)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.72)', lineHeight: 1 }}>
                    {liveness.phases.align.instruction}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* motion: status text badge at bottom */}
          <AnimatePresence>
            {phase === 'motion' && (
              <motion.div
                key="motion-status"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24 }}
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '0 16px 18px',
                  display: 'flex', justifyContent: 'center',
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={motionStatusKey}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.24 }}
                    style={{
                      padding: '8px 20px', borderRadius: 99,
                      background: 'rgba(8, 8, 18, 0.78)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                    }}
                  >
                    <p style={{
                      margin: 0, fontSize: 13, fontWeight: 600, lineHeight: 1,
                      color: motionStatus.color,
                      transition: 'color 0.4s ease',
                    }}>
                      {motionStatus.text}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>

          {/* validating: dark spinner overlay */}
          <AnimatePresence>
            {phase === 'validating' && (
              <ValidatingOverlay key="validating-overlay" />
            )}
          </AnimatePresence>

          {/* complete: green success tint */}
          <AnimatePresence>
            {phase === 'complete' && (
              <motion.div
                key="complete-tint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,179,125,0.07)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </AnimatePresence>

        </CameraFrame>
      )}

      {/* ── Below camera ─────────────────────────────────────────────────── */}
      <div style={{ padding: '12px 24px', paddingBottom: 'max(14px, env(safe-area-inset-bottom, 0px))' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '10px 14px', borderRadius: 'var(--radius-md)',
            background: 'var(--surface-0)', border: '1px solid var(--border-1)',
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
