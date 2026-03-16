'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, ArrowRight, ShieldCheck, Shield, ShieldAlert, FileText, RefreshCw, Camera, Eye } from 'lucide-react'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { DOC_TYPES, COUNTRIES } from '@/lib/constants'
import { evaluateFlow, detectDeviceType } from '@/lib/flowEngine'
import { FLOW_RULES } from '@/lib/flowRules'
import { deriveRiskLevel, RISK_LABELS, RISK_COLORS, RISK_BG } from '@/lib/riskData'
import { SCREEN_LABELS } from '@/lib/flow'
import type { DocType, FlowScreenId, RiskLevel } from '@/lib/types'

// ── Document illustration ─────────────────────────────────────────────────────

function DocIllustration({ type, active }: { type: DocType; active: boolean }) {
  const c = active ? 'var(--accent)' : 'var(--ink-3)'
  if (type === 'passport') return (
    <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
      <rect x="0.5" y="0.5" width="31" height="41" rx="3.5" fill={active ? 'var(--accent-muted)' : 'var(--surface-0)'} stroke={c} strokeWidth="1.2" />
      <circle cx="16" cy="16" r="6.5" stroke={c} strokeWidth="1.2" fill="none" />
      <circle cx="16" cy="13" r="3" fill={c} opacity="0.35" />
      <path d="M9.5 22c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" fill={c} opacity="0.25" />
      <rect x="4" y="27" width="24" height="1.5" rx="0.75" fill={c} opacity="0.3" />
      <rect x="4" y="31" width="16" height="1.5" rx="0.75" fill={c} opacity="0.2" />
      <rect x="3.5" y="35" width="25" height="5" rx="1" fill={c} opacity="0.12" />
      <rect x="4" y="36.5" width="24" height="1" rx="0.5" fill={c} opacity="0.35" />
      <rect x="4" y="38.5" width="24" height="1" rx="0.5" fill={c} opacity="0.35" />
    </svg>
  )
  return (
    <svg width="52" height="34" viewBox="0 0 52 34" fill="none">
      <rect x="0.5" y="0.5" width="51" height="33" rx="3.5" fill={active ? 'var(--accent-muted)' : 'var(--surface-0)'} stroke={c} strokeWidth="1.2" />
      <rect x="3" y="3" width="51" height="8" rx="1.5" fill={c} opacity="0.15" />
      <rect x="3" y="3" width="15" height="28" rx="1.5" fill={c} opacity="0.12" />
      <circle cx="10.5" cy="12" r="4.5" stroke={c} strokeWidth="1.2" fill="none" />
      <circle cx="10.5" cy="10" r="2.2" fill={c} opacity="0.35" />
      <path d="M6 17c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" fill={c} opacity="0.25" />
      <rect x="22" y="13" width="25" height="1.5" rx="0.75" fill={c} opacity="0.3" />
      <rect x="22" y="17" width="17" height="1.5" rx="0.75" fill={c} opacity="0.2" />
      <rect x="22" y="21" width="21" height="1.5" rx="0.75" fill={c} opacity="0.2" />
      <rect x="22" y="25" width="13" height="1.5" rx="0.75" fill={c} opacity="0.15" />
    </svg>
  )
}

// ── Risk badge ────────────────────────────────────────────────────────────────

const RISK_ICONS = {
  low: ShieldCheck,
  medium: Shield,
  high: ShieldAlert,
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const Icon = RISK_ICONS[level]
  return (
    <motion.div
      key={level}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        background: RISK_BG[level],
        border: `1px solid ${RISK_COLORS[level]}`,
      }}
    >
      <Icon size={11} style={{ color: RISK_COLORS[level] }} strokeWidth={2} />
      <span style={{ fontSize: 11, fontWeight: 600, color: RISK_COLORS[level] }}>
        {RISK_LABELS[level]} verification
      </span>
    </motion.div>
  )
}

// ── Flow preview step pill ────────────────────────────────────────────────────

const STEP_ICONS: Partial<Record<FlowScreenId, typeof FileText>> = {
  'doc-capture-front': FileText,
  'doc-capture-back': RefreshCw,
  'selfie-capture': Camera,
  liveness: Eye,
}

const PREVIEW_SCREENS: FlowScreenId[] = [
  'doc-capture-front',
  'doc-capture-back',
  'selfie-capture',
  'liveness',
]

