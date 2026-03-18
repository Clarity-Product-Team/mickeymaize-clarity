import type { VerificationStateName } from '../machine/states'
import type { VerificationEvent } from '../machine/events'
import type {
  BackendSessionStatus,
  BackendRequiredStep,
  BackendStepType,
  FetchStatusResponse,
  SubmitStepResponse,
} from './types'

// ─── Overview ─────────────────────────────────────────────────────────────────
//
// This file bridges the backend API layer and the frontend state machine.
//
// Responsibilities:
//   - Map BackendSessionStatus → VerificationStateName (for status polling)
//   - Map BackendRequiredStep → VerificationStateName (for session resume)
//   - Map FetchStatusResponse → VerificationEvent | null (for machine dispatch)
//   - Map SubmitStepResponse  → VerificationEvent | null (for machine dispatch)
//   - shouldContinuePolling() — drive the polling loop
//
// None of these functions have side effects. All mappings are explicit and
// typed so that TypeScript will catch any future additions to BackendSessionStatus
// or BackendStepType that are not handled here.

// ─── Step-type → capture state ────────────────────────────────────────────────
//
// The same BackendStepType has two frontend representations depending on whether
// the backend is actively collecting (capturing) or running its pipeline
// (validating). The second dimension is expressed by the 'phase' parameter.

type StepPhase = 'collecting' | 'validating'

const STEP_COLLECTING_STATE: Record<BackendStepType, VerificationStateName> = {
  document_front: 'capturing_document_front',
  document_back:  'capturing_document_back',
  face_capture:   'capturing_face',
  liveness:       'capturing_motion',
  // Backend-only steps that have no direct capture state on the frontend.
  // These are handled via the additional_step_required outcome path.
  address_proof:  'additional_step_required',
  video_call:     'additional_step_required',
  custom:         'additional_step_required',
}

const STEP_VALIDATING_STATE: Record<BackendStepType, VerificationStateName> = {
  document_front: 'validating_document_front',
  document_back:  'validating_document_back',
  face_capture:   'validating_face',
  liveness:       'validating_motion',
  address_proof:  'additional_step_required',
  video_call:     'additional_step_required',
  custom:         'additional_step_required',
}

function stepTypeToMachineState(
  stepType: BackendStepType,
  phase: StepPhase,
): VerificationStateName {
  return phase === 'collecting'
    ? STEP_COLLECTING_STATE[stepType]
    : STEP_VALIDATING_STATE[stepType]
}

// ─── BackendSessionStatus → VerificationStateName ────────────────────────────
//
// Maps the backend's view of the session lifecycle to the frontend machine state.
//
// For statuses that depend on which step the backend is waiting on
// ('collecting_inputs', 'validating_inputs', 'needs_retry'), the caller may
// pass `nextStep` to derive the correct capture / validating state.
// If `nextStep` is absent, a safe fallback state is used.

export function mapBackendStatusToMachineState(
  status: BackendSessionStatus,
  nextStep?: BackendRequiredStep | null,
): VerificationStateName {
  switch (status) {
    case 'initiated':
      return 'intro'

    case 'collecting_inputs':
      // If we know which step is expected next, land in the right capture state.
      // Otherwise fall back to the document front (the first step in all flows).
      if (nextStep) return stepTypeToMachineState(nextStep.type, 'collecting')
      return 'capturing_document_front'

    case 'validating_inputs':
      if (nextStep) return stepTypeToMachineState(nextStep.type, 'validating')
      return 'validating_document_front'

    case 'needs_retry':
      return 'retryable_failure'

    case 'needs_additional_step':
      return 'additional_step_required'

    case 'processing':
      return 'awaiting_backend_result'

    case 'manual_review':
      return 'pending_manual_review'

    case 'approved':
      return 'verified'

    case 'rejected':
      return 'unrecoverable_failure'

    case 'expired':
      return 'unrecoverable_failure'

    case 'cancelled':
      return 'cancelled'
  }
}

// ─── BackendRequiredStep → VerificationStateName ──────────────────────────────
//
// Used during session resume: the backend tells us the next step; this translates
// that step into the machine state the UI should navigate to.
//
// Always maps to the 'collecting' phase because on resume the user is about to
// start (or retry) the capture, not re-enter a validation screen.

export function mapNextStepToMachineState(
  step: BackendRequiredStep,
): VerificationStateName {
  return stepTypeToMachineState(step.type, 'collecting')
}

// ─── Polling control ──────────────────────────────────────────────────────────

