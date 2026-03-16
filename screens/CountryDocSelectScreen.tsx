'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/primitives/Badge'
import { DOC_TYPES, COUNTRIES } from '@/lib/constants'
import type { DocType, CountryDocSelectScreenProps } from '@/lib/types'

/** Illustrated document preview — small SVG representing each doc type. */
function DocPreview({ type, selected }: { type: DocType; selected: boolean }) {
  const accent = selected ? 'var(--accent)' : '#6B7A94'

  if (type === 'passport') {
    return (
      <svg width="36" height="48" viewBox="0 0 36 48" fill="none">
        <rect x="0.5" y="0.5" width="35" height="47" rx="3" fill="#1e293b" stroke={accent} strokeWidth="1" />
        <rect x="3" y="3" width="30" height="18" rx="1.5" fill={accent} opacity="0.15" />
        <circle cx="18" cy="16" r="6" fill={accent} opacity="0.3" />
        <circle cx="18" cy="13" r="3" fill={accent} opacity="0.5" />
        <path d="M12 22c0-3.3 2.7-6 6-6s6 2.7 6 6" fill={accent} opacity="0.3" />
        <rect x="4" y="28" width="28" height="1.5" rx="0.75" fill="rgba(255,255,255,0.25)" />
        <rect x="4" y="32" width="20" height="1.5" rx="0.75" fill="rgba(255,255,255,0.15)" />
        <rect x="4" y="36" width="16" height="1.5" rx="0.75" fill="rgba(255,255,255,0.15)" />
        <rect x="3" y="40" width="30" height="5" rx="1" fill={accent} opacity="0.12" />
        <rect x="4" y="41.5" width="28" height="1" rx="0.5" fill={accent} opacity="0.4" />
        <rect x="4" y="43.5" width="28" height="1" rx="0.5" fill={accent} opacity="0.4" />
      </svg>
    )
  }

  if (type === 'drivers-license') {
    return (
      <svg width="56" height="36" viewBox="0 0 56 36" fill="none">
        <rect x="0.5" y="0.5" width="55" height="35" rx="3" fill="#1e3a5f" stroke={accent} strokeWidth="1" />
        <rect x="3" y="3" width="55" height="10" rx="1.5" fill={accent} opacity="0.2" />
        <rect x="3" y="3" width="17" height="30" rx="1.5" fill={accent} opacity="0.15" />
        <circle cx="11.5" cy="13" r="5" fill={accent} opacity="0.4" />
        <circle cx="11.5" cy="10.5" r="2.5" fill={accent} opacity="0.5" />
        <path d="M6.5 18c0-2.8 2.2-5 5-5s5 2.2 5 5" fill={accent} opacity="0.4" />
        <rect x="23" y="15" width="27" height="1.5" rx="0.75" fill="rgba(255,255,255,0.3)" />
        <rect x="23" y="19" width="18" height="1.5" rx="0.75" fill="rgba(255,255,255,0.2)" />
        <rect x="23" y="23" width="22" height="1.5" rx="0.75" fill="rgba(255,255,255,0.2)" />
        <rect x="23" y="27" width="14" height="1.5" rx="0.75" fill="rgba(255,255,255,0.15)" />
      </svg>
    )
  }

  if (type === 'national-id') {
    return (
      <svg width="56" height="36" viewBox="0 0 56 36" fill="none">
        <rect x="0.5" y="0.5" width="55" height="35" rx="3" fill="#1a1a2e" stroke={accent} strokeWidth="1" />
        <rect x="0.5" y="0.5" width="55" height="8" rx="3" fill={accent} opacity="0.3" />
        <rect x="3" y="11" width="14" height="18" rx="1.5" fill={accent} opacity="0.15" />
        <circle cx="10" cy="17" r="4.5" fill={accent} opacity="0.35" />
        <circle cx="10" cy="15" r="2" fill={accent} opacity="0.5" />
        <path d="M5.5 21.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" fill={accent} opacity="0.35" />
        <rect x="21" y="12" width="29" height="1.5" rx="0.75" fill="rgba(255,255,255,0.3)" />
        <rect x="21" y="16" width="20" height="1.5" rx="0.75" fill="rgba(255,255,255,0.2)" />
        <rect x="21" y="20" width="24" height="1.5" rx="0.75" fill="rgba(255,255,255,0.2)" />
        <rect x="3" y="31" width="50" height="2" rx="1" fill={accent} opacity="0.25" />
      </svg>
    )
  }

  // residence-permit
  return (
    <svg width="56" height="36" viewBox="0 0 56 36" fill="none">
      <rect x="0.5" y="0.5" width="55" height="35" rx="3" fill="#14261a" stroke={accent} strokeWidth="1" />
      <rect x="0.5" y="0.5" width="55" height="7" rx="3" fill={accent} opacity="0.35" />
      <rect x="3" y="10" width="14" height="14" rx="1.5" fill={accent} opacity="0.15" />
      <circle cx="10" cy="15" r="4" fill={accent} opacity="0.35" />
      <circle cx="10" cy="13" r="2" fill={accent} opacity="0.5" />
      <path d="M6 19c0-2.2 1.8-4 4-4s4 1.8 4 4" fill={accent} opacity="0.35" />
      <rect x="21" y="11" width="29" height="1.5" rx="0.75" fill="rgba(255,255,255,0.3)" />
      <rect x="21" y="15" width="20" height="1.5" rx="0.75" fill="rgba(255,255,255,0.2)" />
      <rect x="21" y="19" width="24" height="1.5" rx="0.75" fill="rgba(255,255,255,0.2)" />
      <rect x="3" y="27" width="50" height="1.5" rx="0.75" fill={accent} opacity="0.3" />
      <rect x="3" y="30" width="50" height="1.5" rx="0.75" fill={accent} opacity="0.3" />
    </svg>
  )
}

