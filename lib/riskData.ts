import type { RiskLevel } from './types'

/**
 * Demo risk classification for countries.
 *
 * IMPORTANT: These are simplified demo tiers for prototype purposes only.
 * They loosely reflect FATF (Financial Action Task Force) monitoring lists
 * but are NOT accurate real-world risk ratings and should not be used as such.
 *
 * Production: risk levels come from a real-time backend risk service that
 * combines FATF lists, internal fraud signals, regulatory requirements,
 * client-specific rules, and per-user signals (device, behaviour, history).
 */

/** Countries on FATF's Increased Monitoring list — demo approximation */
export const MEDIUM_RISK_COUNTRIES = new Set([
  'Nigeria',
  'Pakistan',
  'Philippines',
  'Egypt',
  'Morocco',
  'Algeria',
  'Bangladesh',
  'Cambodia',
  'Haiti',
  'Jamaica',
  'Jordan',
  'Mali',
  'Mozambique',
  'Senegal',
  'Vietnam',
  'Burkina Faso',
])

/** Countries subject to broad international sanctions — demo approximation */
export const HIGH_RISK_COUNTRIES = new Set([
  'Afghanistan',
  'Iran',
  'Myanmar',
  'North Korea',
  'Syria',
  'Yemen',
])

export function deriveRiskLevel(country: string): RiskLevel {
  if (HIGH_RISK_COUNTRIES.has(country)) return 'high'
  if (MEDIUM_RISK_COUNTRIES.has(country)) return 'medium'
  return 'low'
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Standard',
  medium: 'Enhanced',
  high: 'Full compliance',
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: 'var(--success)',
  medium: 'var(--warning)',
  high: 'var(--danger)',
}

export const RISK_BG: Record<RiskLevel, string> = {
  low: 'var(--success-muted)',
  medium: 'var(--warning-muted)',
  high: 'var(--danger-muted)',
}
