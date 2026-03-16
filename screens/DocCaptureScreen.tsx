'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Upload, FlipHorizontal, CheckCircle, X, ArrowRight, Lightbulb } from 'lucide-react'
import { CameraFrame } from '@/components/camera/CameraFrame'
import { DocCaptureOverlay } from '@/components/camera/DocCaptureOverlay'
import { DocCaptureInstruction } from '@/components/camera/DocCaptureInstruction'
import { ShutterButton } from '@/components/camera/ShutterButton'
import { Button } from '@/components/primitives/Button'
import { useDocQuality } from '@/hooks/useDocQuality'
import { DOC_LABEL, docCapture } from '@/lib/content'
import type { DocType, DocIssueType, ErrorType } from '@/lib/types'

/** Map the current doc-quality issue to the most relevant retry error type */
function issueToErrorType(issue: DocIssueType | null): ErrorType {
  if (issue === 'glare') return 'glare'
  if (issue === 'partial' || issue === 'too_far') return 'partial'
  return 'blur' // too_dark, blur, or no active issue
}

// ── Review panel ──────────────────────────────────────────────────────────────

function ReviewPanel({
  docLabel,
  sideLabel,
  previewSrc,
  onConfirm,
  onRetake,
}: {
  docLabel: string
  sideLabel: string
  previewSrc: string | null
  onConfirm: () => void
  onRetake: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Scrollable preview content */}
      <div className="screen-scroll" style={{ padding: '16px 24px 0' }}>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--ink-1)', margin: '0 0 4px' }}>
            Does this look sharp?
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0 }}>
            {docLabel} · {sideLabel} — all four corners should be clear.
          </p>
        </motion.div>

        {/* Photo preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 24 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0 12px' }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 320,
              aspectRatio: '1.586 / 1',
              borderRadius: 12,
              overflow: 'hidden',
              border: '2px solid var(--success)',
              boxShadow: '0 0 0 5px var(--success-muted)',
              position: 'relative',
              background: 'linear-gradient(145deg, #1a2540 0%, #0d1525 100%)',
            }}
          >
            {previewSrc ? (
              // Actual image from upload
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt="Captured document"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              // Simulated capture preview
              <>
                <div style={{
                  position: 'absolute', inset: 0, opacity: 0.04,
                  background: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 0,transparent 18px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 18px)',
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: 'rgba(0,179,125,0.22)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckCircle size={22} style={{ color: 'var(--success)' }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)' }}>
                    Photo captured
                  </p>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Quality chips */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ display: 'flex', justifyContent: 'center', gap: 14, paddingBottom: 16 }}
        >
          {['Corners visible', 'Text sharp', 'No glare'].map((label) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <CheckCircle size={11} style={{ color: 'var(--success)' }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-3)' }}>{label}</span>
            </div>
          ))}
        </motion.div>

      </div>

      {/* Sticky action footer */}
      <motion.div
        className="screen-footer"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        style={{ borderTop: '1px solid var(--border-1)', display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <Button onClick={onConfirm} icon={<ArrowRight size={15} />}>
          Use this photo
        </Button>
        <Button variant="ghost" onClick={onRetake} iconLeading={<RotateCcw size={14} />}>
          Retake
        </Button>
      </motion.div>

    </div>
  )
}

// ── Nudge banner (shown when stuck scanning > 9s) ─────────────────────────────

