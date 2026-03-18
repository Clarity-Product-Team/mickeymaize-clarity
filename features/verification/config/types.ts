import type { DocType, RiskLevel, SelfieCaptureMode } from '@/lib/types'

// ─── Overview ─────────────────────────────────────────────────────────────────
//
// A `VerificationFlowConfig` describes everything a verification session needs
// to know before it starts: which countries and documents are available,
// what capture steps are required, and what outcomes the backend may return.
//
// In production this object is returned by the session-initialization API
// (e.g. POST /sessions) and is fixed for the lifetime of the session.
// Today it is constructed in code; the types ensure the shape is correct
// regardless of where the values come from.
//
// Relationship to existing types:
//   DocType, RiskLevel, SelfieCaptureMode — imported from lib/types.ts (not redefined)
//   DocTypeConfig in lib/constants.ts     — per-doc UI metadata; this file adds
//                                           capture and flow requirements on top

// ─── Country ──────────────────────────────────────────────────────────────────

/**
 * A country entry in the flow's supported-country list.
 *
 * The display `name` is what the user sees in the picker and what the machine
 * stores in `VerificationContext.country`.
 *
 * `isoCode` is optional in the demo (country list uses display names) but
 * should be populated in production for API normalization and risk lookups.
 *
 * `riskOverride` pins the risk classification for this country, bypassing the
 * default derivation in `lib/riskData.ts`. Used when the backend's risk service
 * provides an authoritative classification that should not be overridden locally.
 */
export interface SupportedCountry {
  /** Display name shown in the country picker (e.g. 'United Kingdom'). */
  name: string
  /**
   * ISO 3166-1 alpha-2 code (e.g. 'GB').
   * Optional for the demo; required in production for API calls and analytics.
   */
  isoCode?: string
  /**
   * If present, overrides the locally-derived risk level for this country.
   * Production: always provided by the backend risk service.
   */
  riskOverride?: RiskLevel
}

// ─── Document capture rules ───────────────────────────────────────────────────

/**
 * Capture requirements for a specific document type.
 *
 * These rules are evaluated before the capture steps begin — they determine
 * which physical capture actions are needed and what fallbacks are available.
 * They are distinct from the visual metadata (`DocTypeConfig`) in lib/constants.ts.
 */
export interface DocumentCaptureRules {
  /**
   * Whether a physical back-side scan is required for this document.
   *
   * True for two-sided documents (driver's license, national ID, residence
   * permit). False for single-page documents (passport).
   *
   * When true, the machine must pass through `capturing_document_back` and
   * `reviewing_document_back` before proceeding to biometrics.
   */
  backSideRequired: boolean
  /**
   * Whether the user may substitute a gallery/file upload for the live camera.
   *
   * Typically true for document capture (lower fraud risk than selfie upload).
   * Should be false for selfie and liveness steps.
   *
   * When true, `canUploadFallback()` in lib/machine/selectors.ts returns true
   * and the capture screen renders the upload affordance.
   */
  uploadFallbackAllowed: boolean
}

// ─── Document type config ─────────────────────────────────────────────────────

/**
 * A single entry in the flow's document catalog.
 *
 * `supportedCountries` scopes the document to specific issuing countries.
 * If absent or empty, the document is valid for all countries in the flow.
 * This supports flows where, e.g., a passport is accepted globally but a
 * national ID is only accepted for EU issuers.
 *
 * `capture` defines what is physically required to scan this document.
 * These rules drive the machine's transition path through capturing/reviewing
 * states, not just the UI.
 */
export interface DocumentTypeConfig {
  /** Identifies the document type. Must be a value from the `DocType` union. */
  docType: DocType
  /** Human-readable display label for use in the UI. */
  label: string
  /**
   * ISO country codes or display names for which this document type is accepted.
   * If absent, accepted for all supported countries.
   */
  supportedCountries?: string[]
  /** Capture rules — what is required to acquire this document. */
  capture: DocumentCaptureRules
}

