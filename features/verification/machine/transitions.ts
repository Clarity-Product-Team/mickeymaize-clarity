import type { VerificationEvent, VerificationEventType } from './events'
import { TERMINAL_STATES, type VerificationStateName } from './states'
import type { VerificationContext } from './context'
import type { VerificationFlowConfig } from '../config/types'
import { resolveBackSideRequired, resolveLivenessRequired } from '../config/resolvers'

// ─── Result type ──────────────────────────────────────────────────────────────

/**
 * Returned by `transition()` when a valid transition exists.
 *
 * `contextPatch` carries only the fields that change — callers merge it into
 * the existing context rather than recomputing the whole object.
 * When no context fields change, `contextPatch` is absent.
 */
export interface TransitionResult {
  /** The next state the machine should enter. */
  state: VerificationStateName
  /** Partial context update to apply after the transition. */
  contextPatch?: Partial<VerificationContext>
}

// ─── Static transition table ──────────────────────────────────────────────────
//
// Maps (currentState, eventType) → nextState for all unconditional transitions.
// Conditional transitions (where payload or context determines the next state)
// are handled below the table in `transition()`.

type StaticTable = Partial<
  Record<VerificationStateName, Partial<Record<VerificationEventType, VerificationStateName>>>
>

const STATIC_TRANSITIONS: StaticTable = {

  // ── Entry ───────────────────────────────────────────────────────────────────
  idle: {
    START:  'intro',
    RESUME: 'preparation',
  },
  intro: {
    CONTINUE: 'selecting_country',
    RESTART:  'idle',
  },

  // ── Setup ───────────────────────────────────────────────────────────────────
  preparation: {
    CONTINUE: 'selecting_country',
    CANCEL:   'cancelled',
  },
  selecting_country: {
    COUNTRY_SELECTED: 'selecting_document',
    CANCEL:           'cancelled',
  },
  selecting_document: {
    DOCUMENT_SELECTED: 'capturing_document_front',
    CANCEL:            'cancelled',
  },

  // ── Camera permission ────────────────────────────────────────────────────────
  // PERMISSION_GRANTED → return to the capture state that triggered the request.
  // Handled conditionally in transition() using context.failedState.
  requesting_permissions: {
    PERMISSION_DENIED:  'retryable_failure',
    PERMISSION_BLOCKED: 'unrecoverable_failure',
    CANCEL:             'cancelled',
  },

  // ── Document capture — front ────────────────────────────────────────────────
  capturing_document_front: {
    CAPTURE_CONFIRMED:   'validating_document_front',
    CAPTURE_FAILED:      'retryable_failure',
    PERMISSION_DENIED:   'requesting_permissions',
    PERMISSION_BLOCKED:  'requesting_permissions',
    CANCEL:              'cancelled',
  },
  validating_document_front: {
    VALIDATION_PASSED: 'reviewing_document_front',
    VALIDATION_FAILED: 'retryable_failure',
  },
  reviewing_document_front: {
    // CAPTURE_CONFIRMED is handled conditionally in transition() — it consults
    // resolveBackSideRequired(config, context.docType) to decide whether to
    // go to capturing_document_back or skip directly to capturing_face.
    RETAKE:  'capturing_document_front',
    CANCEL:  'cancelled',
  },

  // ── Document capture — back ─────────────────────────────────────────────────
  capturing_document_back: {
    CAPTURE_CONFIRMED:  'validating_document_back',
    CAPTURE_FAILED:     'retryable_failure',
    PERMISSION_DENIED:  'requesting_permissions',
    PERMISSION_BLOCKED: 'requesting_permissions',
    CANCEL:             'cancelled',
  },
  validating_document_back: {
    VALIDATION_PASSED: 'reviewing_document_back',
    VALIDATION_FAILED: 'retryable_failure',
  },
  reviewing_document_back: {
    CAPTURE_CONFIRMED: 'capturing_face',
    RETAKE:            'capturing_document_back',
    CANCEL:            'cancelled',
  },

  // ── Biometrics ───────────────────────────────────────────────────────────────
  capturing_face: {
    CAPTURE_CONFIRMED:  'validating_face',
    CAPTURE_FAILED:     'retryable_failure',
    // SKIP_STEP: selfie is optional; skip directly to liveness when allowed.
    SKIP_STEP:          'capturing_motion',
    PERMISSION_DENIED:  'requesting_permissions',
    PERMISSION_BLOCKED: 'requesting_permissions',
    CANCEL:             'cancelled',
  },
  validating_face: {
    // VALIDATION_PASSED is handled conditionally in transition() — it consults
    // resolveLivenessRequired(config) to decide whether to go to capturing_motion
    // or skip directly to uploading.
    VALIDATION_FAILED: 'retryable_failure',
  },
  capturing_motion: {
    CAPTURE_CONFIRMED:  'validating_motion',
    CAPTURE_FAILED:     'retryable_failure',
    PERMISSION_DENIED:  'requesting_permissions',
    PERMISSION_BLOCKED: 'requesting_permissions',
    CANCEL:             'cancelled',
  },
  validating_motion: {
    VALIDATION_PASSED: 'uploading',
    VALIDATION_FAILED: 'retryable_failure',
  },

  // ── Backend ──────────────────────────────────────────────────────────────────
  uploading: {
    UPLOAD_SUCCEEDED: 'processing',
    UPLOAD_FAILED:    'retryable_failure',
    CANCEL:           'cancelled',
  },
  processing: {
    // CONTINUE here represents the UI signalling that its local progress
    // animation has finished and the machine should begin polling/waiting.
    CONTINUE: 'awaiting_backend_result',
  },
  // awaiting_backend_result: BACKEND_RESULT_RECEIVED is conditional on
  // event.outcome — handled in transition() below.

  // ── Failure ──────────────────────────────────────────────────────────────────
  retryable_failure: {
    // RETRY_STEP: conditional — must return to context.failedState.
    // Handled in transition() below.
    CANCEL: 'cancelled',
  },

  // ── Post-outcome ─────────────────────────────────────────────────────────────
  // These states accept CONTINUE for user acknowledgement but produce no new
  // machine state — they are effectively user-facing terminal displays.
  // Actual navigation (e.g. closing the SDK) is the caller's responsibility.
  additional_step_required: {
    CONTINUE: 'additional_step_required',
  },
  pending_manual_review: {
    CONTINUE: 'pending_manual_review',
  },
}

