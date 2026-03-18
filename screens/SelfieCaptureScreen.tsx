'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, CameraOff } from 'lucide-react'
import { CameraFrame } from '@/components/camera/CameraFrame'
import { FaceOverlay } from '@/components/camera/FaceOverlay'
import { SelfieInstruction } from '@/components/camera/SelfieInstruction'
import { Button } from '@/components/primitives/Button'
import { useSelfieQuality } from '@/hooks/useSelfieQuality'
import { selfieCapture } from '@/lib/content'
import type { ErrorType, SelfieCapturePhase, SelfieCaptureScreenProps } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────────

/** How long the 'capturing' success flash is shown before switching to 'validating'. */
const CAPTURING_DURATION_MS = 420

/** How long the simulated 'validating' state lasts before calling onCapture(). */
const VALIDATING_DURATION_MS = 900

// ── Scan phase ────────────────────────────────────────────────────────────────
//
// Internal lifecycle state, distinct from SelfieCapturePhase (the derived display type).
// 'scanning' → 'capturing' → 'validating' → 'done'

type ScanPhase = 'scanning' | 'capturing' | 'validating' | 'done'

// ── Header state ──────────────────────────────────────────────────────────────

interface HeaderState {
  title: string
  sub: string
  titleColor?: string
}

function getHeaderState(
  resolvedCount: number,
  allClear: boolean,
  scanPhase: ScanPhase,
): HeaderState {
  const s = selfieCapture.states
  if (scanPhase === 'done' || scanPhase === 'validating')
    return { ...s.allDone, titleColor: 'var(--success)' }
  if (scanPhase === 'capturing' || allClear)
    return { ...s.allClear, titleColor: 'var(--success)' }
  if (resolvedCount >= 3) return { ...s.nearClear }
  if (resolvedCount >= 1) return { ...s.lookingGood }
  return { ...s.default }
}

// ── Camera permission blocked ─────────────────────────────────────────────────

function CameraPermissionDenied({ onReload }: { onReload: () => void }) {
  const c = selfieCapture.cameraPermissionDenied
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
        <h3 style={{
          fontSize: 18, fontWeight: 700, color: 'var(--ink-1)',
          margin: '0 0 8px', letterSpacing: '-0.2px',
        }}>
          {c.heading}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, lineHeight: 1.55 }}>
          {c.body}
        </p>
      </div>

      <Button variant="secondary" onClick={onReload}>
        {c.reload}
      </Button>
    </motion.div>
  )
}

// ── Post-capture overlay (inside camera frame) ────────────────────────────────
//
// 'capturing': brief green success flash — confirms the shutter fired.
// 'validating': dark overlay with spinner — covers the backend quality-check stub.

