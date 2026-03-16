'use client'

import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { ProgressBar } from '@/components/primitives/ProgressBar'

interface VerifyShellProps {
  children: React.ReactNode
  progress: number
  showProgress: boolean
  showBack: boolean
  onBack: () => void
}

/** Logo mark SVG — same icon used across the shell. */
function LogoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 56 56" fill="none" aria-label="Clarity Verify">
      <path d="M39.48 16.28L32.35 0L27.81 10.48L33.1 22.71L45.23 28.05L55.63 23.47L39.48 16.28Z" fill="var(--accent)" />
      <path d="M39.48 39.81L55.62 32.62L45.24 28.05L33.11 33.38L27.81 45.62L32.35 56.1L39.48 39.81Z" fill="var(--accent)" />
      <path d="M16.15 39.82L23.28 56.1L27.82 45.62L22.53 33.39L10.4 28.05L0 32.62L16.15 39.82Z" fill="var(--accent)" />
      <path d="M16.15 16.28L0 23.48L10.39 28.05L22.52 22.71L27.81 10.48L23.28 0L16.15 16.28Z" fill="var(--accent)" />
    </svg>
  )
}

/**
 * Mobile-first verification shell.
 * - Max-width 430px, centered horizontally on desktop.
 * - Top bar: back button | progress bar | logo.
 * - Content fills remaining height.
 */
export function VerifyShell({
  children,
  progress,
  showProgress,
  showBack,
  onBack,
}: VerifyShellProps) {
  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'var(--surface-0)',
      }}
    >
      {/* Mobile shell */}
      <div
        style={{
          width: '100%',
          maxWidth: 430,
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-1)',
          boxShadow: '0 0 0 1px var(--border-1), var(--shadow-sm)',
          position: 'relative',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '18px 16px 12px',
            gap: 12,
            minHeight: 60,
          }}
        >
          {/* Back button — always reserves space to prevent layout shift */}
          <div style={{ width: 36, height: 36, flexShrink: 0 }}>
            {showBack && (
              <motion.button
                onClick={onBack}
                whileTap={{ scale: 0.92 }}
                transition={{ duration: 0.1 }}
                aria-label="Go back"
                style={{
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-0)',
                  border: '1px solid var(--border-1)',
                  color: 'var(--ink-2)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <ChevronLeft size={18} strokeWidth={2.2} />
              </motion.button>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ flex: 1 }}>
            {showProgress && <ProgressBar value={progress} />}
          </div>

          {/* Logo mark */}
          <div
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-muted)',
              flexShrink: 0,
            }}
          >
            <LogoMark />
          </div>
        </div>

        {/* Screen content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {children}
        </div>

        {/* Bottom safe area */}
        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
