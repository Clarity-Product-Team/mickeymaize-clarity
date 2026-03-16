'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock } from 'lucide-react'
import { CameraFrame } from '@/components/camera/CameraFrame'
import { FaceOverlay } from '@/components/camera/FaceOverlay'
import { SelfieInstruction } from '@/components/camera/SelfieInstruction'
import { useSelfieQuality } from '@/hooks/useSelfieQuality'
import { selfieCapture } from '@/lib/content'
import type { ErrorType } from '@/lib/types'

// ── Warm header copy — progresses as quality improves ─────────────────────────

interface HeaderState {
  title: string
  sub: string
  titleColor?: string
}

function getHeaderState(resolvedCount: number, allClear: boolean, captured: boolean): HeaderState {
  const s = selfieCapture.states
  if (captured)         return { ...s.allDone,     titleColor: 'var(--success)' }
  if (allClear)         return { ...s.allClear,     titleColor: 'var(--success)' }
  if (resolvedCount >= 3) return { ...s.nearClear }
  if (resolvedCount >= 1) return { ...s.lookingGood }
  return { ...s.default }
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function SelfieCaptureScreen({
  onCapture,
  onRetry,
}: {
  onCapture: () => void
  onRetry: (e: ErrorType) => void
}) {
  const [captured, setCaptured] = useState(false)
  const [scanActive, setScanActive] = useState(true)

  const { activeIssue, resolvedCount, allClear, autoCaptureProgress, reset } =
    useSelfieQuality(scanActive)

  // Auto-capture when progress ring completes
  useEffect(() => {
    if (autoCaptureProgress >= 1 && !captured) {
      setCaptured(true)
      setScanActive(false)
      setTimeout(onCapture, 900)
    }
  }, [autoCaptureProgress, captured, onCapture])

  const headerState = getHeaderState(resolvedCount, allClear, captured)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ padding: '4px 24px 10px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${resolvedCount}-${allClear}-${captured}`}
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

        {/* Subtle auto-capture progress strip at top */}
        <AnimatePresence>
          {allClear && !captured && (
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
            faceIssue={captured ? null : activeIssue}
            allGood={allClear && !captured}
            captured={captured}
          />
        </div>

        {/* Instruction banner */}
        {!captured && (
          <SelfieInstruction activeIssue={activeIssue} allClear={allClear} />
        )}

        {/* Captured success overlay */}
        <AnimatePresence>
          {captured && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,179,125,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
            </motion.div>
          )}
        </AnimatePresence>
      </CameraFrame>

      {/* ── Below camera ─────────────────────────────────────────────────── */}
      {/* aria-live here so dynamic header state changes are announced to screen readers */}
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
            Not stored after verification
          </span>
        </div>

        {/* Trouble link */}
        {!captured && (
          <button
            onClick={() => { setScanActive(false); onRetry('face_mismatch') }}
            style={{
              fontSize: 11,
              color: 'var(--ink-3)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Having trouble?
          </button>
        )}
      </div>
    </div>
  )
}