function StuckNudge({ onDismiss, onForceCapture }: { onDismiss: () => void; onForceCapture: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: [0.34, 1.22, 0.64, 1] }}
      style={{
        margin: '0 24px 12px',
        padding: '12px 14px',
        borderRadius: 12,
        background: 'var(--accent-muted)',
        border: '1px solid var(--border-2)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
      }}
    >
      <Lightbulb size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} strokeWidth={2} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', lineHeight: 1.3 }}>
          Taking a bit longer than usual
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.45 }}>
          Try laying the document flat on a table with good overhead light.
        </p>
        <button
          onClick={onForceCapture}
          style={{
            fontSize: 12, fontWeight: 600, color: 'var(--accent)',
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          Capture anyway →
        </button>
      </div>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--ink-3)', flexShrink: 0 }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

type Phase = 'scanning' | 'review'

const STUCK_THRESHOLD_MS = 9000

export function DocCaptureScreen({
  side,
  docType,
  onCapture,
  onRetry,
}: {
  side: 'front' | 'back'
  docType: DocType
  onCapture: () => void
  onRetry: (e: ErrorType) => void
}) {
  const [phase, setPhase] = useState<Phase>('scanning')
  const [scanActive, setScanActive] = useState(true)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [showNudge, setShowNudge] = useState(false)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objUrlRef = useRef<string | null>(null)

  const { activeIssue, allClear, autoCaptureProgress, reset } = useDocQuality(scanActive)

  // Auto-capture when the progress ring completes
  useEffect(() => {
    if (autoCaptureProgress >= 1 && phase === 'scanning') {
      setScanActive(false)
      setPhase('review')
    }
  }, [autoCaptureProgress, phase])

  // Show nudge after STUCK_THRESHOLD_MS if still scanning
  useEffect(() => {
    if (!scanActive || nudgeDismissed) return
    const t = setTimeout(() => setShowNudge(true), STUCK_THRESHOLD_MS)
    return () => clearTimeout(t)
  }, [scanActive, nudgeDismissed])

  // Revoke object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current)
    }
  }, [])

  // Manual shutter tap — fires immediately when allClear, or force-captures
  const handleManualCapture = useCallback(() => {
    if (phase !== 'scanning') return
    setScanActive(false)
    setPhase('review')
  }, [phase])

  // Force capture from nudge (even if quality checks haven't all passed)
  function handleForceCapture() {
    setScanActive(false)
    setShowNudge(false)
    setPhase('review')
  }

  // Upload from gallery
  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Revoke any previous object URL
    if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current)
    const url = URL.createObjectURL(file)
    objUrlRef.current = url
    setPreviewSrc(url)
    setScanActive(false)
    setPhase('review')
    // Reset the input so the same file can be re-selected after retake
    e.target.value = ''
  }

  function handleRetake() {
    if (objUrlRef.current) {
      URL.revokeObjectURL(objUrlRef.current)
      objUrlRef.current = null
    }
    setPreviewSrc(null)
    setShowNudge(false)
    setNudgeDismissed(false)
    reset()
    setPhase('scanning')
    setScanActive(true)
  }

  const docLabel = DOC_LABEL[docType] ?? 'Document'
  const sideLabel = side === 'front' ? 'Front side' : 'Back side'
  const isBack = side === 'back'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Hidden file input */}
      {/* No capture="environment" — lets user choose between camera and gallery on iOS */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <AnimatePresence mode="wait">
        {phase === 'review' ? (

          // ── Review phase ────────────────────────────────────────────────────
          <motion.div
            key="review"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
          >
            <ReviewPanel
              docLabel={docLabel}
              sideLabel={sideLabel}
              previewSrc={previewSrc}
              onConfirm={onCapture}
              onRetake={handleRetake}
            />
          </motion.div>

        ) : (

          // ── Scanning phase ──────────────────────────────────────────────────
          <motion.div
            key="scan"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
          >
            {/* Header */}
            <div style={{ padding: '4px 24px 10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {isBack && (
                  <FlipHorizontal size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                )}
                <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-1)', margin: 0 }}>
                  {isBack ? docCapture.back.heading : docCapture.front.heading}
                </h2>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={allClear ? 'ready' : activeIssue ?? 'scanning'}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    fontSize: 12,
                    color: allClear ? 'var(--success)' : 'var(--ink-2)',
                    margin: '3px 0 0',
                    fontWeight: allClear ? 500 : 400,
                  }}
                >
                  {allClear
                    ? 'Looks great — auto-capturing…'
                    : 'Position your document inside the frame'}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Stuck nudge (shown after 9s) */}
            <AnimatePresence>
              {showNudge && !nudgeDismissed && (
                <StuckNudge
                  onDismiss={() => { setShowNudge(false); setNudgeDismissed(true) }}
                  onForceCapture={handleForceCapture}
                />
              )}
            </AnimatePresence>

            {/* Camera viewport */}
            <CameraFrame style={{ flex: 1 }} minHeight={260}>

              {/* Overlay: corners + per-issue effects */}
              <DocCaptureOverlay activeIssue={activeIssue} allClear={allClear} />

              {/* Instruction banner — anchored to bottom of camera */}
              <DocCaptureInstruction activeIssue={activeIssue} allClear={allClear} />

            </CameraFrame>

            {/* Controls bar */}
            <div style={{
              padding: '14px 24px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              position: 'relative',
              flexShrink: 0,
            }}>

              {/* Upload button (left of shutter) */}
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleUploadClick}
                title="Upload a photo instead"
                aria-label="Upload a photo from your gallery"
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: 'var(--surface-1)',
                  border: '1.5px solid var(--border-2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Upload size={16} style={{ color: 'var(--ink-2)' }} />
              </motion.button>

              {/* Shutter */}
              <ShutterButton
                allClear={allClear}
                progress={autoCaptureProgress}
                onCapture={handleManualCapture}
              />

              {/* Spacer to balance layout */}
              <div style={{ width: 42 }} />
            </div>

            {/* Secondary labels — 44px tap targets, safe area bottom */}
            <div style={{
              padding: '0 24px',
              paddingBottom: 'max(10px, env(safe-area-inset-bottom, 0px))',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0,
            }}>
              <button
                onClick={handleUploadClick}
                style={{
                  fontSize: 11, color: 'var(--ink-3)', background: 'none',
                  border: 'none', cursor: 'pointer',
                  minHeight: 44, padding: '0 4px',
                  display: 'flex', alignItems: 'center',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Upload instead
              </button>
              <button
                onClick={() => onRetry(issueToErrorType(activeIssue))}
                style={{
                  fontSize: 11, color: 'var(--ink-3)', background: 'none',
                  border: 'none', cursor: 'pointer',
                  minHeight: 44, padding: '0 4px',
                  display: 'flex', alignItems: 'center',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                Having trouble?
              </button>
            </div>
          </motion.div>

        )}
      </AnimatePresence>
    </div>
  )
}
