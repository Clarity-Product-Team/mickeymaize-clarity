'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Upload, FlipHorizontal, CheckCircle, XCircle, X, ArrowRight, Lightbulb, CameraOff } from 'lucide-react'
import { CameraFrame } from '@/components/camera/CameraFrame'
import { DocCaptureOverlay } from '@/components/camera/DocCaptureOverlay'
import { DocCaptureInstruction } from '@/components/camera/DocCaptureInstruction'
import { ShutterButton } from '@/components/camera/ShutterButton'
import { Button } from '@/components/primitives/Button'
import { useDocQuality } from '@/hooks/useDocQuality'
import { DOC_LABEL, docCapture } from '@/lib/content'
import type { CapturePhase, DocIssueType, DocType, ErrorType } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────────

/** Duration of the 'capturing' flash before transitioning to 'validating'. */
const CAPTURING_DURATION_MS = 380

/** Duration of the simulated 'validating' state before showing the review panel. */
const VALIDATING_DURATION_MS = 820

/** Threshold above which capturePhase switches from good_positioning → hold_steady. */
const HOLD_STEADY_THRESHOLD = 0.68

/** Show the stuck nudge if scanning hasn't succeeded after this many ms. */
const STUCK_THRESHOLD_MS = 9000

// ── Phase → header subtitle ───────────────────────────────────────────────────

function getHeaderStatus(phase: CapturePhase): { text: string; success: boolean; danger: boolean } {
  switch (phase) {
    case 'detecting':        return { text: docCapture.phases.detecting,        success: false, danger: false }
    case 'good_positioning': return { text: docCapture.phases.good_positioning,  success: true,  danger: false }
    case 'hold_steady':      return { text: docCapture.phases.hold_steady,       success: true,  danger: false }
    case 'capturing':        return { text: docCapture.phases.capturing,         success: true,  danger: false }
    case 'validating':       return { text: docCapture.phases.validating,        success: false, danger: false }
    case 'upload_failed':    return { text: docCapture.uploadFailed,             success: false, danger: true  }
    // Issue states — detail is handled by DocCaptureInstruction overlay
    default:                 return { text: docCapture.phases.scanning,          success: false, danger: false }
  }
}

/** Maps DocIssueType to the closest ErrorType for the retry overlay. */
function issueToErrorType(issue: DocIssueType | null): ErrorType {
  if (issue === 'glare') return 'glare'
  if (issue === 'partial' || issue === 'too_far') return 'partial'
  return 'blur'
}

// ── Camera permission denied placeholder ─────────────────────────────────────

function CameraPermissionDenied({
  allowUpload,
  onUploadClick,
}: {
  allowUpload: boolean
  onUploadClick: () => void
}) {
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
          {docCapture.cameraPermissionDenied.heading}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, lineHeight: 1.55 }}>
          {docCapture.cameraPermissionDenied.body}
        </p>
      </div>

      <Button variant="secondary" onClick={() => window.location.reload()}>
        {docCapture.cameraPermissionDenied.reload}
      </Button>

      {allowUpload && (
        <button
          onClick={onUploadClick}
          style={{
            fontSize: 13, color: 'var(--accent)',
            background: 'none', border: 'none',
            cursor: 'pointer', padding: '4px 0',
          }}
        >
          {docCapture.cameraPermissionDenied.upload}
        </button>
      )}
    </motion.div>
  )
}

// ── Validating overlay (inside camera frame) ──────────────────────────────────
//
// Shown during 'capturing' (brief success flash) and 'validating' (spinner).
// In production, 'validating' covers the backend quality-check round-trip.

function ValidatingOverlay({ phase }: { phase: 'capturing' | 'validating' }) {
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
      <AnimatePresence mode="wait">
        {phase === 'capturing' ? (
          <motion.div
            key="captured"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.15, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.34, 1.22, 0.64, 1] }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L20 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#fff' }}>
              {docCapture.phases.capturing}
            </p>
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
              {docCapture.phases.validating}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Image validation ──────────────────────────────────────────────────────────
//
// ValidationResult is the contract between the review panel and the quality
// check layer. Today it is produced by a local stub; in production it will be
// the parsed body of a POST /verify/image-quality response.
//
// Each `checks` entry maps 1-to-1 with a quality chip in the UI. A failing
// entry carries an optional `failReason` string that replaces the chip label
// so the message is specific to what went wrong.

interface ValidationResult {
  ok: boolean
  checks: Array<{
    label: string
    ok: boolean
    /** Short explanation shown when ok=false. Future: populated from backend. */
    failReason?: string
  }>
}

/**
 * Stub validator — always passes.
 *
 * Used as fallback when no `onValidate` prop is provided.
 * Replace the Promise body with a real fetch() call when the backend endpoint
 * is available. The function signature and return type stay unchanged.
 */
function stubValidateImage(): Promise<ValidationResult> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          ok: true,
          checks: docCapture.qualityChips.map((label) => ({ label, ok: true })),
        }),
      1200,
    ),
  )
}

