import type { DocType, VerificationOutcome } from '@/lib/types'

// ─── Overview ─────────────────────────────────────────────────────────────────
//
// This file defines the TypeScript contracts for a production verification
// backend. It describes the shape of every HTTP request and response the
// frontend sends or receives during a verification session.
//
// Design principles:
//   - Provider-agnostic: no Onfido, Jumio, or Persona specifics.
//   - Envelope-typed: every response is wrapped in ApiResponse<T> so callers
//     get a discriminated union rather than try/catch around JSON.parse.
//   - Reuses existing domain types (DocType, VerificationOutcome) rather than
//     redefining them.
//   - Maps cleanly to VerificationContext — field names are chosen to make the
//     service layer's mapping work straightforward.
//
// What lives here:   shared primitives, per-operation Request/Response pairs.
// What does NOT live here:  fetch() calls, retry logic, auth headers, caching.
// Those belong in the service layer (lib/api/service.ts — future step).

// ─── Shared primitives ────────────────────────────────────────────────────────

/**
 * Generic response envelope used for every backend call.
 *
 * Discriminated on `ok` so callers can narrow without try/catch:
 *
 *   const res = await startSession(req)
 *   if (!res.ok) { handleError(res.error); return }
 *   const { sessionId } = res.data
 */
export type ApiResponse<T> =
  | { ok: true;  data: T;    error: null }
  | { ok: false; data: null; error: BackendError }

/**
 * Structured error returned by the backend on any non-2xx response.
 *
 * `retryable` indicates whether the same request can be resent without
 * modification. True for transient failures (rate limit, 503). False for
 * client errors (invalid session, already approved).
 */
export interface BackendError {
  /** Machine-readable error code (e.g. 'SESSION_EXPIRED', 'UPLOAD_TOO_LARGE'). */
  code: string
  /** Human-readable message for developer logging — never shown to end users. */
  message: string
  /** Whether sending the same request again might succeed. */
  retryable: boolean
  /** HTTP status code, when available. */
  httpStatus?: number
}

/**
 * Result of a single quality or authenticity check performed on an upload.
 *
 * Returned by document, face, and liveness upload endpoints so the frontend
 * can show per-check pass/fail indicators in the review step.
 */
export interface QualityCheckResult {
  /** Short identifier for the check (e.g. 'blur', 'glare', 'face_centered'). */
  name: string
  /** Whether the check passed. */
  passed: boolean
  /**
   * Confidence score, 0–1. Present only when the backend returns granular
   * signal (e.g. ML-based checks). Absent for binary pass/fail checks.
   */
  score?: number
  /** Backend-provided explanation when the check fails. */
  failReason?: string
}

// ─── Backend session status ───────────────────────────────────────────────────

/**
 * The backend's view of where a verification session is in its lifecycle.
 *
 * Mapping to frontend VerificationStateName (machine states):
 *
 *   initiated            → idle / intro
 *   collecting_inputs    → any capture state (document, face, liveness)
 *   validating_inputs    → any validating_* state
 *   processing           → processing / awaiting_backend_result
 *   needs_retry          → retryable_failure
 *   needs_additional_step→ additional_step_required
 *   manual_review        → pending_manual_review
 *   approved             → verified              (VerificationOutcome: 'verified')
 *   rejected             → unrecoverable_failure (VerificationOutcome: 'rejected')
 *   expired              → unrecoverable_failure (VerificationOutcome: 'rejected')
 *   cancelled            → cancelled
 */
export type BackendSessionStatus =
  | 'initiated'
  | 'collecting_inputs'
  | 'validating_inputs'
  | 'processing'
  | 'needs_retry'
  | 'needs_additional_step'
  | 'manual_review'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'cancelled'

/** Terminal backend statuses — no further transitions are possible. */
export const TERMINAL_BACKEND_STATUSES = new Set<BackendSessionStatus>([
  'approved',
  'rejected',
  'expired',
  'cancelled',
])

// ─── Step types ───────────────────────────────────────────────────────────────

/**
 * Step types the backend recognises and can request.
 *
 * Extends the frontend's FlowStepId with additional steps the backend may
 * require that have no current UI implementation (e.g. video_call).
 *
 * Mapping to FlowStepId:
 *   document_front → 'document_front'
 *   document_back  → 'document_back'
 *   face_capture   → 'face_capture'
 *   liveness       → 'liveness'
 *   address_proof / video_call / custom → future / additional_step_required
 */
export type BackendStepType =
  | 'document_front'
  | 'document_back'
  | 'face_capture'
  | 'liveness'
  | 'address_proof'   // supplementary document — maps to additional_step_required
  | 'video_call'      // agent-assisted call — maps to additional_step_required
  | 'custom'          // backend-defined step — requires custom handling

/**
 * A required step returned by the backend.
 *
 * Consumed by the frontend to decide which capture screen to navigate to
 * and what constraints apply (retry limit, upload fallback availability).
 */
