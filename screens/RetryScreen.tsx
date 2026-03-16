'use client'

import { motion } from 'framer-motion'
import { AlertCircle, RotateCcw, Lightbulb } from 'lucide-react'
import { Button } from '@/components/primitives/Button'
import { NoticeBox } from '@/components/primitives/NoticeBox'
import { ERROR_CONFIGS } from '@/lib/constants'
import type { RetryScreenProps, ErrorType } from '@/lib/types'

/** SVG diagram illustrating each error type. */
function ErrorDiagram({ type }: { type: ErrorType }) {
  if (type === 'blur') {
    return (
      <svg width="180" height="110" viewBox="0 0 180 110" fill="none">
        <rect x="20" y="15" width="140" height="80" rx="6" stroke="var(--warning)" strokeWidth="2" strokeDasharray="6 3" fill="var(--warning-muted)" />
        <text x="90" y="50" textAnchor="middle" fill="var(--warning)" fontSize="12" fontWeight="600">Blurry image</text>
        <text x="90" y="68" textAnchor="middle" fill="var(--ink-2)" fontSize="10">Move closer, hold still</text>
      </svg>
    )
  }
  if (type === 'glare') {
    return (
      <svg width="180" height="110" viewBox="0 0 180 110" fill="none">
        <rect x="20" y="15" width="140" height="80" rx="6" stroke="var(--accent)" strokeWidth="2" fill="var(--accent-muted)" />
        <ellipse cx="130" cy="35" rx="28" ry="20" fill="var(--accent)" opacity="0.3" />
        <text x="130" y="38" textAnchor="middle" fill="var(--accent)" fontSize="9" fontWeight="600">Glare</text>
        <text x="75" y="70" textAnchor="middle" fill="var(--ink-2)" fontSize="10">Tilt or move away from light</text>
      </svg>
    )
  }
  if (type === 'partial') {
    return (
      <svg width="180" height="110" viewBox="0 0 180 110" fill="none">
        <rect x="20" y="15" width="140" height="80" rx="6" stroke="var(--border-2)" strokeWidth="2" fill="var(--surface-0)" />
        <rect x="110" y="5" width="80" height="60" rx="4" fill="var(--danger-muted)" stroke="var(--danger)" strokeWidth="2" />
        <text x="150" y="40" textAnchor="middle" fill="var(--danger)" fontSize="10" fontWeight="600">Cut off</text>
      </svg>
    )
  }
  if (type === 'wrong_doc') {
    return (
      <svg width="180" height="110" viewBox="0 0 180 110" fill="none">
        <rect x="20" y="15" width="140" height="80" rx="6" stroke="var(--warning)" strokeWidth="2" strokeDasharray="5 3" fill="var(--warning-muted)" />
        <text x="90" y="55" textAnchor="middle" fill="var(--warning)" fontSize="32">?</text>
        <text x="90" y="78" textAnchor="middle" fill="var(--ink-2)" fontSize="10">Wrong document type</text>
      </svg>
    )
  }
  if (type === 'expired') {
    return (
      <svg width="180" height="110" viewBox="0 0 180 110" fill="none">
        <rect x="20" y="15" width="140" height="80" rx="6" stroke="var(--danger)" strokeWidth="2" fill="var(--danger-muted)" />
        <text x="90" y="48" textAnchor="middle" fill="var(--danger)" fontSize="11" fontWeight="600">EXP: 01/2023</text>
        <path d="M75 60 L105 60" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" />
        <text x="90" y="76" textAnchor="middle" fill="var(--ink-2)" fontSize="10">Document expired</text>
      </svg>
    )
  }
  // face_mismatch
  return (
    <svg width="180" height="110" viewBox="0 0 180 110" fill="none">
      <circle cx="65" cy="55" r="30" stroke="#8B5CF6" strokeWidth="2" fill="#F5F3FF" />
      <circle cx="115" cy="55" r="30" stroke="#8B5CF6" strokeWidth="2" fill="#F5F3FF" />
      <path d="M88 55 L92 55" stroke="var(--danger)" strokeWidth="3" strokeLinecap="round" />
      <text x="65" y="95" textAnchor="middle" fill="#6D28D9" fontSize="9">Document</text>
      <text x="115" y="95" textAnchor="middle" fill="#6D28D9" fontSize="9">Selfie</text>
    </svg>
  )
}

export function RetryScreen({ errorType, onRetry }: RetryScreenProps) {
  const config = ERROR_CONFIGS[errorType]

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '8px 24px 0' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 20 }}>

        {/* Error icon */}
        <motion.div
          style={{ display: 'flex', justifyContent: 'center' }}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 180, damping: 18 }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 'var(--radius-xl)',
              background: config.bgVar,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertCircle size={28} style={{ color: config.colorVar }} />
          </div>
        </motion.div>

        {/* Title + description */}
        <motion.div
          style={{ textAlign: 'center' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <h2 className="t-h2" style={{ color: 'var(--ink-1)', margin: '0 0 8px' }}>
            {config.title}
          </h2>
          <p className="t-body" style={{ color: 'var(--ink-2)', margin: 0 }}>
            {config.description}
          </p>
        </motion.div>

        {/* Visual diagram */}
        <motion.div
          style={{ display: 'flex', justifyContent: 'center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div
            style={{
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              background: config.bgVar,
            }}
          >
            <ErrorDiagram type={errorType} />
          </div>
        </motion.div>

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.33 }}
        >
          <NoticeBox variant="warning" icon={Lightbulb} title="Quick tip">
            {config.tip}
          </NoticeBox>
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div
        style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button onClick={onRetry} iconLeading={<RotateCcw size={15} />}>
          Try again
        </Button>
        <Button
          variant="ghost"
          onClick={() => alert('Manual review initiated — integrate your support flow here')}
        >
          Request manual review instead
        </Button>
      </motion.div>
    </motion.div>
  )
}
