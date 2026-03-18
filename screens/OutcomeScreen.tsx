'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Info,
  RotateCcw,
  XCircle,
} from 'lucide-react'
import { AnimatedCheck } from '@/components/primitives/AnimatedCheck'
import { Button } from '@/components/primitives/Button'
import { NoticeBox } from '@/components/primitives/NoticeBox'
import { generateVerificationId } from '@/lib/utils'
import { outcome as outcomeCopy } from '@/lib/content'
import type { OutcomeScreenProps, VerificationOutcome } from '@/lib/types'

// ── Icon and accent config per outcome ────────────────────────────────────────

const OUTCOME_CONFIG: Record<
  VerificationOutcome,
  {
    accentColor: string
    muteColor: string
    noticeVariant?: 'info' | 'warning' | 'danger'
  }
> = {
  verified:        { accentColor: 'var(--success)',  muteColor: 'var(--success-muted)' },
  pending:         { accentColor: 'var(--warning)',  muteColor: 'var(--warning-muted)', noticeVariant: 'warning' },
  additional_step: { accentColor: 'var(--accent)',   muteColor: 'var(--accent-muted)',  noticeVariant: 'info' },
  retry:           { accentColor: 'var(--warning)',  muteColor: 'var(--warning-muted)' },
  rejected:        { accentColor: 'var(--danger)',   muteColor: 'var(--danger-muted)',  noticeVariant: 'danger' },
}

// ── Icon for non-verified outcomes ────────────────────────────────────────────

function OutcomeIcon({
  outcome,
  color,
  muteColor,
}: {
  outcome: VerificationOutcome
  color: string
  muteColor: string
}) {
  const size = 48
  const strokeWidth = 1.6

  const icon = (() => {
    switch (outcome) {
      case 'pending':         return <Clock         size={size} style={{ color }} strokeWidth={strokeWidth} />
      case 'additional_step': return <Info          size={size} style={{ color }} strokeWidth={strokeWidth} />
      case 'retry':           return <RotateCcw     size={size} style={{ color }} strokeWidth={strokeWidth} />
      case 'rejected':        return <XCircle       size={size} style={{ color }} strokeWidth={strokeWidth} />
    }
  })()

  return (
    <div
      style={{
        width: 100, height: 100, borderRadius: '50%',
        background: muteColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {icon}
    </div>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function OutcomeScreen({
  outcome,
  onContinue,
  onRetry,
}: OutcomeScreenProps) {
  const [id] = useState(generateVerificationId)
  const copy = outcomeCopy[outcome]
  const config = OUTCOME_CONFIG[outcome]

  const isVerified = outcome === 'verified'
  const isRetry    = outcome === 'retry'
  const hasNotice  = 'notice' in copy && config.noticeVariant

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Scrollable content */}
      <div
        className="screen-scroll"
        style={{
          padding: '8px 24px 0',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 24,
        }}
      >

        {/* ── Icon / check ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isVerified ? (
            <>
              {/* Radial glow — verified only */}
              <motion.div
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.14 }}
                style={{
                  position: 'absolute',
                  width: 160, height: 160,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(0,179,125,0.20) 0%, transparent 68%)',
                  pointerEvents: 'none',
                }}
              />
              <AnimatedCheck size={100} color="var(--success)" />
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 140, damping: 18, delay: 0.14 }}
            >
              <OutcomeIcon
                outcome={outcome}
                color={config.accentColor}
                muteColor={config.muteColor}
              />
            </motion.div>
          )}
        </motion.div>

        {/* ── Heading ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.34, type: 'spring', stiffness: 120, damping: 20 }}
          style={{ textAlign: 'center', width: '100%' }}
        >
          <h2
            style={{
              fontSize: 32, fontWeight: 800,
              letterSpacing: '-0.5px',
              color: 'var(--ink-1)',
              margin: '0 0 8px',
            }}
          >
            {copy.heading}
          </h2>
          <p style={{ fontSize: 15, color: 'var(--ink-2)', margin: 0 }}>
            {copy.subheading}
          </p>
        </motion.div>

        {/* ── Metric cards — verified only ──────────────────────────────── */}
        {isVerified && (
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            {outcomeCopy.verified.metrics.map(({ label, status }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 14, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.50 + i * 0.08, type: 'spring', stiffness: 160, damping: 20 }}
                style={{
                  flex: 1, padding: '14px 12px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--success-muted)',
                  border: '1px solid var(--success)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 6,
                }}
              >
                <CheckCircle2 size={22} style={{ color: 'var(--success)' }} strokeWidth={1.8} />
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>{label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--ink-3)' }}>{status}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* ── Notice box — pending / additional_step / rejected ─────────── */}
        {hasNotice && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.50 }}
            style={{ width: '100%' }}
          >
            <NoticeBox variant={config.noticeVariant}>
              {(copy as { notice: string }).notice}
            </NoticeBox>
          </motion.div>
        )}

        {/* ── Privacy note — verified only ──────────────────────────────── */}
        {isVerified && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 14px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--surface-0)',
              border: '1px solid var(--border-1)',
            }}
          >
            <CheckCircle2 size={14} style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }} strokeWidth={2} />
            <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              {outcomeCopy.verified.privacyNote}
            </p>
          </motion.div>
        )}

        {/* ── Verification ID — verified only ───────────────────────────── */}
        {isVerified && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: 'var(--ink-3)', margin: 0 }}
          >
            {id}
          </motion.p>
        )}

      </div>

      {/* ── Sticky CTA footer ─────────────────────────────────────────────── */}
      <motion.div
        className="screen-footer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: isVerified ? 0.72 : 0.55 }}
        style={{ borderTop: '1px solid var(--border-1)' }}
      >
        {/* Retry outcome: two buttons stacked */}
        {isRetry ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button onClick={onRetry} icon={<RotateCcw size={15} />}>
              {outcomeCopy.retry.cta}
            </Button>
            <Button variant="ghost" onClick={onContinue}>
              {outcomeCopy.retry.secondaryCta}
            </Button>
          </div>
        ) : (
          <Button
            onClick={onContinue}
            icon={<ArrowRight size={15} />}
          >
            {copy.cta}
          </Button>
        )}
      </motion.div>

    </div>
  )
}
