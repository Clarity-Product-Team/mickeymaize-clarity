'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { FaceIssueType } from '@/lib/types'

interface FaceOverlayProps {
  /** Current face quality issue, or null when clear */
  faceIssue?: FaceIssueType | null
  /** True when all quality checks pass (selfie) */
  allGood?: boolean
  /** True immediately after capture — triggers success flash */
  captured?: boolean
  /** 0.0–1.0 progress for the liveness arc */
  livenessProgress?: number
  /** Show the animated arc (liveness mode) */
  showArc?: boolean
}

/**
 * Face oval overlay for selfie and liveness capture.
 *
 * Uses SVG mask for the surrounding dark area + clipPath for inner effects.
 * Oval stroke color and inner effects respond to the current faceIssue:
 *
 *   not_centered  → white stroke + 4 centering tick marks
 *   too_far       → dashed amber stroke + "move closer" cue
 *   too_close     → pulsing amber ring outside the oval
 *   low_light     → dim white stroke + dark inner fill
 *   glasses_glare → purple stroke + bright eye-level hotspot
 *   allGood       → green stroke + subtle fill shimmer
 *   captured      → green flash fill
 */
export function FaceOverlay({
  faceIssue = null,
  allGood = false,
  captured = false,
  livenessProgress = 0,
  showArc = false,
}: FaceOverlayProps) {
  const W = 220
  const H = 260
  const cx = W / 2
  const cy = H / 2
  const rx = W * 0.44
  const ry = H * 0.46

  // Ellipse circumference approximation (Ramanujan)
  const a = Math.max(rx, ry)
  const b = Math.min(rx, ry)
  const h = ((a - b) ** 2) / ((a + b) ** 2)
  const arcCircumference = Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)))
  const dashOffset = arcCircumference * (1 - livenessProgress)

  // Oval stroke styling by state
  const strokeColor =
    captured || allGood
      ? 'var(--success)'
      : livenessProgress > 0
        ? 'var(--accent)'
        : faceIssue === 'too_close' || faceIssue === 'too_far'
          ? '#FCD34D'
          : faceIssue === 'glasses_glare'
            ? '#C084FC'
            : faceIssue === 'low_light'
              ? 'rgba(255,255,255,0.32)'
              : 'rgba(255,255,255,0.72)'

  const strokeWidth = captured ? 3.5 : allGood ? 3 : 2.5
  const strokeDash = faceIssue === 'too_far' ? '7 5' : undefined

  return (
    <div
      style={{ position: 'relative', width: W, height: H, flexShrink: 0 }}
      aria-hidden="true"
    >
      {/* ── too_close: pulsing ring outside oval ──────────────────────── */}
      <AnimatePresence>
        {faceIssue === 'too_close' && (
          <motion.div
            key="too-close-ring"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: [0, 0.6, 0], scale: [0.98, 1.06, 0.98] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: -10,
              borderRadius: '50%',
              border: '2px solid #FCD34D',
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
        <defs>
          {/* Outside-oval dark mask */}
          <mask id="face-outside-mask">
            <rect width={W} height={H} fill="white" />
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="black" />
          </mask>

          {/* Inside-oval clip */}
          <clipPath id="face-inner-clip">
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
          </clipPath>
        </defs>

        {/* Surrounding dark overlay */}
        <rect
          width={W}
          height={H}
          fill="rgba(0,0,0,0.40)"
          mask="url(#face-outside-mask)"
        />

        {/* ── Inner effects (clipped to oval) ──────────────────────────── */}
        <g clipPath="url(#face-inner-clip)">

          {/* low_light: dark fill inside the oval */}
          <AnimatePresence>
            {faceIssue === 'low_light' && (
              <motion.rect
                key="low-light"
                width={W} height={H}
                fill="rgba(0,0,12,0.50)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
              />
            )}
          </AnimatePresence>

          {/* glasses_glare: bright ellipse at eye level */}
          <AnimatePresence>
            {faceIssue === 'glasses_glare' && (
              <motion.ellipse
                key="glare"
                cx={cx}
                cy={cy - ry * 0.18}
                rx={rx * 0.52}
                ry={ry * 0.14}
                fill="rgba(255,255,255,0.50)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.85, 0.5] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>

          {/* allGood: subtle green shimmer */}
          <AnimatePresence>
            {allGood && !captured && (
              <motion.rect
                key="good-shimmer"
                width={W} height={H}
                fill="var(--success)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.09, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 0.9 }}
              />
            )}
          </AnimatePresence>

          {/* captured: green flash */}
          <AnimatePresence>
            {captured && (
              <motion.rect
                key="captured-flash"
                width={W} height={H}
                fill="var(--success)"
                initial={{ opacity: 0.28 }}
                animate={{ opacity: [0.28, 0.18, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, repeat: Infinity, repeatDelay: 1.3 }}
              />
            )}
          </AnimatePresence>
        </g>

        {/* ── Oval border ───────────────────────────────────────────────── */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDash}
          style={{
            transition: 'stroke 0.4s ease, stroke-width 0.3s ease',
          }}
        />

        {/* ── not_centered: tick marks at cardinal points ───────────────── */}
        <AnimatePresence>
          {faceIssue === 'not_centered' && (
            <motion.g
              key="ticks"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.45, 0.9, 0.45] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Top */}
              <line x1={cx} y1={cy - ry - 12} x2={cx} y2={cy - ry - 4} stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
              {/* Bottom */}
              <line x1={cx} y1={cy + ry + 4}  x2={cx} y2={cy + ry + 12} stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
              {/* Left */}
              <line x1={cx - rx - 12} y1={cy} x2={cx - rx - 4} y2={cy} stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
              {/* Right */}
              <line x1={cx + rx + 4}  y1={cy} x2={cx + rx + 12} y2={cy} stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round" />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── too_far: inward nudge arrows ─────────────────────────────── */}
        <AnimatePresence>
          {faceIssue === 'too_far' && (
            <motion.g
              key="nudge"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Down arrow at top */}
              <motion.path
                d={`M${cx - 8} ${cy - ry + 22} L${cx} ${cy - ry + 32} L${cx + 8} ${cy - ry + 22}`}
                stroke="#FCD34D"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Up arrow at bottom */}
              <motion.path
                d={`M${cx - 8} ${cy + ry - 22} L${cx} ${cy + ry - 32} L${cx + 8} ${cy + ry - 22}`}
                stroke="#FCD34D"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </motion.g>
          )}
        </AnimatePresence>

        {/* ── Liveness progress arc ────────────────────────────────────── */}
        {showArc && livenessProgress > 0 && (
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            stroke={livenessProgress >= 1 ? 'var(--success)' : 'var(--accent)'}
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeDasharray={arcCircumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 40ms linear, stroke 400ms ease',
              transform: 'rotate(-90deg)',
              transformOrigin: `${cx}px ${cy}px`,
            }}
          />
        )}
      </svg>
    </div>
  )
}
