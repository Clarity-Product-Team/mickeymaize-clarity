import type { DocType, ErrorType, VerificationOutcome } from '@/lib/types'

// ─── Verification event union ─────────────────────────────────────────────────
//
// Discriminated on `type`. Events with no additional data use the minimal
// `{ type: '...' }` shape. Events that carry data include typed payload fields
// alongside `type` — no nested `payload` wrapper, keeping exhaustive switches clean.

/**
 * All events that can be sent to the verification state machine.
 *
 * Future: used as the value type of per-state allowed-event maps, and as
 * the input type of the machine reducer.
 */
export type VerificationEvent =
  // ── Session lifecycle ──────────────────────────────────────────────────────
  | { type: 'START' }
  | { type: 'RESUME';    sessionId: string }
  | { type: 'RESTART' }
  | { type: 'CANCEL' }
  | { type: 'CONTINUE' }
  // ── Setup ──────────────────────────────────────────────────────────────────
  | { type: 'COUNTRY_SELECTED';  country: string }
  | { type: 'DOCUMENT_SELECTED'; docType: DocType }
  // ── Camera permission ──────────────────────────────────────────────────────
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'PERMISSION_DENIED' }
  | { type: 'PERMISSION_BLOCKED' }
  // ── Capture ────────────────────────────────────────────────────────────────
  | { type: 'CAPTURE_CONFIRMED' }
  | { type: 'CAPTURE_FAILED';    reason: ErrorType }
  | { type: 'RETAKE' }
  | { type: 'SKIP_STEP' }
  // ── Upload ─────────────────────────────────────────────────────────────────
  | { type: 'UPLOAD_STARTED' }
  | { type: 'UPLOAD_SUCCEEDED' }
  | { type: 'UPLOAD_FAILED';     reason: string }
  // ── Validation ─────────────────────────────────────────────────────────────
  | { type: 'VALIDATION_PASSED' }
  | { type: 'VALIDATION_FAILED'; reason: string }
  // ── Backend result ─────────────────────────────────────────────────────────
  | { type: 'BACKEND_RESULT_RECEIVED'; outcome: VerificationOutcome; reviewToken?: string }
  // ── Retry ──────────────────────────────────────────────────────────────────
  | { type: 'RETRY_STEP' }

/**
 * The discriminant type of all events.
 * Useful for type guards, allowed-event sets, and exhaustive switch statements.
 */
export type VerificationEventType = VerificationEvent['type']
