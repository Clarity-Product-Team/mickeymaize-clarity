'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { DocIssueType } from '@/lib/types'

// ── Corner bracket ────────────────────────────────────────────────────────────

const CORNER_SIZE = 26
const STROKE = 3.5

function cornerRotate(x: 0 | 1, y: 0 | 1): number {
  // top-left=0°, top-right=90°, bottom-right=180°, bottom-left=270°
  return (y === 0 ? x : 3 - x) * 90
}

function CornerBracket({
  x, y, color, pulse = false,
}: {
  x: 0 | 1
  y: 0 | 1
  color: string
  pulse?: boolean
}) {
  const rotate = cornerRotate(x, y)

  return (
    <motion.div
      style={{
        position: 'absolute',
        ...(y === 0 ? { top: -3 } : { bottom: -3 }),
        ...(x === 0 ? { left: -3 } : { right: -3 }),
      }}
      animate={pulse ? { opacity: [1, 0.25, 1] } : { opacity: 1 }}
      transition={pulse ? { duration: 0.65, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
    >
      <svg width={CORNER_SIZE} height={CORNER_SIZE} viewBox="0 0 22 22" aria-hidden="true">
        <path
          d="M2 10 L2 2 L10 2"
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          style={{ transform: `rotate(${rotate}deg)`, transformOrigin: 'center' }}
        />
      </svg>
    </motion.div>
  )
}

// ── Overlay ───────────────────────────────────────────────────────────────────

interface DocCaptureOverlayProps {
  activeIssue: DocIssueType | null
  allClear: boolean
}

/**
 * Document capture overlay with corner brackets + per-issue visual effects.
 *
 * Issue effects:
 *   too_dark → dark translucent layer dims the whole frame
 *   too_far  → inward-pulsing arrows around the capture rect
 *   partial  → top-right corner bracket pulses red + ambient glow
 *   glare    → bright radial gradient hotspot in top-right
 *   blur     → horizontal shimmer scan line sweeps through the rect
 *   allClear → green brackets + pulsing success fill
 */
export function DocCaptureOverlay({ activeIssue, allClear }: DocCaptureOverlayProps) {
  const cornerColor = (corner: 'tl' | 'tr' | 'bl' | 'br'): string => {
    if (allClear) return 'var(--success)'
    if (activeIssue === 'partial' && (corner === 'tr')) return '#F87171'
    if (activeIssue === 'too_dark') return 'rgba(255,255,255,0.25)'
    return 'rgba(255,255,255,0.62)'
  }

  const borderColor = allClear
    ? 'var(--success)'
    : activeIssue === 'partial'
      ? 'rgba(248,113,113,0.45)'
      : activeIssue === 'too_dark'
        ? 'rgba(255,255,255,0.18)'
        : 'rgba(255,255,255,0.28)'

  return (
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
      {/* ── too_dark: darkening layer ────────────────────────────────────── */}
      <AnimatePresence>
        {activeIssue === 'too_dark' && (
          <motion.div
            key="dark"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,8,0.48)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── glare: bright hotspot in top-right ──────────────────────────── */}
      <AnimatePresence>
        {activeIssue === 'glare' && (
          <motion.div
            key="glare"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute', inset: 0,
              background:
                'radial-gradient(ellipse 48% 44% at 75% 24%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.2) 38%, transparent 68%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Capture rectangle ────────────────────────────────────────────── */}
      <motion.div
        animate={{
          scale: activeIssue === 'too_far' ? [1, 0.93, 1] : 1,
        }}
        transition={
          activeIssue === 'too_far'
            ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.4 }
        }
        style={{
          position: 'relative',
          width: '86%',
          maxWidth: 340,
          aspectRatio: '1.586 / 1',
        }}
      >
        {/* Dashed border */}
        <motion.div
          animate={{ borderColor }}
          transition={{ duration: 0.4 }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 10,
            border: `1.5px dashed ${borderColor}`,
          }}
        />

        {/* allClear: glowing box shadow */}
        <AnimatePresence>
          {allClear && (
            <motion.div
              key="glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: -4,
                borderRadius: 14,
                boxShadow: '0 0 0 3px rgba(0,179,125,0.4)',
              }}
            />
          )}
        </AnimatePresence>

        {/* Four corner brackets */}
        <CornerBracket x={0} y={0} color={cornerColor('tl')} />
        <CornerBracket x={1} y={0} color={cornerColor('tr')} pulse={activeIssue === 'partial'} />
        <CornerBracket x={1} y={1} color={cornerColor('br')} />
        <CornerBracket x={0} y={1} color={cornerColor('bl')} />

        {/* ── too_far: inward arrows ──────────────────────────────────── */}
        <AnimatePresence>
          {activeIssue === 'too_far' && (
            <motion.div
              key="arrows"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0 }}
            >
              {/* left */}
              <motion.svg
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                width={16} height={24} viewBox="0 0 16 24" fill="none"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path d="M12 4L4 12L12 20" stroke="rgba(96,165,250,0.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
              {/* right */}
              <motion.svg
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
                width={16} height={24} viewBox="0 0 16 24" fill="none"
                animate={{ x: [0, -5, 0] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <path d="M4 4L12 12L4 20" stroke="rgba(96,165,250,0.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
              {/* top */}
              <motion.svg
                style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)' }}
                width={24} height={16} viewBox="0 0 24 16" fill="none"
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut', delay: 0.12 }}
              >
                <path d="M4 12L12 4L20 12" stroke="rgba(96,165,250,0.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
              {/* bottom */}
              <motion.svg
                style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)' }}
                width={24} height={16} viewBox="0 0 24 16" fill="none"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut', delay: 0.12 }}
              >
                <path d="M4 4L12 12L20 4" stroke="rgba(96,165,250,0.85)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── partial: ambient glow on cut-off corner ──────────────────── */}
        <AnimatePresence>
          {activeIssue === 'partial' && (
            <motion.div
              key="partial"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.35, 0.9, 0.35] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.85, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                top: -2, right: -2,
                width: 52, height: 48,
                borderRadius: '0 10px 0 0',
                background: 'rgba(248,113,113,0.28)',
              }}
            />
          )}
        </AnimatePresence>

        {/* ── blur: sweeping shimmer line ──────────────────────────────── */}
        <AnimatePresence>
          {activeIssue === 'blur' && (
            <motion.div
              key="blur-shimmer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 10 }}
            >
              <motion.div
                animate={{ top: ['18%', '82%', '18%'] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  left: 0, right: 0,
                  height: 2,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 40%, rgba(255,255,255,0.55) 60%, transparent 100%)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── allClear: success fill pulse ─────────────────────────────── */}
        <AnimatePresence>
          {allClear && (
            <motion.div
              key="success-fill"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.16, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1.4 }}
              style={{
                position: 'absolute', inset: 0,
                borderRadius: 10,
                background: 'var(--success)',
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