function FlowPreview({
  screens,
  riskLevel,
}: {
  screens: FlowScreenId[]
  riskLevel: RiskLevel
}) {
  const previewSteps = screens.filter((s) => PREVIEW_SCREENS.includes(s))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.28, ease: [0.34, 1.12, 0.64, 1] }}
      style={{
        padding: '14px 16px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-0)',
        border: '1px solid var(--border-1)',
        marginTop: 12,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-3)' }}>
          Your journey
        </p>
        <AnimatePresence mode="wait">
          <RiskBadge level={riskLevel} />
        </AnimatePresence>
      </div>

      {/* Step pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <AnimatePresence mode="popLayout">
          {previewSteps.map((screen, i) => (
            <motion.div
              key={screen}
              layout
              initial={{ opacity: 0, scale: 0.8, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.22, delay: i * 0.04 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {(() => {
                const StepIcon = STEP_ICONS[screen]
                const isLiveness = screen === 'liveness'
                const iconColor = isLiveness
                  ? riskLevel === 'high' ? 'var(--danger)' : 'var(--warning)'
                  : 'var(--accent)'
                const bgColor = isLiveness
                  ? riskLevel === 'high' ? 'var(--danger-muted)' : 'var(--warning-muted)'
                  : 'var(--accent-muted)'
                return (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: bgColor,
                    border: `1px solid ${iconColor}`,
                  }}>
                    {StepIcon && <StepIcon size={11} style={{ color: iconColor }} strokeWidth={2} />}
                    <span style={{ fontSize: 12, fontWeight: 500, color: iconColor }}>
                      {SCREEN_LABELS[screen]}
                    </span>
                  </div>
                )
              })()}

              {/* Arrow between steps */}
              {i < previewSteps.length - 1 && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5h6M6 3l2 2-2 2" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Note for liveness */}
      <AnimatePresence>
        {screens.includes('liveness') && (
          <motion.div
            key="liveness-note"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            style={{ margin: '10px 0 0', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: riskLevel === 'high' ? 'var(--danger)' : riskLevel === 'medium' ? 'var(--warning)' : 'var(--accent)',
            }} />
            <span style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.45 }}>
              {riskLevel === 'high'
                ? 'Presence check required — high-risk jurisdiction'
                : riskLevel === 'medium'
                  ? 'Presence check required — enhanced verification'
                  : 'Presence check required — compliance rule applies'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function CountryDocSelectScreen({
  onSelect,
}: {
  onSelect: (docType: DocType, country: string) => void
}) {
  const [country, setCountry] = useState('United Kingdom')
  const [selectedDoc, setSelectedDoc] = useState<DocType | null>(null)

  const riskLevel = useMemo(() => deriveRiskLevel(country), [country])

  const resolution = useMemo(() => {
    if (!selectedDoc) return null
    return evaluateFlow(
      { docType: selectedDoc, country, riskLevel, deviceType: detectDeviceType() },
      FLOW_RULES,
    )
  }, [selectedDoc, country, riskLevel])

  function handleDocClick(id: DocType) {
    setSelectedDoc(id)
  }

  function handleConfirm() {
    if (!selectedDoc) return
    onSelect(selectedDoc, country)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      {/* Scrollable content */}
      <div className="screen-scroll" style={{ padding: '8px 24px 0' }}>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--ink-1)', margin: '0 0 4px' }}>
            Your document
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 18px' }}>
            We&apos;ll guide you through scanning it.
          </p>
        </motion.div>

        {/* Country dropdown */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ marginBottom: 16 }}>
          <label htmlFor="country" style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-2)', marginBottom: 6 }}>
            Issuing country
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="country"
              value={country}
              onChange={(e) => { setCountry(e.target.value); setSelectedDoc(null) }}
              style={{
                width: '100%', height: 52, padding: '0 38px 0 14px',
                borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-2)',
                background: 'var(--surface-1)', color: 'var(--ink-1)',
                fontSize: 15, appearance: 'none', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--ink-3)' }} />
          </div>
        </motion.div>

        {/* Doc cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {DOC_TYPES.map(({ id, label, description, sides }, i) => {
            const isSelected = selectedDoc === id
            return (
              <motion.button
                key={id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleDocClick(id)}
                aria-pressed={isSelected}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-xl)',
                  background: isSelected ? 'var(--accent-muted)' : 'var(--surface-0)',
                  border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-1)'}`,
                  cursor: 'pointer', textAlign: 'left',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'border-color 180ms, background 180ms',
                }}
              >
                <div aria-hidden="true" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: id === 'passport' ? 36 : 56 }}>
                  <DocIllustration type={id} active={isSelected} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink-1)' }}>{label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>{description}</p>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {sides === 2 && <Badge variant="accent" size="sm">2 sides</Badge>}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Check size={11} color="#fff" strokeWidth={2.5} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Flow preview — slides in on doc selection */}
        <AnimatePresence>
          {selectedDoc && resolution && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ marginTop: 4, paddingBottom: 8 }}
            >
              <FlowPreview screens={resolution.screens} riskLevel={riskLevel} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Sticky confirm footer */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            key="footer"
            className="screen-footer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.22 }}
            style={{ borderTop: '1px solid var(--border-1)' }}
          >
            <Button onClick={handleConfirm} icon={<ArrowRight size={15} />}>
              Continue
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
