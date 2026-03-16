'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useTheme } from '@/components/layout/ThemeProvider'
import type { StepInfo } from '@/lib/types'

interface VerifyShellProps {
  children: React.ReactNode
  progress: number
  stepInfo: StepInfo | null
  showProgress: boolean
  showBack: boolean
  onBack: () => void
}

// ── Brand mark ────────────────────────────────────────────────────────────────

function ClarityLogoMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <path d="M39.48 16.28L32.35 0L27.81 10.48L33.1 22.71L45.23 28.05L55.63 23.47L39.48 16.28Z" fill="var(--accent)" />
      <path d="M39.48 39.81L55.62 32.62L45.24 28.05L33.11 33.38L27.81 45.62L32.35 56.1L39.48 39.81Z" fill="var(--accent)" />
      <path d="M16.15 39.82L23.28 56.1L27.82 45.62L22.53 33.39L10.4 28.05L0 32.62L16.15 39.82Z" fill="var(--accent)" />
      <path d="M16.15 16.28L0 23.48L10.39 28.05L22.52 22.71L27.81 10.48L23.28 0L16.15 16.28Z" fill="var(--accent)" />
    </svg>
  )
}

/** Monogram initial(s) in a rounded square — used by white-label clients */
function InitialsMark({ initials, size = 28 }: { initials: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 'var(--radius-sm)',
        background: 'var(--accent)',
        color: 'var(--accent-on)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        letterSpacing: '-0.5px',
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

/** Renders either the built-in Clarity SVG or a client initials monogram */
function BrandMark({ size = 16 }: { size?: number }) {
  const { brand } = useTheme()
  if (brand.logoMark === 'clarity') return <ClarityLogoMark size={size} />
  return <InitialsMark initials={brand.logoMark.initials} size={size + 12} />
}

// ── Progress indicator ────────────────────────────────────────────────────────

function StepProgressBar({
  value,
  stepInfo,
}: {
  value: number
  stepInfo: StepInfo | null
}) {
  const { progress: p } = useTheme()

  if (p.style === 'dots') {
    // Dot-style: one dot per step, active dot stretches into a pill.
    // If stepInfo is null (guidance/welcome screens) we don't have a reliable
    // step count, so hide the indicator rather than show a misleading single dot.
    if (!stepInfo) return null

    const total  = stepInfo.total
    const active = stepInfo.step - 1

    return (
      <div
        role="progressbar"
        aria-valuenow={stepInfo?.step ?? 1}
        aria-valuemin={1}
        aria-valuemax={total}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
      >
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === active
          return (
            <motion.div
              key={i}
              animate={{
                width: isActive ? 20 : `var(--cv-progress-height, 8px)`,
                background: isActive
                  ? 'var(--cv-progress-active, var(--accent))'
                  : 'var(--cv-progress-track, var(--border-1))',
              }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              style={{
                height: 'var(--cv-progress-height, 8px)',
                borderRadius: 9999,
              }}
            />
          )
        })}
      </div>
    )
  }

  // Default: bar style
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        height: 'var(--cv-progress-height, 3px)',
        borderRadius: 9999,
        overflow: 'hidden',
        background: 'var(--cv-progress-track, var(--border-1))',
      }}
    >
      <motion.div
        style={{ height: '100%', borderRadius: 9999, background: 'var(--cv-progress-active, var(--accent))' }}
        initial={false}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
  )
}

export function VerifyShell({
  children,
  progress,
  stepInfo,
  showProgress,
  showBack,
  onBack,
}: VerifyShellProps) {
  const { brand } = useTheme()

  return (
    <div className="verify-shell-outer">
      <div className="verify-card">

        {/* ── Top bar ─────────────────────────────────────────── */}
        {/* Semantic <header> landmark — assistive tech can jump here */}
        <header
          style={{
            paddingTop: 'max(14px, env(safe-area-inset-top, 0px))',
            paddingLeft: 12,
            paddingRight: 12,
            paddingBottom: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flexShrink: 0,
          }}
        >
          {/* Hidden live region — announces step changes to screen readers.
              Kept outside AnimatePresence so it is always in the DOM. */}
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {stepInfo
              ? `Step ${stepInfo.step} of ${stepInfo.total}${stepInfo.label ? `: ${stepInfo.label}` : ''}`
              : `${brand.name} identity verification`}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Back button — 44×44 touch target (Apple HIG / Material minimum) */}
            <div style={{ width: 44, height: 44, flexShrink: 0 }}>
              <AnimatePresence>
                {showBack && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onBack}
                    aria-label="Go back"
                    style={{
                      width: 44,
                      height: 44,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--surface-0)',
                      border: '1px solid var(--border-1)',
                      color: 'var(--ink-2)',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <ChevronLeft size={18} strokeWidth={2.2} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Step label — visual only; the live region above handles screen readers */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                {stepInfo ? (
                  <motion.span
                    key={stepInfo.label}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    aria-hidden="true"
                    style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', letterSpacing: '0.2px' }}
                  >
                    Step {stepInfo.step} of {stepInfo.total}
                    {stepInfo.label ? ` · ${stepInfo.label}` : ''}
                  </motion.span>
                ) : (
                  <motion.div key="logo" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <BrandMark size={16} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-1)' }}>{brand.name}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Logo mark — right, decorative balance element only */}
            <div
              aria-hidden="true"
              style={{
                width: 44,
                height: 44,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-muted)',
              }}
            >
              <BrandMark size={16} />
            </div>
          </div>

          {/* Progress bar / dots */}
          <AnimatePresence>
            {showProgress && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0.95 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <StepProgressBar value={progress} stepInfo={stepInfo} />
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* ── Screen content ──────────────────────────────────── */}
        {/*
          <main> landmark — AT can jump directly to verification content.
          overflow:hidden clips the outgoing screen during ScreenMotion transitions.
          Each screen manages its own scroll via .screen-scroll and safe area via .screen-footer.
        */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginTop: 6 }}>
          {children}
        </main>

      </div>
    </div>
  )
}