/**
 * Normalises the caller-provided validate result into the internal
 * `ValidationResult` shape. Fills in default quality chips when the caller
 * does not provide granular check data.
 */
function normaliseValidateResult(
  res: { ok: boolean; checks?: Array<{ label: string; ok: boolean; failReason?: string }> },
): ValidationResult {
  return {
    ok: res.ok,
    checks: res.checks ?? docCapture.qualityChips.map((label) => ({ label, ok: res.ok })),
  }
}

// ── Review panel ──────────────────────────────────────────────────────────────
//
// Two internal phases:
//   'checking' — validation stub is running; buttons hidden; spinner visible.
//   'ready'    — result received; chips updated; buttons animate in.
//
// The photo preview is always shown so the user can inspect their image
// independently of the validation result — these are two separate concerns.

function ReviewPanel({
  docLabel,
  sideLabel,
  previewSrc,
  onConfirm,
  onRetake,
  validateFn,
}: {
  docLabel: string
  sideLabel: string
  previewSrc: string | null
  onConfirm: () => void
  onRetake: () => void
  /**
   * Optional async validator. When provided, replaces the local stub.
   * Called once on mount; resolves to pass/fail with optional per-check detail.
   * Production: wraps the mock (or real) service's uploadDocument call.
   */
  validateFn?: () => Promise<{ ok: boolean; checks?: Array<{ label: string; ok: boolean; failReason?: string }> }>
}) {
  const [reviewPhase, setReviewPhase] = useState<'checking' | 'ready'>('checking')
  const [result, setResult] = useState<ValidationResult | null>(null)

  useEffect(() => {
    let cancelled = false
    const runner = validateFn
      ? () => validateFn().then(normaliseValidateResult)
      : stubValidateImage
    runner().then((res) => {
      if (!cancelled) {
        setResult(res)
        setReviewPhase('ready')
      }
    })
    return () => { cancelled = true }
  }, [validateFn])

  const isReady = reviewPhase === 'ready'
  const passed = result?.ok ?? false

  // Border color reflects validation status, not just the photo itself
  const previewBorderColor = isReady
    ? (passed ? 'var(--success)' : 'var(--danger)')
    : 'var(--border-2)'
  const previewShadowColor = isReady
    ? (passed ? 'var(--success-muted)' : 'var(--danger-muted)')
    : 'transparent'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      <div className="screen-scroll" style={{ padding: '16px 24px 0' }}>

        {/* Heading — transitions between checking and result */}
        <AnimatePresence mode="wait">
          <motion.div
            key={reviewPhase}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--ink-1)', margin: '0 0 4px' }}>
              {isReady
                ? (passed ? docCapture.review.heading : 'Let\'s try again')
                : docCapture.review.checkingHeading}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0 }}>
              {docLabel} · {sideLabel}
              {isReady && !passed ? ' — image quality too low' : ''}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Photo preview — always visible; border signals validation state */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 220, damping: 24 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 0 12px' }}
        >
          <div style={{
            width: '100%', maxWidth: 320, aspectRatio: '1.586 / 1',
            borderRadius: 12, overflow: 'hidden',
            border: `2px solid ${previewBorderColor}`,
            boxShadow: `0 0 0 5px ${previewShadowColor}`,
            position: 'relative',
            background: 'linear-gradient(145deg, #1a2540 0%, #0d1525 100%)',
            transition: 'border-color 0.35s ease, box-shadow 0.35s ease',
          }}>
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt="Captured document"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <>
                <div style={{
                  position: 'absolute', inset: 0, opacity: 0.04,
                  background: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 0,transparent 18px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 18px)',
                }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(0,179,125,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

        {/* Quality status — spinner while checking, result chips when ready */}
        <AnimatePresence mode="wait">
          {!isReady ? (
            <motion.div
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, paddingBottom: 16 }}
            >
              <motion.svg
                width="13" height="13" viewBox="0 0 24 24" fill="none"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.9, ease: 'linear', repeat: Infinity }}
              >
                <circle cx="12" cy="12" r="9" stroke="var(--border-2)" strokeWidth="2.5" />
                <path d="M12 3a9 9 0 0 1 9 9" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
              </motion.svg>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {docCapture.review.checkingLabel}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="checks"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ display: 'flex', justifyContent: 'center', gap: 14, paddingBottom: 16 }}
            >
              {result!.checks.map(({ label, ok: checkOk, failReason }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {checkOk
                    ? <CheckCircle size={11} style={{ color: 'var(--success)' }} />
                    : <XCircle size={11} style={{ color: 'var(--danger)' }} />}
                  <span style={{
                    fontSize: 11, fontWeight: 500,
                    color: checkOk ? 'var(--ink-3)' : 'var(--danger)',
                  }}>
                    {checkOk ? label : (failReason ?? label)}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Footer — hidden until validation completes; button set depends on result */}
      <AnimatePresence>
        {isReady && (
          <motion.div
            key="footer"
            className="screen-footer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ borderTop: '1px solid var(--border-1)', display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {passed && (
              <Button onClick={onConfirm} icon={<ArrowRight size={15} />}>
                {docCapture.review.confirm}
              </Button>
            )}
            <Button
              variant={passed ? 'ghost' : 'secondary'}
              onClick={onRetake}
              iconLeading={<RotateCcw size={14} />}
            >
              {docCapture.review.retake}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

// ── Stuck nudge ───────────────────────────────────────────────────────────────

function StuckNudge({ onDismiss, onForceCapture }: { onDismiss: () => void; onForceCapture: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.28, ease: [0.34, 1.22, 0.64, 1] }}
      style={{
        margin: '0 24px 12px', padding: '12px 14px', borderRadius: 12,
        background: 'var(--accent-muted)', border: '1px solid var(--border-2)',
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}
    >
      <Lightbulb size={14} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 1 }} strokeWidth={2} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--ink-1)', lineHeight: 1.3 }}>
          Taking a bit longer than usual
        </p>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.45 }}>
          {docCapture.stuckNudge}
        </p>
        <button
          onClick={onForceCapture}
          style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
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