export interface BackendRequiredStep {
  type: BackendStepType
  /**
   * Which document type is expected for this step, when applicable.
   * Typically set for document_front and document_back steps on resume flows
   * where the document type was already selected.
   */
  documentType?: DocType
  /** Backend-provided guidance text for this step. May be shown in the UI. */
  instructions?: string
  /** Whether this step can be attempted again if it fails. */
  retryable: boolean
  /** Maximum retries allowed for this step. Absent → use client-side default. */
  maxAttempts?: number
}

// ─── Session lifecycle ────────────────────────────────────────────────────────

/**
 * Lightweight session representation included in every session response.
 *
 * Maps to VerificationContext:
 *   sessionId → context.sessionId
 *   expiresAt → (future) context.expiresAt
 *   status    → machine state (via mapBackendStatusToMachineState — service layer)
 */
export interface SessionSummary {
  sessionId: string
  status: BackendSessionStatus
  /** ISO 8601 timestamp when the session token expires. */
  expiresAt: string
}

// ─── Workflow requirements ────────────────────────────────────────────────────

/**
 * Per-document requirements as returned by the backend.
 *
 * Maps to DocumentTypeConfig in lib/config/types.ts:
 *   docType              → DocumentTypeConfig.docType
 *   label                → DocumentTypeConfig.label
 *   backSideRequired     → DocumentTypeConfig.capture.backSideRequired
 *   uploadFallbackAllowed→ DocumentTypeConfig.capture.uploadFallbackAllowed
 */
export interface BackendDocumentConfig {
  docType: DocType
  label: string
  /** ISO country codes for which this document is accepted. Absent = all. */
  supportedCountryCodes?: string[]
  backSideRequired: boolean
  uploadFallbackAllowed: boolean
}

/**
 * The complete workflow requirements for a session, as returned by the backend.
 *
 * This is the authoritative source of truth for what steps the session needs.
 * The frontend uses it to populate VerificationFlowConfig via a service-layer
 * adapter (mapWorkflowRequirementsToFlowConfig — future step).
 *
 * Maps to VerificationFlowConfig:
 *   supportedCountryCodes → SupportedCountry[] (service layer hydrates names)
 *   supportedDocuments    → DocumentTypeConfig[]
 *   faceCapture.*         → FaceCaptureConfig
 *   liveness.*            → LivenessConfig
 *   outcomes.*            → OutcomeConfig
 */
export interface BackendWorkflowRequirements {
  /** ISO 3166-1 alpha-2 codes for the countries the user may select. */
  supportedCountryCodes: string[]
  /** Document types the backend will accept for this session. */
  supportedDocuments: BackendDocumentConfig[]
  faceCapture: {
    required: boolean
    /** Capture mode. The backend may specify 'video' for higher-assurance flows. */
    mode: 'photo' | 'video' | 'motion'
  }
  liveness: {
    required: boolean
    maxAttempts?: number
  }
  outcomes: {
    manualReviewPossible: boolean
    additionalStepsPossible: boolean
  }
}

// ─── Session operations ───────────────────────────────────────────────────────

// ── Start session ────────────────────────────────────────────────────────────

export interface StartSessionRequest {
  /**
   * Opaque applicant identifier from the integrating system.
   * Used to associate the verification with an existing user record.
   * If absent, the backend creates an anonymous session.
   */
  applicantId?: string
  /**
   * Client-defined metadata attached to the session (key–value pairs).
   * Passed through to webhooks and the session audit log.
   */
  metadata?: Record<string, string>
  /**
   * Requested flow version or variant identifier.
   * If absent, the backend uses the client's default configured flow.
   */
  flowVersion?: string
}

export interface StartSessionResponse {
  session: SessionSummary
  /**
   * Short-lived bearer token used to authenticate all subsequent requests
   * in this session. Rotate on RESUME for long-running sessions.
   */
  token: string
  requirements: BackendWorkflowRequirements
}

// ── Resume session ────────────────────────────────────────────────────────────

/**
 * Sent when the user returns to an in-progress session (e.g. after closing
 * and reopening the browser tab).
 */
export interface ResumeSessionRequest {
  sessionId: string
}

export interface ResumeSessionResponse {
  session: SessionSummary
  /** Refreshed token for the resumed session. */
  token: string
  requirements: BackendWorkflowRequirements
  /** The step the backend expects next, or null if all inputs are collected. */
  nextStep: BackendRequiredStep | null
}

// ── Fetch workflow requirements ───────────────────────────────────────────────

/**
 * GET /sessions/:sessionId/requirements
 * No request body — sessionId is a path parameter.
 */
export interface FetchWorkflowRequest {
  sessionId: string
}

export interface FetchWorkflowResponse {
  sessionId: string
  requirements: BackendWorkflowRequirements
  /** Current step the backend is waiting on. Null if all inputs are collected. */
  currentStep: BackendRequiredStep | null
}

// ─── Upload operations ────────────────────────────────────────────────────────
//
// The `file` field is typed as `Blob | File` (browser-compatible).
// The service layer is responsible for serializing these as multipart/form-data.
// `capturedAt` is an ISO 8601 timestamp recorded by the client at the moment
// of capture — used for audit logging and freshness validation.

