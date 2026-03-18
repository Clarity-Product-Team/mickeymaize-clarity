import { retryCopy, retryActions, outcome as outcomeCopy } from '@/lib/content'
import type { ErrorType } from '@/lib/types'
import type { VerificationContext } from '../machine/context'
import { TERMINAL_STATES, type VerificationStateName } from '../machine/states'

// ─── Return types ─────────────────────────────────────────────────────────────

/**
 * Progress bar descriptor for the current machine state.
 *
 * `value`         — 0–1 fill amount. Ignored when `indeterminate` or `hidden`.
 * `indeterminate` — true for async-wait states; bar should pulse rather than fill.
 * `hidden`        — true for entry states and terminal states; hide the bar entirely.
 */
export interface MachineProgress {
  value: number
  indeterminate: boolean
  hidden: boolean
}

/**
 * Structured error information for failure states.
 *
 * Mirrors the shape of `retryCopy` entries so failure-state screens can
 * render a consistent error card without duplicating copy logic.
 */
export interface MachineError {
  title: string
  description: string
  tip?: string
}

// ─── Step labels ──────────────────────────────────────────────────────────────
//
// Maps each state to the label shown in a step/progress indicator.
// States that share a logical step (e.g. capture + validate + review) carry
// the same label — the indicator does not advance mid-step.
//
// States omitted from this map (entry, terminal, async-wait) have no visible
// step — `getStepLabel` returns null for them.

const STATE_STEP_LABELS: Partial<Record<VerificationStateName, string>> = {
  selecting_country:          'Choose document',
  selecting_document:         'Choose document',
  capturing_document_front:   'Scan front',
  validating_document_front:  'Scan front',
  reviewing_document_front:   'Scan front',
  capturing_document_back:    'Scan back',
  validating_document_back:   'Scan back',
  reviewing_document_back:    'Scan back',
  capturing_face:             'Take selfie',
  validating_face:            'Take selfie',
  capturing_motion:           'Presence check',
  validating_motion:          'Presence check',
  uploading:                  'Verifying',
  processing:                 'Verifying',
  awaiting_backend_result:    'Verifying',
}

// ─── CTA labels ───────────────────────────────────────────────────────────────
//
// Primary action label for each state.
// Null means the state has no primary CTA (auto-capture, loading, terminal).

const STATE_CTA_LABELS: Partial<Record<VerificationStateName, string>> = {
  idle:                       'Get started',
  intro:                      'Get started',
  preparation:                'Continue',
  requesting_permissions:     'Continue',
  selecting_country:          'Continue',
  selecting_document:         'Continue',
  reviewing_document_front:   'Use this photo',
  reviewing_document_back:    'Use this photo',
  processing:                 'Continue',
  additional_step_required:   outcomeCopy.additional_step.cta,
  pending_manual_review:      outcomeCopy.pending.cta,
  verified:                   outcomeCopy.verified.cta,
  retryable_failure:          retryActions.tryAgain,
  unrecoverable_failure:      outcomeCopy.rejected.cta,
}

// ─── Fixed progress values ────────────────────────────────────────────────────
//
// Coarse 0–1 values representing how far through the flow each state is.
// These are intentionally approximate — a future enhancement can derive them
// from the resolved screen list (context-aware), matching the existing
// `getProgress` function in lib/flow.ts.
//
// States not listed here (entry, terminal, failure) inherit the last known
// progress value — callers should fall back to 0 if no prior value exists.

const STATE_PROGRESS_VALUES: Partial<Record<VerificationStateName, number>> = {
  preparation:                0.05,
  requesting_permissions:     0.05,
  selecting_country:          0.10,
  selecting_document:         0.15,
  capturing_document_front:   0.25,
  validating_document_front:  0.28,
  reviewing_document_front:   0.30,
  capturing_document_back:    0.40,
  validating_document_back:   0.43,
  reviewing_document_back:    0.45,
  capturing_face:             0.58,
  validating_face:            0.62,
  capturing_motion:           0.72,
  validating_motion:          0.76,
  uploading:                  0.82,
  processing:                 0.88,
  awaiting_backend_result:    0.93,
  additional_step_required:   0.96,
  pending_manual_review:      1.00,
  verified:                   1.00,
}

/** States where the progress bar should pulse (async, indeterminate wait). */
const INDETERMINATE_STATES = new Set<VerificationStateName>([
  'requesting_permissions',
  'uploading',
  'processing',
  'awaiting_backend_result',
])

/** States where the progress bar should be hidden entirely. */
const PROGRESS_HIDDEN_STATES = new Set<VerificationStateName>([
  'idle',
  'intro',
  'cancelled',
  'unrecoverable_failure',
  'retryable_failure',
])

// ─── Upload fallback eligibility ──────────────────────────────────────────────

/** Active capture states where the user may upload a gallery image instead. */
const UPLOAD_FALLBACK_STATES = new Set<VerificationStateName>([
  'capturing_document_front',
  'capturing_document_back',
])

// ─── ErrorType type guard ─────────────────────────────────────────────────────

