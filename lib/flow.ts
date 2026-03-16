import type { FlowScreenId } from './types'

/** Screens omitted from the step counter and progress bar. */
export const PROGRESS_EXCLUDED: FlowScreenId[] = [
  'welcome',
  'doc-guidance',
  'selfie-guidance',
  'processing',
  'success',
  'retry',
]

/** 0–1 progress value. Returns –1 for retry (no progress shown). */
export function getProgress(screens: FlowScreenId[], current: FlowScreenId): number {
  if (current === 'retry') return -1
  if (['processing', 'success'].includes(current)) return 1
  const counted = screens.filter((s) => !PROGRESS_EXCLUDED.includes(s))
  const idx = counted.indexOf(current)
  if (idx >= 0) return (idx + 1) / counted.length

  // Screen is excluded from counting (e.g. doc-guidance, selfie-guidance).
  // Return the progress of the last counted step that appears before it so
  // the progress bar doesn't snap back to 0 on intermediate screens.
  const screenIdx = screens.indexOf(current)
  if (screenIdx <= 0) return 0
  const completedCount = counted.filter((s) => screens.indexOf(s) < screenIdx).length
  return completedCount / counted.length
}

/** Step number (1-based) and total, for "Step 2 of 4" display. */
export function getStepInfo(
  screens: FlowScreenId[],
  current: FlowScreenId,
): { step: number; total: number; label: string } | null {
  const counted = screens.filter((s) => !PROGRESS_EXCLUDED.includes(s))
  const idx = counted.indexOf(current)
  if (idx < 0) return null
  return { step: idx + 1, total: counted.length, label: STEP_LABELS[current] ?? '' }
}

export const STEP_LABELS: Partial<Record<FlowScreenId, string>> = {
  'country-doc': 'Choose document',
  'doc-capture-front': 'Scan front',
  'doc-capture-back': 'Scan back',
  'selfie-capture': 'Take selfie',
  liveness: 'Presence check',
}

export const SCREEN_LABELS: Record<FlowScreenId, string> = {
  welcome: 'Welcome',
  'country-doc': 'Choose document',
  'doc-guidance': 'Get ready',
  'doc-capture-front': 'Scan front',
  'doc-capture-back': 'Scan back',
  'selfie-guidance': 'Selfie tips',
  'selfie-capture': 'Take selfie',
  liveness: 'Presence check',
  processing: 'Verifying',
  success: 'Verified',
  retry: 'Try again',
}