// ── Upload document ───────────────────────────────────────────────────────────

export interface UploadDocumentRequest {
  sessionId: string
  side: 'front' | 'back'
  docType: DocType
  file: Blob | File
  mimeType: string
  /** ISO 8601 timestamp of when the capture was taken on the device. */
  capturedAt: string
}

export interface UploadDocumentResponse {
  /** Opaque identifier for this upload — included in SubmitStepRequest. */
  uploadId: string
  side: 'front' | 'back'
  /**
   * Preliminary quality checks run synchronously by the backend.
   * Not the final validation result — definitive validation is async.
   * Absent if the backend defers all checks to the processing stage.
   */
  qualityChecks?: QualityCheckResult[]
  /**
   * Whether the upload passed preliminary checks and is acceptable.
   * True does not guarantee final approval — it means the upload is usable.
   */
  acceptable: boolean
  /** Reason the upload was rejected, if acceptable is false. */
  rejectReason?: string
}

// ── Upload face capture ───────────────────────────────────────────────────────

export interface UploadFaceRequest {
  sessionId: string
  file: Blob | File
  mimeType: string
  capturedAt: string
}

export interface UploadFaceResponse {
  uploadId: string
  qualityChecks?: QualityCheckResult[]
  acceptable: boolean
  rejectReason?: string
}

// ── Upload liveness capture ───────────────────────────────────────────────────

/**
 * Liveness submissions differ from image uploads: the motion check is typically
 * orchestrated by a provider SDK that produces an opaque `livenessToken` rather
 * than a raw video file. Both patterns are supported here.
 *
 * When `livenessToken` is present, the service layer sends it as the proof
 * of completed liveness. When `file` is present, the backend performs its
 * own liveness analysis on the clip.
 */
export interface UploadLivenessRequest {
  sessionId: string
  /**
   * Opaque token produced by the liveness provider SDK after a successful
   * motion check. Present when using a provider-side liveness component.
   */
  livenessToken?: string
  /**
   * Raw liveness clip. Present when the backend performs its own analysis.
   * Mutually exclusive with `livenessToken` — only one should be set.
   */
  file?: Blob | File
  mimeType?: string
  capturedAt: string
}

export interface UploadLivenessResponse {
  uploadId: string
  /** Liveness confidence score, 0–1. Present when the backend scores it. */
  livenessScore?: number
  acceptable: boolean
  rejectReason?: string
}

// ─── Step submission ──────────────────────────────────────────────────────────

/**
 * Tells the backend that a step is complete and provides the upload ID(s)
 * for the artifacts captured in that step.
 *
 * Distinct from upload: uploading puts the file on the backend; submitting
 * tells the backend to run its validation pipeline on it.
 */
export interface SubmitStepRequest {
  sessionId: string
  step: BackendStepType
  /**
   * Upload IDs for all artifacts required by this step.
   * For document_front and document_back: one ID each.
   * For face_capture: one ID.
   * For liveness: one ID (the liveness upload, or absent if token-based).
   */
  uploadIds: string[]
}

export interface SubmitStepResponse {
  sessionId: string
  submittedStep: BackendStepType
  /** Backend status after evaluating the submission. */
  status: BackendSessionStatus
  /** The next step the backend expects, or null if all inputs are collected. */
  nextStep: BackendRequiredStep | null
  /**
   * Human-readable message about the submission result.
   * For developer logging or support tools — not shown to the end user.
   */
  message?: string
}

// ─── Status and polling ───────────────────────────────────────────────────────

// ── Fetch status ─────────────────────────────────────────────────────────────

/** GET /sessions/:sessionId/status — no request body */
export interface FetchStatusRequest {
  sessionId: string
}

export interface FetchStatusResponse {
  sessionId: string
  status: BackendSessionStatus
  /**
   * Present when status is 'approved' or 'rejected'.
   *
   * Maps to VerificationOutcome:
   *   approved          → 'verified'
   *   rejected          → 'rejected'
   *   manual_review     → 'pending'
   *   needs_additional_step → 'additional_step'
   *   needs_retry       → 'retry'
   */
  outcome?: VerificationOutcome
  /**
   * Opaque token for manual review tracking or support escalation.
   * Present when status is 'manual_review'. Maps to context.reviewToken.
   */
  reviewToken?: string
  /** Reason for rejection or retry requirement. Maps to context.failureReason. */
  failureReason?: string
  /** Whether the session can still be retried or resumed. */
  retryAllowed: boolean
  /** ISO 8601 timestamp of the most recent status change. */
  updatedAt: string
}

// ── Fetch next required step ──────────────────────────────────────────────────

/** GET /sessions/:sessionId/next-step — no request body */
export interface FetchNextStepRequest {
  sessionId: string
}

export interface FetchNextStepResponse {
  sessionId: string
  /** The next step the backend is waiting on. Null when all steps are complete. */
  nextStep: BackendRequiredStep | null
  /** Current session status at the time of the request. */
  status: BackendSessionStatus
}