// ─── Face capture config ──────────────────────────────────────────────────────

/**
 * Configuration for the face-capture (selfie) step.
 *
 * `required` makes the selfie step mandatory — when false, the machine may
 * skip `capturing_face` entirely (e.g. document-only flows, or flows where
 * the face check is done server-side from the document photo).
 *
 * `mode` selects the capture mechanism. Only 'photo' is fully implemented;
 * 'video' and 'motion' render stubs until the respective providers are wired.
 * Production: resolved from session config so the backend controls the mode
 * per risk level or jurisdiction.
 */
export interface FaceCaptureConfig {
  /** Whether the selfie step is required in this flow. */
  required: boolean
  /**
   * Capture mechanism.
   * 'photo'  — single auto-captured frame (implemented)
   * 'video'  — short video clip (stub)
   * 'motion' — passive liveness via head movement tracking (stub)
   */
  mode: SelfieCaptureMode
}

// ─── Liveness config ──────────────────────────────────────────────────────────

/**
 * Configuration for the liveness-verification step.
 *
 * Liveness is always downstream of face capture — it cannot be required
 * if `FaceCaptureConfig.required` is false.
 *
 * `maxAttempts` caps how many times the user may retry before the machine
 * escalates to `unrecoverable_failure`. If absent, the machine uses
 * `DEFAULT_MAX_ATTEMPTS` from lib/machine/selectors.ts.
 *
 * Production: `required` is often determined by the risk service at session
 * creation time rather than derived locally from country/document rules.
 */
export interface LivenessConfig {
  /** Whether liveness verification is required in this flow. */
  required: boolean
  /**
   * Maximum retry attempts for the liveness step before escalation.
   * If absent, defaults to `DEFAULT_MAX_ATTEMPTS` (currently 3).
   */
  maxAttempts?: number
}

// ─── Outcome config ───────────────────────────────────────────────────────────

/**
 * Describes which non-terminal outcomes the backend may return for this session.
 *
 * These flags allow the machine and UI to be configured for the specific
 * outcome surface a given client or jurisdiction exposes — not all backends
 * support every outcome type.
 *
 * When a flag is false, the corresponding machine state is unreachable:
 * the machine should treat an unexpected outcome from the backend as an error.
 */
export interface OutcomeConfig {
  /**
   * Whether the backend may place the submission in manual review.
   * When true, `pending_manual_review` is a reachable machine state and
   * the OutcomeScreen 'pending' variant must be rendered correctly.
   */
  manualReviewPossible: boolean
  /**
   * Whether the backend may request additional steps from the user
   * (e.g. supplementary document, address proof, video call).
   * When true, `additional_step_required` is a reachable machine state.
   */
  additionalStepsPossible: boolean
}

// ─── Full session config ──────────────────────────────────────────────────────

/**
 * Complete configuration for a verification session.
 *
 * This is the top-level object the flow receives at initialization. It drives:
 *   - which screens are reachable (via supportedCountries, supportedDocuments)
 *   - which capture steps are required (faceCapture, liveness)
 *   - which outcome states are reachable (outcomes)
 *
 * Today this is constructed statically (see lib/config/defaults.ts — future).
 * Production: returned by POST /sessions and cached for the session lifetime.
 *
 * The config is intentionally separate from `VerificationContext` (which
 * tracks runtime state) — config is read-only after initialization, while
 * context is mutated by every machine transition.
 */
export interface VerificationFlowConfig {
  /** Countries available in the country picker. */
  supportedCountries: SupportedCountry[]
  /** Document types available for selection, with their capture rules. */
  supportedDocuments: DocumentTypeConfig[]
  /** Face capture (selfie) requirements for this session. */
  faceCapture: FaceCaptureConfig
  /** Liveness verification requirements for this session. */
  liveness: LivenessConfig
  /** Backend outcome expectations — controls reachable result states. */
  outcomes: OutcomeConfig
}