export function CountryDocSelectScreen({ onSelect }: CountryDocSelectScreenProps) {
  const [country, setCountry] = useState('United States')
  const [pending, setPending] = useState<DocType | null>(null)

  function handleDocTap(docType: DocType) {
    setPending(docType)
    setTimeout(() => onSelect(docType), 240)
  }

  return (
    <motion.div
      style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '4px 24px 0' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
    >
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ marginBottom: 20 }}
      >
        <h2 className="t-h2" style={{ color: 'var(--ink-1)', margin: '0 0 6px' }}>
          Choose your document
        </h2>
        <p className="t-sm" style={{ color: 'var(--ink-2)', margin: 0 }}>
          Select the document you want to use for verification.
        </p>
      </motion.div>

      {/* Country selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ marginBottom: 20 }}
      >
        <label
          htmlFor="country-select"
          className="t-label"
          style={{ color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}
        >
          Issuing Country
        </label>
        <div style={{ position: 'relative' }}>
          <select
            id="country-select"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            style={{
              width: '100%',
              height: 52,
              padding: '0 40px 0 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--border-2)',
              background: 'var(--surface-1)',
              color: 'var(--ink-1)',
              fontSize: 15,
              fontWeight: 400,
              appearance: 'none',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown
            size={16}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--ink-3)',
            }}
          />
        </div>
      </motion.div>

      {/* Doc type cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {DOC_TYPES.map(({ id, label, description, sides }, i) => {
          const isSelected = pending === id
          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.055 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => handleDocTap(id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 'var(--radius-xl)',
                background: isSelected ? 'var(--accent-muted)' : 'var(--surface-0)',
                border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border-1)'}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 200ms ease, border-color 200ms ease',
                outline: 'none',
              }}
            >
              <div
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isSelected ? 1 : 0.72,
                  transition: 'opacity 200ms ease',
                  width: id === 'passport' ? 40 : 62,
                }}
              >
                <DocPreview type={id} selected={isSelected} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink-1)' }}>
                  {label}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>
                  {description}
                </p>
              </div>

              {sides === 2 && (
                <Badge variant="accent" size="sm">2 sides</Badge>
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
