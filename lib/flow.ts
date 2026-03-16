import type { DocType, FlowScreenId, FlowConfig } from './types'

/** Document types that require scanning both sides. */
const TWO_SIDED_DOCS: DocType[] = ['drivers-license', 'national-id', 'residence-permit']

/**
 * Builds the ordered list of screen IDs for a given verification configuration.
 *
 * Flow A (passport):       welcome → country-doc → doc-guidance → doc-capture-front
 *                          → selfie-guidance → selfie-capture → processing → success
 *
 * Flow B (two-sided doc):  same as A, but doc-capture-back inserted after front
 *
 * Flow C (liveness):       same as B, but liveness inserted before processing
 */
export function buildFlow({
  docType = 'passport',
  requireLiveness = false,
}: FlowConfig = {}): FlowScreenId[] {
  const screens: FlowScreenId[] = [
    'welcome',
    'country-doc',
    'doc-guidance',
    'doc-capture-front',
  ]

  if (TWO_SIDED_DOCS.includes(docType)) {
    screens.push('doc-capture-back')
  }

  screens.push('selfie-guidance', 'selfie-capture')

  if (requireLiveness) {
    screens.push('liveness')
  }

  screens.push('processing', 'success')

  return screens
}

/**
 * Screens that are excluded from the progress bar count.
 * Instructional and utility screens don't count as "steps".
 */
export const PROGRESS_EXCLUDED: FlowScreenId[] = [
  'welcome',
  'doc-guidance',
  'selfie-guidance',
  'processing',
  'success',
  'retry',
]

/**
 * Returns a 0–1 progress value for the current screen within the flow.
 * Returns 1 for terminal screens (processing, success).
 */
export function getProgress(screens: FlowScreenId[], currentScreen: FlowScreenId): number {
  if (currentScreen === 'retry') return -1
  if (['processing', 'success'].includes(currentScreen)) return 1

  const counted = screens.filter((s) => !PROGRESS_EXCLUDED.includes(s))
  const idx = counted.indexOf(currentScreen)
  if (idx < 0) return 0
  return (idx + 1) / counted.length
}

/**
 * Human-readable label for each screen (used in aria-label, debugging).
 */
export const SCREEN_LABELS: Record<FlowScreenId, string> = {
  welcome: 'Welcome',
  'country-doc': 'Choose document',
  'doc-guidance': 'Document tips',
  'doc-capture-front': 'Scan front',
  'doc-capture-back': 'Scan back',
  'selfie-guidance': 'Selfie tips',
  'selfie-capture': 'Selfie',
  liveness: 'Presence check',
  processing: 'Verifying',
  success: 'Verified',
  retry: 'Try again',
}
