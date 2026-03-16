'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, CheckCircle, RotateCcw } from 'lucide-react'
import { CameraFrame } from '@/components/camera/CameraFrame'
import { DocumentOverlay } from '@/components/camera/DocumentOverlay'
import { QualityIndicator } from '@/components/camera/QualityIndicator'
import { Button } from '@/components/primitives/Button'
import { useQualitySimulation } from '@/hooks/useQualitySimulation'
import { DOC_LABEL, QUALITY_CHECKS_DOC } from '@/lib/constants'
import type { DocCaptureScreenProps } from '@/lib/types'

/** Post-capture review — user confirms the photo before advancing. */
function CaptureReviewPanel({
  docLabel,
  sideLabel,
  onConfirm,
  onRetake,
}: {
  docLabel: string
  sideLabel: string
  onConfirm: () => void
  onRetake: () => void
}) {
  const CHECKS = ['All corners visible', 'Text is sharp', 'No glare']

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '12px 24px 0' }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22 }}
    >
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h2 className="t-h3" style={{ color: 'var(--ink-1)', margin: '0 0 4px' }}>
          Check your photo
        </h2>
        <p className="t-sm" style={{ color: 'var(--ink-2)', margin: 0 }}>
          Make sure your {docLabel} ({sideLabel}) is clear with all corners visible.
        </p>
      </motion.div>

      {/* Simulated captured photo */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 340,
            aspectRatio: '1.586 / 1',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '2px solid var(--success)',
            boxShadow: '0 0 0 4px var(--success-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle texture */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.06,
              background: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
              backgroundSize: '12px 12px',
            }}
          />
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0,179,125,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <CheckCircle size={20} style={{ color: 'var(--success)' }} />
          </div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.65)', position: 'relative' }}>
            Photo captured
          </p>
        </div>
      </motion.div>

      {/* Quality checklist */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ display: 'flex', justifyContent: 'center', gap: 16, paddingBottom: 16 }}
      >
        {CHECKS.map((label) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={12} style={{ color: 'var(--success)' }} />
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-3)' }}>{label}</span>
          </div>
        ))}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        <Button onClick={onConfirm} icon={<CheckCircle size={15} />}>
          Looks good — continue
        </Button>
        <Button variant="ghost" onClick={onRetake} iconLeading={<RotateCcw size={14} />}>
          Retake photo
        </Button>
      </motion.div>
    </motion.div>
  )
}

type CapturePhase = 'scanning' | 'review'

export function DocCaptureScreen({ side, docType, onCapture, onRetry }: DocCaptureScreenProps) {
  const [phase, setPhase] = useState<CapturePhase>('scanning')
  const [scanActive, setScanActive] = useState(true)

  const { checks, quality, allGood, reset } = useQualitySimulation(
    QUALITY_CHECKS_DOC,
    scanActive,
  )

  // Auto-capture once all quality checks pass
  useEffect(() => {
    if (!allGood || phase !== 'scanning') return
    const t = setTimeout(() => {
      setScanActive(false)
      setPhase('review')
    }, 700)
    return () => clearTimeout(t)
  }, [allGood, phase])

  function handleRetake() {
    reset()
    setPhase('scanning')
    setScanActive(true)
  }

  const docLabel = DOC_LABEL[docType] ?? 'Document'
  const sideLabel = side === 'front' ? 'front side' : 'back side'

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {phase === 'review' ? (
          <CaptureReviewPanel
            key="review"
            docLabel={docLabel}
            sideLabel={sideLabel}
            onConfirm={onCapture}
            onRetake={handleRetake}
          />
        ) : (
          <motion.div
            key="scanning"
            style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Header */}
            <div style={{ padding: '4px 24px 10px' }}>
              <h2 className="t-h3" style={{ color: 'var(--ink-1)', margin: '0 0 2px' }}>
                {docLabel} — {side === 'front' ? 'Front side' : 'Back side'}
              </h2>
              <p className="t-caption" style={{ color: 'var(--ink-2)', margin: 0 }}>
                Position your document within the frame
              </p>
            </div>

            {/* Camera */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <CameraFrame style={{ flex: 1, minHeight: 260 }}>
                {/* Quality chips */}
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ display: 'flex', justifyContent: 'center', padding: '20px 16px 0' }}
                >
                  <QualityIndicator checks={checks} />
                </motion.div>

                {/* Document frame overlay */}
                <DocumentOverlay quality={quality} total={QUALITY_CHECKS_DOC.length} />

                {/* Scan line */}
                {scanActive && !allGood && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      left: '6%',
                      right: '6%',
                      height: 2,
                      borderRadius: 'var(--radius-full)',
                      background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                      pointerEvents: 'none',
                    }}
                    animate={{ top: ['30%', '68%', '30%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </CameraFrame>

              {/* Shutter button */}
              <div style={{ padding: '16px 24px 4px', display: 'flex', justifyContent: 'center' }}>
                <motion.button
                  whileTap={allGood ? { scale: 0.93 } : {}}
                  onClick={
                    allGood
                      ? () => { setScanActive(false); setPhase('review') }
                      : undefined
                  }
                  aria-label="Capture document"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 'var(--radius-full)',
                    background: allGood ? 'var(--accent)' : 'var(--border-1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: allGood ? 1 : 0.5,
                    cursor: allGood ? 'pointer' : 'default',
                    transition: 'all 300ms ease',
                    border: 'none',
                    outline: 'none',
                  }}
                >
                  <Camera size={22} color={allGood ? '#fff' : 'var(--ink-3)'} />
                </motion.button>
              </div>

              {/* Trouble link */}
              <div style={{ paddingBottom: 4, textAlign: 'center' }}>
                <button
                  onClick={() => onRetry('blur')}
                  style={{ fontSize: 13, color: 'var(--ink-3)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Having trouble? See help
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