// ─── Context patch builder ────────────────────────────────────────────────────
//
// Extracts the fields from a processed event that belong in context.
// Only returns non-empty patches — callers should check before spreading.

function buildContextPatch(
  event: VerificationEvent,
  nextState: VerificationStateName,
  fromState: VerificationStateName,
  context: VerificationContext,
): Partial<VerificationContext> | undefined {
  const patch: Partial<VerificationContext> = {}

  switch (event.type) {
    case 'START':
      patch.startedAt = Date.now()
      break
    case 'RESUME':
      patch.sessionId = event.sessionId
      patch.startedAt = patch.startedAt ?? Date.now()
      break
    case 'COUNTRY_SELECTED':
      patch.country = event.country
      break
    case 'DOCUMENT_SELECTED':
      patch.docType = event.docType
      break
    case 'PERMISSION_GRANTED':
      patch.cameraPermission = 'granted'
      patch.failedState = null
      break
    case 'PERMISSION_DENIED':
      patch.cameraPermission = 'denied'
      if (nextState === 'retryable_failure' || nextState === 'requesting_permissions') {
        patch.failedState = fromState
      }
      break
    case 'PERMISSION_BLOCKED':
      patch.cameraPermission = 'blocked'
      break
    case 'CAPTURE_FAILED':
      patch.failureReason = event.reason
      patch.failedState   = fromState
      break
    case 'VALIDATION_FAILED':
      patch.failureReason = event.reason
      patch.failedState   = fromState
      break
    case 'UPLOAD_FAILED':
      patch.failureReason = event.reason
      patch.failedState   = fromState
      break
    case 'RETRY_STEP': {
      // Increment attempt counter for the state being retried.
      const target  = context.failedState ?? fromState
      const current = context.attempts[target] ?? 0
      patch.attempts     = { ...context.attempts, [target]: current + 1 }
      patch.failureReason = null
      patch.failedState   = null
      break
    }
    case 'BACKEND_RESULT_RECEIVED':
      patch.outcome      = event.outcome
      patch.reviewToken  = event.reviewToken ?? null
      break
  }

  return Object.keys(patch).length > 0 ? patch : undefined
}

