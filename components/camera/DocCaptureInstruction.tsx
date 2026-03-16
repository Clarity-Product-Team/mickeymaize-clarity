'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { docInstruction } from '@/lib/content'
import type { DocIssueType } from '@/lib/types'

// ── SVG icons (inline to avoid import ambiguity) ──────────────────────────────

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

function CropIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 2 6 16 20 16" />
      <polyline points="2 6 16 6 16 20" />
    </svg>
  )
}

function ZapIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  )
}

function FocusIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M3 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M21 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3" />
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

// ── Issue configs ──────────────────────────────────────────────────────────────

interface IssueConfig {
  icon: React.ReactNode
  title: string
  sub: string
  accentColor: string
}

const ISSUE_CONFIGS: Record<DocIssueType, IssueConfig> = {
  too_dark: {
    icon: <SunIcon />,
    title: 'More light needed',
    sub: 'Move to a brighter spot or turn on a nearby light',
    accentColor: '#FCD34D',
  },
  too_far: {
    icon: <ZoomInIcon />,
    title: 'Move closer',
    sub: 'Fill the frame — bring your document nearer',
    accentColor: '#60A5FA',
  },
  partial: {
    icon: <CropIcon />,
    title: 'Corner out of frame',
    sub: 'Step back until all four edges are visible',
    accentColor: '#F87171',
  },
  glare: {
    icon: <ZapIcon />,
    title: 'Glare detected',
    sub: 'Tilt the document slightly away from the light',
    accentColor: '#C084FC',
  },
  blur: {
    icon: <FocusIcon />,
    title: 'Hold still',
    sub: 'Brace your elbow or rest your hand for a sharper shot',
    accentColor: '#34D399',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

interface DocCaptureInstructionProps {
  activeIssue: DocIssueType | null
  allClear: boolean
}

/**
 * Anchored to the bottom of the camera frame.
 * Shows exactly ONE instruction at a time — the current active issue.
 * Transitions to a green "capturing…" banner when allClear.
 */
export function DocCaptureInstruction({ activeIssue, allClear }: DocCaptureInstructionProps) {
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
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
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
                {docInstruction.allClear.title}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 1.35 }}>
                {docInstruction.allClear.sub}
              </p>
            </div>
          </motion.div>
        ) : cfg ? (
          <motion.div
            key={activeIssue}
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
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
                {docInstruction[activeIssue!].title}
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
                {docInstruction[activeIssue!].sub}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
