import type { DocType, RiskLevel, DeviceType, VerificationOutcome } from '@/lib/types'
import type { VerificationStateName } from './states'

// ─── Supporting types ─────────────────────────────────────────────────────────

/**
 * A captured image artifact produced by a capture step.
 *
 * Production: `previewUrl` is an object URL (`URL.createObjectURL`) or
 * a signed blob URL from the upload layer — not the raw binary.
 * The machine never stores raw image data; only references.
 */
export interface CaptureArtifact {
  /** Object URL or data URL for local preview rendering. */
  previewUrl: string
  /** MIME type of the captured image (e.g. 'image/jpeg'). */
  mimeType: string
  /** Unix timestamp (ms) when the capture was taken. */
  capturedAt: number
}

/**
 * Per-step attempt counts, keyed by the state name where retries occur.
 *
 * Stored as a partial record so zero-attempt states have no key at all,
 * keeping the serialised context compact.
 *
 * Usage:  `context.attempts['capturing_document_front'] ?? 0`
 */
export type AttemptRecord = Partial<Record<VerificationStateName, number>>

// ─── Machine context ──────────────────────────────────────────────────────────

/**
 * The full in-flight state of a verification session.
 *
 * This is distinct from machine state (the current node) — context is the
 * data carried across all transitions. It is updated by the reducer when
 * events are processed.
 *
 * All mutable fields are nullable to reflect that they are not known until
 * the relevant step has been reached and completed.
 */
export interface VerificationContext {
  // ── Session ────────────────────────────────────────────────────────────────
  /**
   * Opaque session identifier assigned by the backend when the session is
   * created. Null until the backend call at the start of the flow returns.
   */
  sessionId: string | null
  /** Unix timestamp (ms) when the session was first started on this device. */
  startedAt: number | null

  // ── Flow configuration ─────────────────────────────────────────────────────
  /** Selected document type. Null until the user completes `selecting_document`. */
  docType: DocType | null
  /** Selected issuing country. Null until the user completes `selecting_country`. */
  country: string | null
  /** Risk level derived from country + document type. Null until selection is complete. */
  riskLevel: RiskLevel | null
  /**
   * Device form factor, used by the flow rule engine.
   * Set on machine init via `detectDeviceType()` — never null in practice.
   */
  deviceType: DeviceType

  // ── Camera permission ──────────────────────────────────────────────────────
  /**
   * Current camera permission state.
   * 'unknown'  — not yet queried (initial value)
   * 'granted'  — browser permission API confirmed access
   * 'denied'   — user denied in the browser prompt
   * 'blocked'  — denied at OS level or by browser policy; reload required
   */
  cameraPermission: 'unknown' | 'granted' | 'denied' | 'blocked'

  // ── Capture artifacts ──────────────────────────────────────────────────────
  /** Front-side document capture. Null until `reviewing_document_front` is confirmed. */
  documentFront: CaptureArtifact | null
  /** Back-side document capture. Null if the document does not require a back side. */
  documentBack: CaptureArtifact | null
  /** Selfie capture. Null until `capturing_face` succeeds. */
  selfie: CaptureArtifact | null
  /**
   * Opaque liveness token returned by the liveness provider.
   * Null if liveness is not required for this flow, or not yet completed.
   * Production: sent to the backend as proof of a completed liveness check.
   */
  livenessToken: string | null

  // ── Attempt tracking ───────────────────────────────────────────────────────
  /**
   * Number of retry attempts per capture state.
   * The reducer increments `attempts[stateName]` on each RETRY_STEP event.
   * Screens read this to enforce per-step MAX_ATTEMPTS limits.
   */
  attempts: AttemptRecord
  /**
   * The state that most recently resulted in `retryable_failure` or
   * `requesting_permissions`. Used by RETRY_STEP and PERMISSION_GRANTED
   * to return the machine to the correct capture step.
   * Cleared when the retry or permission transition completes.
   */
  failedState: VerificationStateName | null

  // ── Backend result ─────────────────────────────────────────────────────────
  /**
   * The final verification outcome, set when BACKEND_RESULT_RECEIVED is processed.
   * Null during all states prior to `awaiting_backend_result` completing.
   */
  outcome: VerificationOutcome | null
  /**
   * Opaque token for manual review lookup or support escalation.
   * Present only when outcome is 'pending_manual_review'.
   */
  reviewToken: string | null
  /**
   * Human-readable failure reason from the backend or local validation layer.
   * Present only when outcome indicates failure or when a validation step fails.
   */
  failureReason: string | null
}

// ─── Initial context ──────────────────────────────────────────────────────────

/**
 * The context value used when a new session starts.
 *
 * `deviceType` defaults to 'mobile' and should be overwritten immediately
 * on machine init via `detectDeviceType()` from `@/lib/flowEngine`.
 */
export const INITIAL_CONTEXT: VerificationContext = {
  sessionId:        null,
  startedAt:        null,
  docType:          null,
  country:          null,
  riskLevel:        null,
  deviceType:       'mobile',
  cameraPermission: 'unknown',
  documentFront:    null,
  documentBack:     null,
  selfie:           null,
  livenessToken:    null,
  attempts:         {},
  failedState:      null,
  outcome:          null,
  reviewToken:      null,
  failureReason:    null,
}
