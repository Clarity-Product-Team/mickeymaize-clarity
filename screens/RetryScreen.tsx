'use client'

import { motion } from 'framer-motion'
import { Camera, Sun, Crop, FileX, CalendarOff, UserX, RotateCcw, MessageCircle, Lightbulb } from 'lucide-react'
import { Button } from '@/components/primitives/Button'
import { ERROR_CONFIGS } from '@/lib/constants'
import { retryCopy, retryActions } from '@/lib/content'
import type { ErrorType } from '@/lib/types'

const RETRY_ICONS: Record<ErrorType, typeof Camera> = {
  blur:          Camera,
  glare:         Sun,
  partial:       Crop,
  wrong_doc:     FileX,
  expired:       CalendarOff,
  face_mismatch: UserX,
}

function ErrorDiagram({ type }: { type: ErrorType }) {
  const c = ERROR_CONFIGS[type].colorVar
  const bg = ERROR_CONFIGS[type].bgVar

  // Blur: document with ghost offset to simulate camera shake
  if (type === 'blur') return (
    <svg width="200" height="116" viewBox="0 0 200 116" fill="none">
      {/* Ghost offset */}
      <rect x="34" y="18" width="132" height="82" rx="7" fill={bg} stroke={c} strokeWidth="1" opacity="0.28"/>
      {/* Main doc */}
      <rect x="30" y="14" width="140" height="88" rx="8" fill={bg} stroke={c} strokeWidth="1.8"/>
      {/* Photo placeholder */}
      <rect x="44" y="26" width="28" height="34" rx="4" fill={c} opacity="0.14" stroke={c} strokeWidth="1"/>
      {/* Content lines + ghost offset */}
      <rect x="80" y="30" width="70" height="5" rx="2.5" fill={c} opacity="0.28"/>
      <rect x="83" y="30" width="70" height="5" rx="2.5" fill={c} opacity="0.1"/>
      <rect x="80" y="40" width="50" height="5" rx="2.5" fill={c} opacity="0.2"/>
      <rect x="83" y="40" width="50" height="5" rx="2.5" fill={c} opacity="0.08"/>
      <rect x="80" y="50" width="60" height="5" rx="2.5" fill={c} opacity="0.2"/>
      <rect x="83" y="50" width="60" height="5" rx="2.5" fill={c} opacity="0.08"/>
      {/* MRZ zone */}
      <rect x="44" y="74" width="112" height="4" rx="2" fill={c} opacity="0.18"/>
      <rect x="44" y="82" width="112" height="4" rx="2" fill={c} opacity="0.18"/>
      {/* Shake motion arrows at corner */}
      <path d="M158 20 L164 14 M164 14 L164 20 M164 14 L158 14" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
    </svg>
  )

  // Glare: document with bright light oval in upper-right corner
  if (type === 'glare') return (
    <svg width="200" height="116" viewBox="0 0 200 116" fill="none">
      <rect x="30" y="14" width="140" height="88" rx="8" fill={bg} stroke={c} strokeWidth="1.8"/>
      {/* Photo placeholder */}
      <rect x="44" y="26" width="28" height="34" rx="4" fill={c} opacity="0.14" stroke={c} strokeWidth="1"/>
      {/* Content lines (partially visible under glare) */}
      <rect x="80" y="30" width="70" height="5" rx="2.5" fill={c} opacity="0.28"/>
      <rect x="80" y="40" width="50" height="5" rx="2.5" fill={c} opacity="0.18"/>
      <rect x="80" y="50" width="60" height="5" rx="2.5" fill={c} opacity="0.18"/>
      <rect x="44" y="74" width="112" height="4" rx="2" fill={c} opacity="0.18"/>
      <rect x="44" y="82" width="112" height="4" rx="2" fill={c} opacity="0.18"/>
      {/* Glare ellipse */}
      <ellipse cx="146" cy="34" rx="30" ry="26" fill="white" opacity="0.72"/>
      <ellipse cx="146" cy="34" rx="22" ry="18" fill="white" opacity="0.6"/>
      <ellipse cx="146" cy="34" rx="12" ry="10" fill="white" opacity="0.55"/>
      {/* Glare border highlight */}
      <ellipse cx="146" cy="34" rx="30" ry="26" stroke={c} strokeWidth="1" opacity="0.35"/>
    </svg>
  )

  // Partial: camera frame + document extending outside
  if (type === 'partial') return (
    <svg width="200" height="116" viewBox="0 0 200 116" fill="none">
      {/* Document that overflows right + bottom */}
      <rect x="30" y="14" width="152" height="96" rx="8" fill={bg} stroke={c} strokeWidth="1.8" strokeDasharray="5 3"/>
      <rect x="44" y="28" width="28" height="34" rx="4" fill={c} opacity="0.14" stroke={c} strokeWidth="1"/>
      <rect x="80" y="32" width="60" height="5" rx="2.5" fill={c} opacity="0.25"/>
      <rect x="80" y="42" width="44" height="5" rx="2.5" fill={c} opacity="0.18"/>
      {/* Camera frame (clip boundary) */}
      <rect x="18" y="8" width="138" height="84" rx="6" fill="none" stroke="var(--ink-1)" strokeWidth="2" opacity="0.55"/>
      {/* Corner markers */}
      <path d="M18 26 L18 8 L36 8" stroke="var(--ink-1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M138 8 L156 8 L156 26" stroke="var(--ink-1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M18 74 L18 92 L36 92" stroke="var(--ink-1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Right edge cut off indicator */}
      <path d="M156 44 L162 38 M162 38 L162 44 M162 38 L156 38" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
      <path d="M94 92 L100 98 M100 98 L100 92 M100 98 L94 98" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
    </svg>
  )

  // Wrong doc: expected passport vs unexpected card shape
  if (type === 'wrong_doc') return (
    <svg width="200" height="116" viewBox="0 0 200 116" fill="none">
      {/* Expected: passport (portrait) */}
      <rect x="28" y="18" width="60" height="80" rx="6" fill="var(--surface-0)" stroke="var(--border-2)" strokeWidth="1.5" strokeDasharray="4 3"/>
      <circle cx="58" cy="44" r="10" stroke="var(--border-2)" strokeWidth="1.2" fill="none"/>
      <rect x="36" y="62" width="44" height="3.5" rx="1.75" fill="var(--border-2)" opacity="0.5"/>
      <rect x="36" y="69" width="30" height="3.5" rx="1.75" fill="var(--border-2)" opacity="0.35"/>
      <rect x="36" y="80" width="44" height="3" rx="1.5" fill="var(--border-2)" opacity="0.3"/>
      <rect x="36" y="86" width="44" height="3" rx="1.5" fill="var(--border-2)" opacity="0.3"/>
      {/* Shown: card (landscape) — wrong type */}
      <rect x="106" y="32" width="70" height="46" rx="6" fill={bg} stroke={c} strokeWidth="1.8"/>
      <circle cx="124" cy="48" r="7" stroke={c} strokeWidth="1.2" fill="none" opacity="0.5"/>
      <rect x="136" y="44" width="30" height="3.5" rx="1.75" fill={c} opacity="0.28"/>
      <rect x="136" y="51" width="20" height="3.5" rx="1.75" fill={c} opacity="0.2"/>
      <rect x="114" y="62" width="54" height="3" rx="1.5" fill={c} opacity="0.2"/>
      {/* X mark over wrong doc */}
      <path d="M149 24 L163 36 M163 24 L149 36" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )

  // Expired: document with crossed-out validity section
  if (type === 'expired') return (
    <svg width="200" height="116" viewBox="0 0 200 116" fill="none">
      <rect x="30" y="14" width="140" height="88" rx="8" fill={bg} stroke={c} strokeWidth="1.8"/>
      <rect x="44" y="26" width="28" height="34" rx="4" fill={c} opacity="0.14" stroke={c} strokeWidth="1"/>
      <rect x="80" y="30" width="70" height="5" rx="2.5" fill={c} opacity="0.28"/>
      <rect x="80" y="40" width="50" height="5" rx="2.5" fill={c} opacity="0.2"/>
      {/* MRZ zone */}
      <rect x="44" y="74" width="112" height="4" rx="2" fill={c} opacity="0.18"/>
      <rect x="44" y="82" width="112" height="4" rx="2" fill={c} opacity="0.18"/>
      {/* Expiry area highlight */}
      <rect x="80" y="52" width="78" height="16" rx="4" fill={c} opacity="0.18" stroke={c} strokeWidth="1"/>
      {/* Calendar icon inside expiry */}
      <rect x="84" y="55" width="10" height="9" rx="1.5" fill="none" stroke={c} strokeWidth="1" opacity="0.6"/>
      <line x1="84" y1="58" x2="94" y2="58" stroke={c} strokeWidth="1" opacity="0.5"/>
      <line x1="87" y1="54" x2="87" y2="56" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
      <line x1="91" y1="54" x2="91" y2="56" stroke={c} strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
      {/* Strikethrough over expiry */}
      <line x1="80" y1="52" x2="158" y2="68" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )

  // Face mismatch: document photo face vs selfie face with disconnect
  return (
    <svg width="200" height="116" viewBox="0 0 200 116" fill="none">
      {/* Document chip (left) */}
      <rect x="18" y="28" width="64" height="60" rx="6" fill={bg} stroke={c} strokeWidth="1.5"/>
      {/* Photo oval inside doc */}
      <ellipse cx="50" cy="52" rx="16" ry="18" fill={c} opacity="0.15" stroke={c} strokeWidth="1.2"/>
      {/* Simple face inside oval */}
      <circle cx="50" cy="46" r="5" fill={c} opacity="0.3"/>
      <path d="M42 57 Q50 63 58 57" stroke={c} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5"/>
      {/* Selfie oval (right) */}
      <ellipse cx="150" cy="58" rx="28" ry="34" fill={bg} stroke={c} strokeWidth="1.8"/>
      {/* Simple face in selfie */}
      <circle cx="150" cy="48" r="9" fill={c} opacity="0.2"/>
      <path d="M138 64 Q150 72 162 64" stroke={c} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.4"/>
      {/* Disconnect line with X */}
      <line x1="84" y1="58" x2="108" y2="58" stroke="var(--border-2)" strokeWidth="1.5" strokeDasharray="3 3"/>
      <path d="M94 52 L102 64 M102 52 L94 64" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function RetryScreen({
  errorType,
  onRetry,
  onChangeDoc,
}: {
  errorType: ErrorType
  onRetry: () => void
  /** Only provided for wrong_doc — navigates back to document selection */
  onChangeDoc?: () => void
}) {
  const colors = ERROR_CONFIGS[errorType]
  const copy = retryCopy[errorType]
  const isWrongDoc = errorType === 'wrong_doc'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Scrollable content */}
      <div className="screen-scroll" style={{ padding: '8px 24px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>

        {/* Icon */}
        <motion.div style={{ display: 'flex', justifyContent: 'center' }}
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 180, damping: 18 }}>
          {(() => {
            const Icon = RETRY_ICONS[errorType]
            return (
              <div style={{
                width: 68, height: 68, borderRadius: 'var(--radius-xl)',
                background: colors.bgVar,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={28} style={{ color: colors.colorVar }} strokeWidth={1.6} />
              </div>
            )
          })()}
        </motion.div>

        {/* Title — role="alert" announces this immediately when the screen mounts */}
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          style={{ textAlign: 'center' }}
        >
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--ink-1)', margin: '0 0 8px' }}>
            {copy.title}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: 0, lineHeight: 1.55 }}>
            {copy.description}
          </p>
        </motion.div>

        {/* Diagram — purely visual; error is described in the title and tip above */}
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.24 }}
          style={{ display: 'flex', justifyContent: 'center' }} aria-hidden="true">
          <div style={{ borderRadius: 'var(--radius-lg)', padding: '16px 20px', background: colors.bgVar, overflow: 'hidden' }}>
            <ErrorDiagram type={errorType} />
          </div>
        </motion.div>

        {/* Tip */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--warning-muted)', borderLeft: '3px solid var(--warning)' }}>
          <Lightbulb size={14} style={{ color: 'var(--warning)', marginTop: 1, flexShrink: 0 }} strokeWidth={2} />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            {copy.tip}
          </p>
        </motion.div>

      </div>

      {/* Sticky actions footer */}
      <motion.div
        className="screen-footer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ borderTop: '1px solid var(--border-1)', display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {isWrongDoc && onChangeDoc ? (
          <>
            <Button onClick={onChangeDoc} iconLeading={<RotateCcw size={14} />}>
              Change document
            </Button>
            <Button variant="ghost" onClick={onRetry}>
              Try again with same document
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onRetry} iconLeading={<RotateCcw size={14} />}>
              {retryActions.tryAgain}
            </Button>
            <Button variant="ghost" onClick={() => alert('Manual review — integrate your support flow')} iconLeading={<MessageCircle size={14} />}>
              {retryActions.getHelp}
            </Button>
          </>
        )}
      </motion.div>

    </div>
  )
}
