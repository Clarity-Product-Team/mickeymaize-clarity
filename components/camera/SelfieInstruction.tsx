'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { selfieInstruction } from '@/lib/content'
import type { FaceIssueType } from '@/lib/types'

// ── SVG icons ─────────────────────────────────────────────────────────────────

function CrosshairIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
    </svg>
  )
}

function ZoomInIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

function ZoomOutIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function GlassesIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="14" r="4" />
      <circle cx="17" cy="14" r="4" />
      <path d="M11 14h2" />
      <path d="M3 14l-2-2" />
      <path d="M21 14l2-2" />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

// ── Issue config ──────────────────────────────────────────────────────────────

interface IssueConfig {
  icon: React.ReactNode
  title: string
  sub: string
  accentColor: string
}

const ISSUE_CONFIGS: Record<FaceIssueType, IssueConfig> = {
  not_centered: {
    icon: <CrosshairIcon />,
    title: 'Center your face',
    sub: 'Look directly at the camera and fill the oval',
    accentColor: 'rgba(255,255,255,0.9)',
  },
  too_far: {
    icon: <ZoomInIcon />,
    title: 'Move a bit closer',
    sub: 'Your face should fill most of the oval',
    accentColor: '#FCD34D',
  },
  low_light: {
    icon: <SunIcon />,
    title: 'Brighter light needed',
    sub: 'Face a window or light source — avoid backlighting',
    accentColor: '#FCD34D',
  },
  glasses_glare: {
    icon: <GlassesIcon />,
    title: 'Glasses causing glare',
    sub: 'Remove your glasses or tilt them slightly down',
    accentColor: '#C084FC',
  },
  too_close: {
    icon: <ZoomOutIcon />,
    title: 'A little further back',
    sub: 'Hold your phone slightly further from your face',
    accentColor: '#FCD34D',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SelfieInstructionProps {
  activeIssue: FaceIssueType | null
  allClear: boolean
}

/**
 * Bottom-of-frame guidance banner for selfie capture.
 * Shows exactly one instruction at a time — calm, specific, actionable.
 * Turns green when all checks pass.
 */
export function SelfieInstruction({ activeIssue, allClear }: SelfieInstructionProps) {
  const cfg = activeIssue ? ISSUE_CONFIGS[activeIssue] : null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: '0 16px 18px',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <AnimatePresence mode="wait">
        {allClear ? (
          <motion.div
            key="clear"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.34, 1.22, 0.64, 1] }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '13px 16px',
              borderRadius: 14,
              background: 'rgba(0, 168, 118, 0.92)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <span style={{ color: '#fff', flexShrink: 0, display: 'flex' }}>
              <CheckCircleIcon />
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>
                {selfieInstruction.allClear.title}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 1.35 }}>
                {selfieInstruction.allClear.sub}
              </p>
            </div>
          </motion.div>

        ) : cfg ? (
          <motion.div
            key={activeIssue}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '13px 16px',
              borderRadius: 14,
              background: 'rgba(8, 8, 18, 0.84)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderLeft: `3px solid ${cfg.accentColor}`,
            }}
          >
            <span style={{ color: cfg.accentColor, flexShrink: 0, display: 'flex' }}>
              {cfg.icon}
            </span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>
                {selfieInstruction[activeIssue!].title}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
                {selfieInstruction[activeIssue!].sub}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