export function DocCaptureScreen({
  side,
  docType,
  onCapture,
  onRetry,
  allowUpload = true,
  onValidate,
  onRetakeFromReview,
}: {
  side: 'front' | 'back'
  docType: DocType
  onCapture: () => void
  onRetry: (e: ErrorType) => void
  /**
   * Whether the gallery upload fallback is available to this user.
   * Defaults to true to preserve existing behaviour.
   * Production: gated by session config (some compliance flows disallow uploads).
   */
  allowUpload?: boolean
  /**
   * Optional async validator invoked during the review phase.
   * Replaces the local stub when provided.
   * Production: wraps uploadDocument() from the verification service.
   */
  onValidate?: (
    side: 'front' | 'back',
    docType: DocType,
  ) => Promise<{ ok: boolean; checks?: Array<{ label: string; ok: boolean; failReason?: string }> }>
  /**
   * Called when the user taps "Retake" from the review panel (after capture).
   * Distinct from onRetry, which fires for quality errors during scanning.
   * Use this to dispatch the machine RETAKE event from the caller.
   */
  onRetakeFromReview?: () => void
}) {
  // ── Scan phase ──────────────────────────────────────────────────────────
  // 'scanning'   — camera active, quality hook running
  // 'capturing'  — shutter fired, brief success flash
  // 'validating' — simulated quality check (future: backend call)
  // 'review'     — showing the captured image for confirmation
  const [scanPhase, setScanPhase] = useState<'scanning' | 'capturing' | 'validating' | 'review'>('scanning')
  const scanActive = scanPhase === 'scanning'

  // ── Camera permission ────────────────────────────────────────────────────
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false)

  useEffect(() => {
    if (!navigator?.permissions) return
    navigator.permissions
      .query({ name: 'camera' as PermissionName })
      .then((result) => {
        if (result.state === 'denied') setCameraPermissionDenied(true)
        result.onchange = () => setCameraPermissionDenied(result.state === 'denied')
      })
      .catch(() => { /* Permissions API unavailable — don't block the UI */ })
  }, [])

  // ── Brief initializing window ────────────────────────────────────────────
  // Gives the 'detecting' phase a visible moment before quality analysis starts.
  // On retake, a shorter window (300 ms) is used.
  const [isInitializing, setIsInitializing] = useState(true)
  const initTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    initTimerRef.current = setTimeout(() => setIsInitializing(false), 500)
    return () => { if (initTimerRef.current) clearTimeout(initTimerRef.current) }
  }, [])

  // ── Quality hook ─────────────────────────────────────────────────────────
  // Paused during initialization so 'detecting' is visible before issues appear.
  const { activeIssue, allClear, autoCaptureProgress, reset } = useDocQuality(
    scanActive && !isInitializing,
  )

  // ── Upload error ─────────────────────────────────────────────────────────
  const [uploadError, setUploadError] = useState(false)
  const uploadErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Gallery upload ────────────────────────────────────────────────────────
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objUrlRef = useRef<string | null>(null)

  useEffect(() => {
    return () => { if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current) }
  }, [])

  // ── Stuck nudge ──────────────────────────────────────────────────────────
  const [showNudge, setShowNudge] = useState(false)
  const [nudgeDismissed, setNudgeDismissed] = useState(false)

  useEffect(() => {
    if (!scanActive || nudgeDismissed) return
    const t = setTimeout(() => setShowNudge(true), STUCK_THRESHOLD_MS)
    return () => clearTimeout(t)
  }, [scanActive, nudgeDismissed])

  // ── Derived capture phase ─────────────────────────────────────────────────
  // Single source of truth for what the UI is currently communicating.
  // Order matters: explicit state overrides derived quality state.
  const capturePhase = useMemo((): CapturePhase => {
    if (cameraPermissionDenied)                                   return 'camera_denied'
    if (scanPhase === 'capturing')                                 return 'capturing'
    if (scanPhase === 'validating')                                return 'validating'
    if (uploadError)                                               return 'upload_failed'
    if (isInitializing)                                            return 'detecting'
    if (activeIssue)                                               return activeIssue
    if (allClear && autoCaptureProgress >= HOLD_STEADY_THRESHOLD) return 'hold_steady'
    if (allClear)                                                  return 'good_positioning'
    return 'detecting'
  }, [cameraPermissionDenied, scanPhase, uploadError, isInitializing, activeIssue, allClear, autoCaptureProgress])

  // ── Capture transitions: scanning → capturing → validating → review ──────
  const captureTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  function startCapture() {
    captureTimersRef.current.forEach(clearTimeout)
    setScanPhase('capturing')
    captureTimersRef.current = [
      setTimeout(() => setScanPhase('validating'), CAPTURING_DURATION_MS),
      setTimeout(() => setScanPhase('review'),     CAPTURING_DURATION_MS + VALIDATING_DURATION_MS),
    ]
  }

  useEffect(() => {
    return () => { captureTimersRef.current.forEach(clearTimeout) }
  }, [])

  // Auto-capture when progress ring completes
  useEffect(() => {
    if (autoCaptureProgress >= 1 && scanPhase === 'scanning') {
      startCapture()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCaptureProgress, scanPhase])

  const handleManualCapture = useCallback(() => {
    if (scanPhase !== 'scanning') return
    startCapture()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanPhase])

  function handleForceCapture() {
    setShowNudge(false)
    startCapture()
  }

  // ── Upload handlers ──────────────────────────────────────────────────────
  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current)
      const url = URL.createObjectURL(file)
      objUrlRef.current = url
      setPreviewSrc(url)
      setUploadError(false)
      // Uploads go through the same validating stub before review
      setScanPhase('validating')
      captureTimersRef.current.push(
        setTimeout(() => setScanPhase('review'), VALIDATING_DURATION_MS),
      )
    } catch {
      setUploadError(true)
      if (uploadErrorTimerRef.current) clearTimeout(uploadErrorTimerRef.current)
      uploadErrorTimerRef.current = setTimeout(() => setUploadError(false), 3000)
    }
    e.target.value = ''
  }

  // ── Retake ───────────────────────────────────────────────────────────────
  function handleRetake() {
    captureTimersRef.current.forEach(clearTimeout)
    if (objUrlRef.current) {
      URL.revokeObjectURL(objUrlRef.current)
      objUrlRef.current = null
    }
    setPreviewSrc(null)
    setUploadError(false)
    setShowNudge(false)
    setNudgeDismissed(false)
    reset()
    // Brief re-initializing window on retake (shorter than initial load)
    setIsInitializing(true)
    if (initTimerRef.current) clearTimeout(initTimerRef.current)
    initTimerRef.current = setTimeout(() => setIsInitializing(false), 300)
    setScanPhase('scanning')
    // Notify the caller so it can dispatch the machine RETAKE event.
    onRetakeFromReview?.()
  }

  // ── Labels ───────────────────────────────────────────────────────────────
  const docLabel = DOC_LABEL[docType] ?? 'Document'
  const sideLabel = side === 'front' ? 'Front side' : 'Back side'
  const isBack = side === 'back'
  const headerStatus = getHeaderStatus(capturePhase)

  // ── Camera permission blocked ─────────────────────────────────────────────
  if (cameraPermissionDenied) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {allowUpload && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />
        )}
        <CameraPermissionDenied allowUpload={allowUpload} onUploadClick={handleUploadClick} />
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* File input — only rendered when upload is permitted */}
      {allowUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      )}

      <AnimatePresence mode="wait">

        {/* ── Review phase ──────────────────────────────────────────────── */}
        {scanPhase === 'review' ? (
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
              validateFn={onValidate ? () => onValidate(side, docType) : undefined}
            />
          </motion.div>

        ) : (

          /* ── Scanning / capturing / validating ────────────────────────── */
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
              {/* Subtitle transitions with capturePhase — each state gets its own copy */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={capturePhase}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    fontSize: 12, margin: '3px 0 0',
                    fontWeight: headerStatus.success ? 500 : 400,
                    color: headerStatus.success
                      ? 'var(--success)'
                      : headerStatus.danger
                        ? 'var(--danger)'
                        : 'var(--ink-2)',
                  }}
                >
                  {headerStatus.text}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Stuck nudge — only during active scanning */}
            <AnimatePresence>
              {showNudge && !nudgeDismissed && scanPhase === 'scanning' && (
                <StuckNudge
                  onDismiss={() => { setShowNudge(false); setNudgeDismissed(true) }}
                  onForceCapture={handleForceCapture}
                />
              )}
            </AnimatePresence>

            {/* Camera viewport */}
            <CameraFrame style={{ flex: 1 }} minHeight={260}>

              {/* Per-issue visual effects — unchanged */}
              <DocCaptureOverlay activeIssue={activeIssue} allClear={allClear} />

              {/* Issue instruction banner — only during active scanning */}
              {scanPhase === 'scanning' && (
                <DocCaptureInstruction activeIssue={activeIssue} allClear={allClear} />
              )}

              {/* Capturing / validating overlay */}
              <AnimatePresence>
                {(scanPhase === 'capturing' || scanPhase === 'validating') && (
                  <ValidatingOverlay key="validating-overlay" phase={scanPhase} />
                )}
              </AnimatePresence>

            </CameraFrame>

            {/* Controls bar */}
            <div style={{
              padding: '14px 24px 6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 20, position: 'relative', flexShrink: 0,
            }}>
              {/* Upload button — only when allowUpload is true */}
              {allowUpload ? (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleUploadClick}
                  title="Upload a photo instead"
                  aria-label="Upload a photo from your gallery"
                  style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: 'var(--surface-1)', border: '1.5px solid var(--border-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <Upload size={16} style={{ color: 'var(--ink-2)' }} />
                </motion.button>
              ) : (
                <div style={{ width: 42 }} /* spacer keeps shutter centred */ />
              )}

              <ShutterButton
                allClear={allClear && !isInitializing}
                progress={autoCaptureProgress}
                onCapture={handleManualCapture}
                disabled={scanPhase !== 'scanning'}
              />

              <div style={{ width: 42 }} />
            </div>

            {/* Secondary labels row */}
            <div style={{
              padding: '0 24px',
              paddingBottom: 'max(10px, env(safe-area-inset-bottom, 0px))',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexShrink: 0,
            }}>
              {allowUpload ? (
                <button
                  onClick={handleUploadClick}
                  style={{
                    fontSize: 11, color: 'var(--ink-3)', background: 'none',
                    border: 'none', cursor: 'pointer', minHeight: 44, padding: '0 4px',
                    display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {docCapture.uploadLabel}
                </button>
              ) : <div />}

              <button
                onClick={() => onRetry(issueToErrorType(activeIssue))}
                style={{
                  fontSize: 11, color: 'var(--ink-3)', background: 'none',
                  border: 'none', cursor: 'pointer', minHeight: 44, padding: '0 4px',
                  display: 'flex', alignItems: 'center', WebkitTapHighlightColor: 'transparent',
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
