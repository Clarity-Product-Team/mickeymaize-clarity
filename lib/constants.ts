import type { DocType, ErrorType } from './types'

// ─── Document type metadata ───────────────────────────────────────────────────

export interface DocTypeConfig {
  id: DocType
  label: string
  description: string
  sides: 1 | 2
}

export const DOC_TYPES: DocTypeConfig[] = [
  {
    id: 'passport',
    label: 'Passport',
    description: 'Accepted worldwide',
    sides: 1,
  },
  {
    id: 'drivers-license',
    label: "Driver's License",
    description: 'Front and back required',
    sides: 2,
  },
  {
    id: 'national-id',
    label: 'National ID',
    description: 'Front and back required',
    sides: 2,
  },
  {
    id: 'residence-permit',
    label: 'Residence Permit',
    description: 'Front and back required',
    sides: 2,
  },
]

export const DOC_LABEL: Record<DocType, string> = {
  passport: 'Passport',
  'drivers-license': "Driver's License",
  'national-id': 'National ID',
  'residence-permit': 'Residence Permit',
}

export const DOC_LABEL_LOWER: Record<DocType, string> = {
  passport: 'passport',
  'drivers-license': "driver's license",
  'national-id': 'national ID',
  'residence-permit': 'residence permit',
}

// ─── Error / retry configurations ────────────────────────────────────────────

export interface ErrorConfig {
  title: string
  description: string
  tip: string
  colorVar: string     // CSS custom property reference
  bgVar: string
}

export const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  blur: {
    title: 'Image is blurry',
    description:
      'The document photo was out of focus. Hold your device steady and try again.',
    tip: 'Rest your elbow on a surface to keep your hand stable.',
    colorVar: 'var(--warning)',
    bgVar: 'var(--warning-muted)',
  },
  glare: {
    title: 'Glare detected',
    description:
      'Light reflection is covering part of your document. Move to a different angle.',
    tip: 'Tilt the document slightly or move away from bright lights.',
    colorVar: 'var(--accent)',
    bgVar: 'var(--accent-muted)',
  },
  partial: {
    title: 'Document cut off',
    description:
      'One or more corners of the document are outside the frame.',
    tip: 'Move back until all four corners are visible in the rectangle.',
    colorVar: 'var(--danger)',
    bgVar: 'var(--danger-muted)',
  },
  wrong_doc: {
    title: 'Document not recognised',
    description:
      "We couldn't read this document type. Make sure you selected the right document.",
    tip: 'Go back and re-select your document type.',
    colorVar: 'var(--warning)',
    bgVar: 'var(--warning-muted)',
  },
  expired: {
    title: 'Document may be expired',
    description:
      'We detected this document might be expired. Please use a valid document.',
    tip: 'Check the expiry date on your document before retrying.',
    colorVar: 'var(--danger)',
    bgVar: 'var(--danger-muted)',
  },
  face_mismatch: {
    title: "Face doesn't match",
    description:
      "We couldn't match your selfie to the document photo. Try again with better lighting.",
    tip: 'Face the camera directly, remove glasses, and ensure good lighting.',
    colorVar: '#8B5CF6',
    bgVar: '#F5F3FF',
  },
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
  'Other',
]

// ─── Processing steps ─────────────────────────────────────────────────────────

export interface ProcessingStep {
  id: string
  label: string
  durationMs: number
}

export const PROCESSING_STEPS: ProcessingStep[] = [
  { id: 'read',      label: 'Reading document',    durationMs: 1400 },
  { id: 'face',      label: 'Matching your face',  durationMs: 1600 },
  { id: 'authentic', label: 'Checking authenticity', durationMs: 1500 },
  { id: 'confirm',   label: 'Confirming identity', durationMs: 1200 },
]

// ─── Camera quality checks ────────────────────────────────────────────────────

export const QUALITY_CHECKS_DOC = [
  { label: 'Move closer',   okLabel: 'Good distance', delayMs: 1000 },
  { label: 'Reduce glare',  okLabel: 'Clear',         delayMs: 2000 },
  { label: 'Hold steady',   okLabel: 'Sharp',         delayMs: 3000 },
]

export const QUALITY_CHECKS_SELFIE = [
  { label: 'Centre your face', okLabel: 'Face centred', delayMs: 1000 },
  { label: 'Improve lighting', okLabel: 'Good lighting', delayMs: 2000 },
  { label: 'Hold steady',      okLabel: 'Sharp',          delayMs: 3000 },
]