// ─── Main transition function ─────────────────────────────────────────────────

/**
 * Computes the next machine state and a partial context update for a given
 * (currentState, event, context) triple.
 *
 * Returns `null` if the event is not valid in the current state — callers
 * should treat null as a no-op (the machine stays in its current state).
 *
 * Pure function: no side effects, no I/O.
 */
export function transition(
  current: VerificationStateName,
  event: VerificationEvent,
  context: VerificationContext,
  config: VerificationFlowConfig,
): TransitionResult | null {

  // Terminal states accept no further events.
  if (TERMINAL_STATES.has(current)) return null

  // ── Conditional transitions ────────────────────────────────────────────────

  // reviewing_document_front → CAPTURE_CONFIRMED:
  // Route to back capture only when the selected document requires it.
  // Falls back to capturing_face for single-sided documents (e.g. passport).
  if (current === 'reviewing_document_front' && event.type === 'CAPTURE_CONFIRMED') {
    const nextState = resolveBackSideRequired(config, context.docType)
      ? 'capturing_document_back'
      : 'capturing_face'
    const contextPatch = buildContextPatch(event, nextState, current, context)
    return { state: nextState, contextPatch }
  }

  // validating_face → VALIDATION_PASSED:
  // Route to liveness only when the flow config requires it.
  // Skips directly to uploading when liveness is not required.
  if (current === 'validating_face' && event.type === 'VALIDATION_PASSED') {
    const nextState = resolveLivenessRequired(config) ? 'capturing_motion' : 'uploading'
    const contextPatch = buildContextPatch(event, nextState, current, context)
    return { state: nextState, contextPatch }
  }

  // BACKEND_RESULT_RECEIVED: next state is determined by event.outcome.
  if (current === 'awaiting_backend_result' && event.type === 'BACKEND_RESULT_RECEIVED') {
    const nextState = outcomeToState(event.outcome)
    const contextPatch = buildContextPatch(event, nextState, current, context)
    return { state: nextState, contextPatch }
  }

  // PERMISSION_GRANTED: return to the capture step that triggered the request.
  if (current === 'requesting_permissions' && event.type === 'PERMISSION_GRANTED') {
    const nextState = context.failedState ?? 'capturing_document_front'
    const contextPatch = buildContextPatch(event, nextState, current, context)
    return { state: nextState, contextPatch }
  }

  // RETRY_STEP: return to the failed capture step, resetting failure data.
  if (current === 'retryable_failure' && event.type === 'RETRY_STEP') {
    if (!context.failedState) return null
    const nextState   = context.failedState
    const contextPatch = buildContextPatch(event, nextState, current, context)
    return { state: nextState, contextPatch }
  }

  // ── Static table lookup ────────────────────────────────────────────────────

  const nextState = STATIC_TRANSITIONS[current]?.[event.type]
  if (nextState === undefined) return null

  const contextPatch = buildContextPatch(event, nextState, current, context)
  return { state: nextState, contextPatch }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

import type { VerificationOutcome } from '@/lib/types'

/**
 * Maps a backend-returned outcome to the corresponding machine state.
 * 'retry' from the backend is treated as a retryable failure — the specific
 * step is determined by context (future: backend may include a `failedStep` field).
 */
function outcomeToState(outcome: VerificationOutcome): VerificationStateName {
  switch (outcome) {
    case 'verified':         return 'verified'
    case 'pending':          return 'pending_manual_review'
    case 'rejected':         return 'unrecoverable_failure'
    case 'additional_step':  return 'additional_step_required'
    case 'retry':            return 'retryable_failure'
  }
}