const ERROR_TYPES = new Set<string>([
  'blur', 'glare', 'partial', 'wrong_doc', 'expired', 'face_mismatch',
])

function isErrorType(s: string): s is ErrorType {
  return ERROR_TYPES.has(s)
}

// ─── Selectors ────────────────────────────────────────────────────────────────

/**
 * Returns the step label for the current state, or null for states that have
 * no visible step (entry, async-wait, terminal, failure states).
 *
 * Usage: step indicator, header subtitle, screen title fallback.
 */
export function getStepLabel(state: VerificationStateName): string | null {
  return STATE_STEP_LABELS[state] ?? null
}

/**
 * Returns the primary CTA label for the current state, or null for states
 * where no explicit CTA is shown (auto-capture, loading, terminal).
 *
 * Usage: primary button label in screen footers.
 */
export function getCtaLabel(state: VerificationStateName): string | null {
  return STATE_CTA_LABELS[state] ?? null
}

/**
 * Returns structured error information for failure states, or null if the
 * machine is not in a failure state or has no failure reason recorded.
 *
 * When `context.failureReason` matches a known `ErrorType`, the copy is drawn
 * from `lib/content.ts` `retryCopy`. For generic string reasons (e.g. from
 * upload or validation steps), a minimal fallback structure is returned so
 * callers always receive the same shape.
 *
 * Usage: retry / error screen rendering.
 */
export function getErrorMessage(
  state: VerificationStateName,
  context: VerificationContext,
): MachineError | null {
  if (state !== 'retryable_failure') return null
  const reason = context.failureReason
  if (!reason) return null

  if (isErrorType(reason)) {
    const copy = retryCopy[reason]
    return { title: copy.title, description: copy.description, tip: copy.tip }
  }

  // Generic string reason (from UPLOAD_FAILED or VALIDATION_FAILED).
  return { title: 'Something went wrong', description: reason }
}

/**
 * Returns progress bar configuration for the current state.
 *
 * For `retryable_failure`, the progress value is preserved from the state
 * that failed — callers should pass the last known non-failure progress value
 * via `fallbackValue` (defaults to 0 if omitted).
 *
 * Usage: `<ProgressBar>` component or equivalent.
 */
export function getProgress(
  state: VerificationStateName,
  fallbackValue = 0,
): MachineProgress {
  if (PROGRESS_HIDDEN_STATES.has(state) || TERMINAL_STATES.has(state)) {
    return { value: 0, indeterminate: false, hidden: true }
  }

  const indeterminate = INDETERMINATE_STATES.has(state)
  const value = STATE_PROGRESS_VALUES[state] ?? fallbackValue

  return { value, indeterminate, hidden: false }
}

/**
 * Returns true if the machine is in `retryable_failure` and the failed step
 * has not yet exhausted its allowed retry attempts.
 *
 * When `maxAttempts` is not passed, `MAX_ATTEMPTS_PER_STEP` is consulted,
 * falling back to `DEFAULT_MAX_ATTEMPTS` for steps with no explicit limit.
 *
 * Usage: show or hide the retry CTA; escalate to unrecoverable_failure after exhaustion.
 */
export function canRetry(
  state: VerificationStateName,
  context: VerificationContext,
): boolean {
  if (state !== 'retryable_failure') return false
  if (!context.failedState) return false
  const max      = MAX_ATTEMPTS_PER_STEP[context.failedState] ?? DEFAULT_MAX_ATTEMPTS
  const attempts = context.attempts[context.failedState] ?? 0
  return attempts < max
}

/**
 * Returns true when the current state supports uploading a gallery image
 * as a fallback for the live camera.
 *
 * Also returns true in `retryable_failure` when the preceding capture step
 * was a document capture — retry + upload are both valid exits from failure
 * in that case.
 *
 * Usage: show or hide the "Upload a photo instead" affordance.
 */
export function canUploadFallback(
  state: VerificationStateName,
  context: VerificationContext,
): boolean {
  if (UPLOAD_FALLBACK_STATES.has(state)) return true
  if (state === 'retryable_failure' && context.failedState !== null) {
    return UPLOAD_FALLBACK_STATES.has(context.failedState)
  }
  return false
}

// ─── Attempt limit constants ───────────────────────────────────────────────────

/**
 * Default maximum retry attempts for capture steps with no explicit limit.
 * Applied by `canRetry` when a step is not listed in `MAX_ATTEMPTS_PER_STEP`.
 */
export const DEFAULT_MAX_ATTEMPTS = 3

/**
 * Per-step retry limits.
 * Steps not listed here use `DEFAULT_MAX_ATTEMPTS`.
 *
 * `capturing_motion` is tighter (2) because liveness is harder to recover from
 * without human support.
 * `uploading` is looser (5) because network retries require no user effort.
 */
export const MAX_ATTEMPTS_PER_STEP: Partial<Record<VerificationStateName, number>> = {
  capturing_document_front: 3,
  capturing_document_back:  3,
  capturing_face:           3,
  capturing_motion:         2,
  uploading:                5,
}