function PostCaptureOverlay({ phase }: { phase: 'capturing' | 'validating' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'absolute', inset: 0, zIndex: 20,
        background: phase === 'validating'
          ? 'rgba(8, 8, 18, 0.76)'
          : 'rgba(0, 179, 125, 0.08)',
        backdropFilter: phase === 'validating' ? 'blur(4px)' : undefined,
        WebkitBackdropFilter: phase === 'validating' ? 'blur(4px)' : undefined,
        display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <AnimatePresence mode="wait">
        {phase === 'capturing' ? (
          <motion.div
            key="captured"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <path
                d="M6 15l6 6L24 9"
                stroke="#fff"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        ) : (
          <motion.div
            key="validating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
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
              {selfieCapture.validatingLabel}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function SelfieCaptureScreen({
  onCapture,
  onRetry,
  mode = 'photo',
  onSkip,
  onValidate,
  onCaptureFailed,
}: SelfieCaptureScreenProps) {
  const [scanPhase, setScanPhase] = useState<ScanPhase>('scanning')
  const [isInitializing, setIsInitializing] = useState(true)
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false)
  const captureTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Quality hook is active only while scanning, initialized, and camera accessible
  const scanActive = scanPhase === 'scanning' && !isInitializing && !cameraPermissionDenied

  const { activeIssue, resolvedCount, allClear, autoCaptureProgress } =
    useSelfieQuality(scanActive)

  // 'detecting' phase — 400 ms initialization window on mount
  useEffect(() => {
    const t = setTimeout(() => setIsInitializing(false), 400)
    return () => clearTimeout(t)
  }, [])

  // Camera permission check — runs once; updates if the user changes the setting
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return
    navigator.permissions
      .query({ name: 'camera' as PermissionName })
      .then((status) => {
        if (status.state === 'denied') setCameraPermissionDenied(true)
        status.onchange = () => {
          if (status.state === 'denied') setCameraPermissionDenied(true)
        }
      })
      .catch(() => {})
  }, [])

  // Cleanup capture timers on unmount
  useEffect(() => {
    return () => captureTimersRef.current.forEach(clearTimeout)
  }, [])

  // Auto-capture: scanning → capturing → validating → done
  useEffect(() => {
    if (autoCaptureProgress < 1 || scanPhase !== 'scanning') return

    captureTimersRef.current.forEach(clearTimeout)
    setScanPhase('capturing')

    const t1 = setTimeout(() => {
      setScanPhase('validating')

      // If an async validator is provided, run it during the validating phase
      // and branch on the result. Otherwise, fall through after the stub delay.
      if (onValidate) {
        onValidate().then((res) => {
          setScanPhase('done')
          if (res.ok) {
            onCapture()
          } else {
            onCaptureFailed?.()
          }
        })
      } else {
        const t2 = setTimeout(() => {
          setScanPhase('done')
          onCapture()
        }, VALIDATING_DURATION_MS)
        captureTimersRef.current.push(t2)
      }
    }, CAPTURING_DURATION_MS)

    captureTimersRef.current = [t1]
    return () => captureTimersRef.current.forEach(clearTimeout)
  }, [autoCaptureProgress, scanPhase, onCapture, onValidate, onCaptureFailed])

  // Single derived phase — single source of truth for display logic
  const selfieCapturePhase = useMemo((): SelfieCapturePhase => {
    if (cameraPermissionDenied)     return 'camera_denied'
    if (scanPhase === 'capturing')  return 'capturing'
    if (scanPhase === 'validating') return 'validating'
    if (scanPhase === 'done')       return 'capturing'   // screen is exiting; keep success state
    if (isInitializing)             return 'detecting'
    if (allClear)                   return 'all_clear'
    if (activeIssue)                return activeIssue
    return 'scanning'
  }, [cameraPermissionDenied, scanPhase, isInitializing, allClear, activeIssue])

  const headerState = getHeaderState(resolvedCount, allClear, scanPhase)

  // Convenience booleans for render branching
  const isPostCapture = scanPhase === 'capturing' || scanPhase === 'validating' || scanPhase === 'done'

  // Mode guard — non-photo modes are not yet implemented.
  // Hooks above must run unconditionally; this guard is placed after all hooks.
  // Replace the inner div with a real capture implementation when each mode is built.
  if (mode !== 'photo') {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px', textAlign: 'center', gap: 12,
      }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-1)', margin: 0 }}>
          {selfieCapture.modes[mode].modeLabel} capture
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>
          This mode will be available soon.
        </p>
      </div>
    )
  }

  if (cameraPermissionDenied) {
    return <CameraPermissionDenied onReload={() => window.location.reload()} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '4px 24px 10px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={selfieCapturePhase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
          >
            <h2
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: headerState.titleColor ?? 'var(--ink-1)',
                margin: '0 0 2px',
                transition: 'color 0.4s ease',
              }}
            >
              {headerState.title}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0, lineHeight: 1.4 }}>
              {headerState.sub}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Camera viewport ──────────────────────────────────────────────── */}
      <CameraFrame style={{ flex: 1 }} minHeight={310}>

        {/* Auto-capture progress strip at top */}
        <AnimatePresence>
          {allClear && !isPostCapture && (
            <motion.div
              key="progress-strip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: 3,
                background: 'rgba(0,179,125,0.25)',
                zIndex: 20,
              }}
            >
              <motion.div
                style={{
                  height: '100%',
                  background: 'var(--success)',
                  borderRadius: '0 2px 2px 0',
                  width: `${autoCaptureProgress * 100}%`,
                }}
                transition={{ duration: 0 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Face oval — centered */}
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
            faceIssue={isPostCapture ? null : activeIssue}
            allGood={allClear && !isPostCapture}
            captured={isPostCapture}
          />
        </div>

        {/* Instruction banner — hidden once auto-capture fires */}
        {!isPostCapture && (
          <SelfieInstruction activeIssue={activeIssue} allClear={allClear} />
        )}

        {/* Post-capture overlay: success flash → validating spinner */}
        <AnimatePresence>
          {(scanPhase === 'capturing' || scanPhase === 'validating') && (
            <PostCaptureOverlay
              key="post-capture"
              phase={scanPhase}
            />
          )}
        </AnimatePresence>

      </CameraFrame>

      {/* ── Below camera ─────────────────────────────────────────────────── */}
      {/* aria-live: dynamic header changes are announced to screen readers */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          padding: '10px 24px',
          paddingBottom: 'max(14px, env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Privacy note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Lock size={11} style={{ color: 'var(--ink-3)' }} strokeWidth={2} />
          <span style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1 }}>
            {selfieCapture.privacyNote}
          </span>
        </div>

        {/* Secondary actions — hidden once capture fires */}
        {!isPostCapture && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {onSkip && (
              <button
                onClick={onSkip}
                style={{
                  fontSize: 11, color: 'var(--ink-3)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0,
                }}
              >
                {selfieCapture.skipLabel}
              </button>
            )}
            <button
              onClick={() => onRetry('face_mismatch')}
              style={{
                fontSize: 11, color: 'var(--ink-3)',
                background: 'none', border: 'none',
                cursor: 'pointer', padding: 0,
              }}
            >
              Having trouble?
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
