'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, X, ChevronRight } from 'lucide-react'
import { DEMO_SCENARIOS, type DemoScenario } from '@/lib/flowRules'
import { RISK_COLORS, RISK_BG, RISK_LABELS } from '@/lib/riskData'
import { SCREEN_LABELS } from '@/lib/flow'
import type { FlowResolution, FlowRuleTag, FlowScreenId } from '@/lib/types'

// ── Tag colors ────────────────────────────────────────────────────────────────

const TAG_STYLE: Record<FlowRuleTag, { bg: string; color: string }> = {
  document:    { bg: 'var(--accent-muted)',   color: 'var(--accent)' },
  risk:        { bg: 'var(--warning-muted)',   color: 'var(--warning)' },
  compliance:  { bg: 'var(--danger-muted)',    color: 'var(--danger)' },
  ux:          { bg: 'var(--success-muted)',   color: 'var(--success)' },
  device:      { bg: 'var(--surface-0)',       color: 'var(--ink-2)' },
}

// ── Flow step strip ───────────────────────────────────────────────────────────

const BASE_SCREENS = new Set<FlowScreenId>([
  'welcome', 'country-doc', 'doc-guidance',
  'doc-capture-front', 'selfie-guidance', 'selfie-capture',
  'processing', 'success',
])

function StepStrip({ screens, currentScreen }: { screens: FlowScreenId[]; currentScreen: FlowScreenId }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {screens.map((screen) => {
        const isAdded = !BASE_SCREENS.has(screen)
        const isCurrent = screen === currentScreen
        return (
          <div
            key={screen}
            title={isAdded ? 'Added by a rule' : 'Base step'}
            style={{
              padding: '3px 8px',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: isCurrent ? 700 : 500,
              border: `1px solid ${isAdded ? 'var(--warning)' : isCurrent ? 'var(--accent)' : 'var(--border-1)'}`,
              background: isAdded
                ? 'var(--warning-muted)'
                : isCurrent
                  ? 'var(--accent-muted)'
                  : 'var(--surface-1)',
              color: isAdded
                ? 'var(--warning)'
                : isCurrent
                  ? 'var(--accent)'
                  : 'var(--ink-3)',
            }}
          >
            {SCREEN_LABELS[screen] ?? screen}
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface FlowInspectorProps {
  resolution: FlowResolution
  currentScreen: FlowScreenId
  onApplyScenario: (scenario: DemoScenario) => void
}

export function FlowInspector({ resolution, currentScreen, onApplyScenario }: FlowInspectorProps) {
  const [open, setOpen] = useState(false)
  const [expandedRule, setExpandedRule] = useState<string | null>(null)
  const { context, appliedRules, screens, flags } = resolution

  const ruleCount = appliedRules.length

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 16,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {/* ── Expanded panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.34, 1.12, 0.64, 1] }}
            style={{
              width: 300,
              maxHeight: '70vh',
              overflowY: 'auto',
              borderRadius: 16,
              background: 'var(--surface-1)',
              border: '1px solid var(--border-2)',
              boxShadow: 'var(--shadow-lg)',
              pointerEvents: 'all',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px 10px',
              borderBottom: '1px solid var(--border-1)',
              position: 'sticky', top: 0,
              background: 'var(--surface-1)',
              zIndex: 1,
            }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--ink-1)' }}>
                  Flow Inspector
                </p>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--ink-3)' }}>
                  Demo mode — not visible in production
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--ink-3)' }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* ── Scenarios ─────────────────────────────────────────── */}
              <section>
                <p style={{ margin: '0 0 7px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--ink-3)' }}>
                  Try a scenario
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {DEMO_SCENARIOS.map((scenario) => {
                    const isActive =
                      resolution.context.docType === scenario.docType &&
                      resolution.context.country === scenario.country
                    return (
                      <motion.button
                        key={scenario.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { onApplyScenario(scenario); setOpen(false) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '8px 10px',
                          borderRadius: 10,
                          background: isActive ? 'var(--accent-muted)' : 'var(--surface-0)',
                          border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border-1)'}`,
                          cursor: 'pointer', textAlign: 'left', outline: 'none',
                          transition: 'border-color 150ms, background 150ms',
                        }}
                      >
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{scenario.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--ink-1)' }}>
                            {scenario.label}
                          </p>
                          <p style={{ margin: 0, fontSize: 10, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {scenario.description}
                          </p>
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: 'var(--ink-3)',
                          padding: '2px 6px', borderRadius: 4, background: 'var(--surface-1)',
                          flexShrink: 0,
                        }}>
                          {scenario.hint}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </section>

              {/* ── Current context ────────────────────────────────────── */}
              <section>
                <p style={{ margin: '0 0 7px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--ink-3)' }}>
                  Current context
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {[
                    { label: context.docType },
                    { label: context.country },
                    {
                      label: `${RISK_LABELS[context.riskLevel]} risk`,
                      bg: RISK_BG[context.riskLevel],
                      color: RISK_COLORS[context.riskLevel],
                    },
                    { label: context.deviceType },
                  ].map(({ label, bg, color }) => (
                    <span
                      key={label}
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 500,
                        background: bg ?? 'var(--surface-0)',
                        color: color ?? 'var(--ink-2)',
                        border: `1px solid ${color ?? 'var(--border-1)'}`,
                      }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </section>

              {/* ── Resolved flow steps ────────────────────────────────── */}
              <section>
                <p style={{ margin: '0 0 7px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--ink-3)' }}>
                  Resolved flow
                  <span style={{ marginLeft: 5, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--ink-3)' }}>
                    ({screens.length} screens)
                  </span>
                </p>
                <StepStrip screens={screens} currentScreen={currentScreen} />
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, color: 'var(--accent)' }}>■ current step</span>
                  <span style={{ fontSize: 9, color: 'var(--warning)' }}>■ added by rule</span>
                  <span style={{ fontSize: 9, color: 'var(--ink-3)' }}>■ base step</span>
                </div>
              </section>

              {/* ── Applied rules ──────────────────────────────────────── */}
              <section>
                <p style={{ margin: '0 0 7px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--ink-3)' }}>
                  Applied rules
                  <span style={{ marginLeft: 5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                    ({ruleCount})
                  </span>
                </p>
                {ruleCount === 0 ? (
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-3)' }}>No rules applied — base flow.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {appliedRules.map((rule) => (
                      <div key={rule.id}>
                        <button
                          onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 8px',
                            borderRadius: 8,
                            background: 'var(--surface-0)',
                            border: '1px solid var(--border-1)',
                            cursor: 'pointer', textAlign: 'left', outline: 'none',
                          }}
                        >
                          {/* Tag pills */}
                          <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                            {rule.tags.map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  fontSize: 9,
                                  fontWeight: 600,
                                  background: TAG_STYLE[tag].bg,
                                  color: TAG_STYLE[tag].color,
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 500, color: 'var(--ink-1)', flex: 1, lineHeight: 1.3 }}>
                            {rule.label}
                          </p>
                          <motion.span
                            animate={{ rotate: expandedRule === rule.id ? 90 : 0 }}
                            transition={{ duration: 0.15 }}
                            style={{ display: 'flex', flexShrink: 0 }}
                          >
                            <ChevronRight size={12} style={{ color: 'var(--ink-3)' }} />
                          </motion.span>
                        </button>

                        <AnimatePresence>
                          {expandedRule === rule.id && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.18 }}
                              style={{
                                margin: '3px 0 0',
                                padding: '6px 8px',
                                fontSize: 10,
                                color: 'var(--ink-2)',
                                lineHeight: 1.55,
                                borderRadius: '0 0 8px 8px',
                                background: 'var(--surface-0)',
                                overflow: 'hidden',
                              }}
                            >
                              {rule.description}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Flags ─────────────────────────────────────────────── */}
              <section>
                <p style={{ margin: '0 0 7px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--ink-3)' }}>
                  Resolved flags
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {(Object.entries(flags) as Array<[string, boolean]>).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: 'var(--ink-2)', fontFamily: 'ui-monospace, monospace' }}>{key}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                        background: val ? 'var(--success-muted)' : 'var(--surface-0)',
                        color: val ? 'var(--success)' : 'var(--ink-3)',
                        border: `1px solid ${val ? 'var(--success)' : 'var(--border-1)'}`,
                      }}>
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toggle button ────────────────────────────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((o) => !o)}
        title="Flow Inspector — demo only"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderRadius: 99,
          background: 'var(--surface-1)',
          border: '1px solid var(--border-2)',
          boxShadow: 'var(--shadow-md)',
          cursor: 'pointer',
          outline: 'none',
          pointerEvents: 'all',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <Settings size={13} style={{ color: 'var(--accent)' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>
          Flow
        </span>
        {ruleCount > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {ruleCount}
          </span>
        )}
      </motion.button>
    </div>
  )
}
