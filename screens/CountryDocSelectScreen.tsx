'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, ArrowRight, ShieldCheck, Shield, ShieldAlert, FileText, RefreshCw, Camera, Eye } from 'lucide-react'
import { Badge } from '@/components/primitives/Badge'
import { Button } from '@/components/primitives/Button'
import { deriveRiskLevel, RISK_LABELS, RISK_COLORS, RISK_BG } from '@/lib/riskData'
import { countryDoc } from '@/lib/content'
import { defaultDocSelectConfig } from '@/lib/docSelectConfig'
import type { DocSelectConfig } from '@/lib/docSelectConfig'
import type { DocTypeConfig } from '@/lib/constants'
import type { DocType, RiskLevel } from '@/lib/types'

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

// ── Journey hint ──────────────────────────────────────────────────────────────
//
// Replaces the previous FlowPreview, which ran evaluateFlow() inside the screen
// and showed a fixed step sequence. This component derives what it shows from
// doc config + risk level only — no flow engine dependency.
//
// Language is intentionally conditional:
//  - back capture shown only when requiresBackCapture is true for the selected doc
//  - liveness shown with "may" for medium risk, "required" for high risk
//  - never asserts a complete fixed journey

function StepPill({
  icon: Icon,
  label,
  conditional = false,
}: {
  icon: typeof FileText
  label: string
  conditional?: boolean
}) {
  const color = conditional ? 'var(--warning)' : 'var(--accent)'
  const bg = conditional ? 'var(--warning-muted)' : 'var(--accent-muted)'
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      padding: '6px 10px',
      borderRadius: 'var(--radius-full)',
      background: bg,
      border: `1px solid ${color}`,
      opacity: conditional ? 0.85 : 1,
    }}>
      <Icon size={11} style={{ color }} strokeWidth={2} />
      <span style={{ fontSize: 12, fontWeight: 500, color }}>
        {label}
      </span>
      {conditional && (
        <span style={{ fontSize: 10, color, opacity: 0.7, fontWeight: 600 }}>?</span>
      )}
    </div>
  )
}

function StepArrow() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 5h6M6 3l2 2-2 2" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function JourneyHint({
  docConfig,
  riskLevel,
  livenessRequired = false,
}: {
  docConfig: DocTypeConfig
  riskLevel: RiskLevel
  /**
   * When true, a liveness step is shown in the journey preview as a definite
   * (non-conditional) step. Sourced from VerificationFlowConfig.liveness.required
   * when the new config system is in use; falls back to false otherwise.
   */
  livenessRequired?: boolean
}) {
  const { journeyHint } = countryDoc
  const showBackCapture = docConfig.requiresBackCapture

  const steps: Array<{ icon: typeof FileText; label: string; conditional: boolean }> = [
    { icon: FileText, label: journeyHint.steps.docFront, conditional: false },
    ...(showBackCapture ? [{ icon: RefreshCw, label: journeyHint.steps.docBack, conditional: false }] : []),
    { icon: Camera, label: journeyHint.steps.selfie, conditional: false },
    ...(livenessRequired ? [{ icon: Eye, label: journeyHint.steps.liveness, conditional: false }] : []),
  ]

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
          {journeyHint.heading}
        </p>
        <AnimatePresence mode="wait">
          <RiskBadge level={riskLevel} />
        </AnimatePresence>
      </div>

      {/* Step pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <AnimatePresence mode="popLayout">
          {steps.map(({ icon, label, conditional }, i) => (
            <motion.div
              key={label}
              layout
              initial={{ opacity: 0, scale: 0.8, x: -8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.22, delay: i * 0.04 }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <StepPill icon={icon} label={label} conditional={conditional} />
              {i < steps.length - 1 && <StepArrow />}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Liveness note removed — liveness is now shown as an explicit step pill
          when livenessRequired is true, rather than as a conditional sub-note
          derived from risk level. */}
    </motion.div>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export function CountryDocSelectScreen({
  onSelect,
  config = defaultDocSelectConfig,
  livenessRequired = false,
}: {
  onSelect: (docType: DocType, country: string) => void
  /**
   * Drives the country list and available document types.
   * Defaults to the static fallback — swap for a session config payload
   * once the backend service layer is in place.
   */
  config?: DocSelectConfig
  /**
   * Whether liveness verification is required for this flow.
   * When true the journey hint shows a definite liveness step.
   * Sourced from VerificationFlowConfig.liveness.required.
   * Defaults to false (existing behaviour) when not provided.
   */
  livenessRequired?: boolean
}) {
  const [country, setCountry] = useState('United Kingdom')
  const [selectedDoc, setSelectedDoc] = useState<DocType | null>(null)

  const riskLevel = useMemo(() => deriveRiskLevel(country), [country])

  // Doc types are now determined by the config for the selected country,
  // not by a hardcoded constant imported directly into this screen.
  const docTypes = useMemo(() => config.getDocTypes(country), [config, country])

  const selectedDocConfig = useMemo(
    () => docTypes.find((d) => d.id === selectedDoc) ?? null,
    [docTypes, selectedDoc],
  )

  function handleCountryChange(next: string) {
    setCountry(next)
    // Reset doc selection when country changes — available types may differ
    setSelectedDoc(null)
  }

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
            {countryDoc.heading}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--ink-2)', margin: '0 0 18px' }}>
            {countryDoc.subheading}
          </p>
        </motion.div>

        {/* Country dropdown */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ marginBottom: 16 }}>
          <label htmlFor="country" style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-2)', marginBottom: 6 }}>
            {countryDoc.countryLabel}
          </label>
          <div style={{ position: 'relative' }}>
            <select
              id="country"
              value={country}
              onChange={(e) => handleCountryChange(e.target.value)}
              style={{
                width: '100%', height: 52, padding: '0 38px 0 14px',
                borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-2)',
                background: 'var(--surface-1)', color: 'var(--ink-1)',
                fontSize: 15, appearance: 'none', cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {config.countries.map((c) => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--ink-3)' }} />
          </div>
        </motion.div>

        {/* Doc type cards — driven by config.getDocTypes(country) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {docTypes.map(({ id, label, description, requiresBackCapture }, i) => {
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
                  {requiresBackCapture && <Badge variant="accent" size="sm">2 sides</Badge>}
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

        {/* Journey hint — slides in on doc selection */}
        <AnimatePresence>
          {selectedDoc && selectedDocConfig && (
            <motion.div
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ marginTop: 4, paddingBottom: 8 }}
            >
              <JourneyHint docConfig={selectedDocConfig} riskLevel={riskLevel} livenessRequired={livenessRequired} />
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
              {countryDoc.cta}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
