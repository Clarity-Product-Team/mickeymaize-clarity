import type { DocType, ErrorType } from './types'

// ─── Document type metadata ───────────────────────────────────────────────────

export interface DocTypeConfig {
  id: DocType
  label: string
  description: string
  sides: 1 | 2
  /** Whether the capture flow requires a back-side scan for this document type. */
  requiresBackCapture: boolean
}

export const DOC_TYPES: DocTypeConfig[] = [
  {
    id: 'passport',
    label: 'Passport',
    description: 'Accepted worldwide',
    sides: 1,
    requiresBackCapture: false,
  },
  {
    id: 'drivers-license',
    label: "Driver's License",
    description: 'Front and back required',
    sides: 2,
    requiresBackCapture: true,
  },
  {
    id: 'national-id',
    label: 'National ID',
    description: 'Front and back required',
    sides: 2,
    requiresBackCapture: true,
  },
  {
    id: 'residence-permit',
    label: 'Residence Permit',
    description: 'Front and back required',
    sides: 2,
    requiresBackCapture: true,
  },
]

// ─── Error / retry — styling only (copy lives in lib/content.ts) ─────────────

export interface ErrorConfig {
  colorVar: string   // CSS custom property reference
  bgVar: string
}

export const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  blur:          { colorVar: 'var(--warning)',  bgVar: 'var(--warning-muted)' },
  glare:         { colorVar: 'var(--accent)',   bgVar: 'var(--accent-muted)' },
  partial:       { colorVar: 'var(--danger)',   bgVar: 'var(--danger-muted)' },
  wrong_doc:     { colorVar: 'var(--warning)',  bgVar: 'var(--warning-muted)' },
  expired:       { colorVar: 'var(--danger)',   bgVar: 'var(--danger-muted)' },
  face_mismatch: { colorVar: 'var(--accent)',    bgVar: 'var(--accent-muted)' },
}

// ─── Supported countries ─────────────────────────────────────────────────────

export const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Israel',
  'Germany',
  'France',
  'Canada',
  'Australia',
  'Netherlands',
  'Spain',
  'Italy',
  // Medium-risk (FATF monitoring) — demo scenarios
  'Nigeria',
  'Pakistan',
  'Philippines',
  'Egypt',
  'Morocco',
  'Bangladesh',
  'Jordan',
  'Senegal',
  'Vietnam',
  // High-risk (sanctions/AML) — demo scenarios
  'Afghanistan',
  'Iran',
  'Myanmar',
  'Syria',
  'Yemen',
  'Other',
]
