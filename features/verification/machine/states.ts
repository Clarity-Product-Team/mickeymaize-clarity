// ─── Verification state names ─────────────────────────────────────────────────
//
// Each value is a distinct node in the verification state machine.
// Groups are purely organisational — the machine does not enforce them.

/**
 * All valid states of the verification state machine.
 *
 * Future: used as the key type of the transition table, so every state
 * must be explicitly handled when building allowed-event maps.
 */
export type VerificationStateName =
  // ── Entry ──────────────────────────────────────────────────────────────────
  | 'idle'                      // machine created, not yet started
  | 'intro'                     // welcome / onboarding screen shown
  // ── Setup ──────────────────────────────────────────────────────────────────
  | 'preparation'               // pre-capture checks (device, network, etc.)
  | 'requesting_permissions'    // camera permission prompt in progress
  | 'selecting_country'         // user is choosing the issuing country
  | 'selecting_document'        // user is choosing the document type
  // ── Document capture ───────────────────────────────────────────────────────
  | 'capturing_document_front'  // live camera — front side
  | 'validating_document_front' // quality / authenticity check — front side
  | 'reviewing_document_front'  // user confirms or retakes — front side
  | 'capturing_document_back'   // live camera — back side
  | 'validating_document_back'  // quality / authenticity check — back side
  | 'reviewing_document_back'   // user confirms or retakes — back side
  // ── Biometrics ─────────────────────────────────────────────────────────────
  | 'capturing_face'            // selfie capture
  | 'validating_face'           // face quality and match check
  | 'capturing_motion'          // liveness: motion instruction in progress
  | 'validating_motion'         // liveness: post-motion quality check
  // ── Backend ────────────────────────────────────────────────────────────────
  | 'uploading'                 // artifacts being uploaded to the backend
  | 'processing'                // backend running document + face pipeline
  | 'awaiting_backend_result'   // polling / waiting for async decision
  // ── Outcomes ───────────────────────────────────────────────────────────────
  | 'additional_step_required'  // backend requested further action from user
  | 'pending_manual_review'     // submitted; decision deferred to human review
  | 'verified'                  // identity confirmed — final success state
  // ── Failure / exit ─────────────────────────────────────────────────────────
  | 'retryable_failure'         // a step failed; user may attempt it again
  | 'unrecoverable_failure'     // hard rejection or non-retryable error
  | 'cancelled'                 // user or system cancelled the session

// ─── State group constants ────────────────────────────────────────────────────

/**
 * States from which no further transitions are possible.
 * The machine is considered done when it reaches any of these.
 */
export const TERMINAL_STATES = new Set<VerificationStateName>([
  'verified',
  'unrecoverable_failure',
  'cancelled',
])

/**
 * States that require the device camera to be active.
 * Used to gate camera permission checks and drive UI camera lifecycle.
 */
export const CAPTURE_STATES = new Set<VerificationStateName>([
  'capturing_document_front',
  'capturing_document_back',
  'capturing_face',
  'capturing_motion',
])