/**
 * Returns true when the frontend should schedule another fetchStatus() call.
 *
 * Non-terminal statuses that represent active backend work require polling.
 * Statuses where the backend is waiting for user input do not — the frontend
 * drives those transitions via user actions, not polls.
 */
export function shouldContinuePolling(status: BackendSessionStatus): boolean {
  switch (status) {
    case 'processing':
    case 'validating_inputs':
      return true

    default:
      return false
  }
}

// ─── FetchStatusResponse → VerificationEvent ─────────────────────────────────
//
// Converts the result of a fetchStatus() call into a machine event (or null
// when the machine should simply keep waiting).
//
// Terminal statuses always produce a BACKEND_RESULT_RECEIVED event.
// Non-terminal statuses that require continued polling produce null.
// Non-terminal statuses that route the user back to a capture step produce
// RETRY_STEP so the machine transitions back into the capture flow.

export function mapFetchStatusToEvent(
  response: FetchStatusResponse,
): VerificationEvent | null {
  switch (response.status) {
    case 'approved':
      return {
        type: 'BACKEND_RESULT_RECEIVED',
        outcome: 'verified',
        reviewToken: response.reviewToken,
      }

    case 'rejected':
    case 'expired':
      return {
        type: 'BACKEND_RESULT_RECEIVED',
        outcome: 'rejected',
      }

    case 'cancelled':
      return { type: 'CANCEL' }

    case 'manual_review':
      return {
        type: 'BACKEND_RESULT_RECEIVED',
        outcome: 'pending',
        reviewToken: response.reviewToken,
      }

    case 'needs_additional_step':
      return {
        type: 'BACKEND_RESULT_RECEIVED',
        outcome: 'additional_step',
      }

    case 'needs_retry':
      // Backend says the last step needs to be retried.
      // Dispatch RETRY_STEP so the machine goes back to the appropriate capture state.
      return { type: 'RETRY_STEP' }

    case 'processing':
    case 'validating_inputs':
      // Still in flight — caller should schedule another poll.
      return null

    case 'collecting_inputs':
    case 'initiated':
      // Backend is waiting for user input; no event to dispatch.
      return null
  }
}

// ─── SubmitStepResponse → VerificationEvent ───────────────────────────────────
//
// Converts the result of submitStep() into a machine event.
//
// On success the backend either returns a nextStep (more inputs needed) or
// transitions to 'processing' (all steps collected). The relevant machine
// event is UPLOAD_SUCCEEDED — it advances the machine out of the uploading
// state and into awaiting_backend_result (when processing) or back into the
// next capture step.
//
// On failure statuses (needs_retry, rejected, etc.), delegates to
// mapFetchStatusToEvent since the response shapes are compatible.

export function mapSubmitStepToEvent(
  response: SubmitStepResponse,
): VerificationEvent | null {
  switch (response.status) {
    case 'collecting_inputs':
    case 'processing':
      // Step was accepted; all further navigation is driven by nextStep + machine.
      return { type: 'UPLOAD_SUCCEEDED' }

    case 'validating_inputs':
      // Backend immediately started pipeline for this step.
      return { type: 'UPLOAD_SUCCEEDED' }

    case 'needs_retry':
      return { type: 'RETRY_STEP' }

    case 'needs_additional_step':
      return { type: 'BACKEND_RESULT_RECEIVED', outcome: 'additional_step' }

    case 'manual_review':
      return { type: 'BACKEND_RESULT_RECEIVED', outcome: 'pending', reviewToken: undefined }

    case 'approved':
      return { type: 'BACKEND_RESULT_RECEIVED', outcome: 'verified' }

    case 'rejected':
    case 'expired':
      return { type: 'BACKEND_RESULT_RECEIVED', outcome: 'rejected' }

    case 'cancelled':
      return { type: 'CANCEL' }

    case 'initiated':
      return null
  }
}

// ─── Composite action ─────────────────────────────────────────────────────────
//
// Convenience type and function for callers that need all three derived values
// from a fetchStatus response in a single call.

export interface StatusMappingResult {
  /** The machine state that corresponds to this backend status. */
  machineState: VerificationStateName
  /** Event to dispatch to the machine, if any. */
  event: VerificationEvent | null
  /** Whether the caller should schedule another fetchStatus() call. */
  shouldPoll: boolean
}

export function mapFetchStatusToMachineAction(
  response: FetchStatusResponse,
  nextStep?: BackendRequiredStep | null,
): StatusMappingResult {
  return {
    machineState: mapBackendStatusToMachineState(response.status, nextStep),
    event:        mapFetchStatusToEvent(response),
    shouldPoll:   shouldContinuePolling(response.status),
  }
}
