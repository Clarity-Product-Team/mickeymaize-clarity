import type { DocType } from '@/lib/types'
import type {
  ApiResponse,
  BackendDocumentConfig,
  BackendRequiredStep,
  BackendSessionStatus,
  BackendStepType,
  BackendWorkflowRequirements,
  FetchStatusRequest,
  FetchStatusResponse,
  QualityCheckResult,
  ResumeSessionRequest,
  ResumeSessionResponse,
  SessionSummary,
  StartSessionRequest,
  StartSessionResponse,
  SubmitStepRequest,
  SubmitStepResponse,
  UploadDocumentRequest,
  UploadDocumentResponse,
  UploadFaceRequest,
  UploadFaceResponse,
  UploadLivenessRequest,
  UploadLivenessResponse,
} from './types'
import type { VerificationService } from './service'

// ─── Mock delay constants ─────────────────────────────────────────────────────
//
// Ranges simulate realistic network latency without making the dev loop slow.
// Upload operations are slower (file transfer); reads are fast.

const DELAY = {
  session:  [280, 480],   // start / resume
  upload:   [700, 1100],  // document, face, liveness file transfer
  submit:   [350, 550],   // step submission + backend pipeline trigger
  status:   [180, 280],   // polling call
} as const

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function sleep(minMs: number, maxMs = minMs): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs)
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let _counter = 1
function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(_counter++).toString(36)}`
}

function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data, error: null }
}

function err(code: string, message: string, retryable = false): ApiResponse<never> {
  return { ok: false, data: null, error: { code, message, retryable } }
}

function isoNow(): string {
  return new Date().toISOString()
}

function isoIn(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString()
}

// ─── Mock session state ───────────────────────────────────────────────────────

interface MockSessionState {
  sessionId: string
  token: string
  status: BackendSessionStatus
  startedAt: string
  expiresAt: string
  requirements: BackendWorkflowRequirements
  /** DocType selected by the user — set on first document upload. */
  selectedDocType: DocType | null
  /** Artifacts uploaded so far: uploadId → step type. */
  uploads: Map<string, BackendStepType>
  /** Steps that have been explicitly submitted by the client. */
  submittedSteps: Set<BackendStepType>
  /** How many times fetchStatus has been called since the last submitStep. */
  statusPollCount: number
}

/** In-memory store — keyed by sessionId. Survives the session duration but not a page reload. */
const sessions = new Map<string, MockSessionState>()

function getSession(sessionId: string): MockSessionState | null {
  return sessions.get(sessionId) ?? null
}

function requireSession(
  sessionId: string,
): MockSessionState | ApiResponse<never> {
  const session = getSession(sessionId)
  if (!session) {
    return err('SESSION_NOT_FOUND', `No session with id '${sessionId}'. Sessions are in-memory only — a page reload clears all state.`)
  }
  if (session.status === 'expired') {
    return err('SESSION_EXPIRED', 'This verification session has expired. Start a new session.', false)
  }
  if (session.status === 'cancelled') {
    return err('SESSION_CANCELLED', 'This session was cancelled and cannot be resumed.', false)
  }
  return session
}

// ─── Workflow requirements variants ──────────────────────────────────────────
//
// Two named variants are available via the `flowVersion` field in
// StartSessionRequest. The default ('standard') covers most demo scenarios.

const ALL_DOCS: BackendDocumentConfig[] = [
  { docType: 'passport',          label: 'Passport',          backSideRequired: false, uploadFallbackAllowed: true },
  { docType: 'drivers-license',   label: "Driver's License",  backSideRequired: true,  uploadFallbackAllowed: true },
  { docType: 'national-id',       label: 'National ID',       backSideRequired: true,  uploadFallbackAllowed: true },
  { docType: 'residence-permit',  label: 'Residence Permit',  backSideRequired: true,  uploadFallbackAllowed: true },
]

const STANDARD_REQUIREMENTS: BackendWorkflowRequirements = {
  supportedCountryCodes: ['GB', 'US', 'DE', 'FR', 'NL', 'CA', 'AU', 'ES', 'IT', 'IL'],
  supportedDocuments: ALL_DOCS,
  faceCapture: { required: true, mode: 'photo' },
  liveness:    { required: false },
  outcomes:    { manualReviewPossible: true, additionalStepsPossible: false },
}

const HIGH_RISK_REQUIREMENTS: BackendWorkflowRequirements = {
  supportedCountryCodes: [
    'GB', 'US', 'DE', 'FR', 'NL', 'CA', 'AU', 'ES', 'IT', 'IL',
    'NG', 'PK', 'PH', 'EG', 'MA', 'BD', 'JO', 'SN', 'VN',
    'AF', 'IR', 'MM', 'SY', 'YE',
  ],
  supportedDocuments: ALL_DOCS,
  faceCapture: { required: true, mode: 'photo' },
  liveness:    { required: true, maxAttempts: 2 },
  outcomes:    { manualReviewPossible: true, additionalStepsPossible: true },
}

function pickRequirements(flowVersion?: string): BackendWorkflowRequirements {
  if (flowVersion === 'high_risk') return HIGH_RISK_REQUIREMENTS
  return STANDARD_REQUIREMENTS
}

// ─── Next-step derivation ─────────────────────────────────────────────────────
//
// Determines what the backend expects next based on which steps have been
// submitted. The mock uses the selected document type (if known) to decide
// whether back-side capture is required.

function deriveNextStep(state: MockSessionState): BackendRequiredStep | null {
  const { submittedSteps, requirements, selectedDocType } = state

  if (!submittedSteps.has('document_front')) {
    return { type: 'document_front', retryable: true, maxAttempts: 3 }
  }

  // Back-side required when the selected doc type requires it.
  // If no doc has been selected yet, check if any supported doc could need it.
  const needsBack = selectedDocType !== null
    ? requirements.supportedDocuments.find((d) => d.docType === selectedDocType)?.backSideRequired ?? false
    : requirements.supportedDocuments.some((d) => d.backSideRequired)

  if (needsBack && !submittedSteps.has('document_back')) {
    return {
      type: 'document_back',
      documentType: selectedDocType ?? undefined,
      retryable: true,
      maxAttempts: 3,
    }
  }

  if (requirements.faceCapture.required && !submittedSteps.has('face_capture')) {
    return { type: 'face_capture', retryable: true, maxAttempts: 3 }
  }

  if (requirements.liveness.required && !submittedSteps.has('liveness')) {
    return {
      type: 'liveness',
      retryable: true,
      maxAttempts: requirements.liveness.maxAttempts ?? 3,
    }
  }

  return null // all required steps collected
}

// ─── Mock quality checks ──────────────────────────────────────────────────────
//
// Returned by upload endpoints as preliminary feedback.
// These simulate what the backend would check synchronously during upload
// (not the full async validation pipeline).

function mockDocQualityChecks(): QualityCheckResult[] {
  return [
    { name: 'blur',     passed: true, score: 0.92 },
    { name: 'glare',    passed: true, score: 0.88 },
    { name: 'partial',  passed: true, score: 0.97 },
  ]
}

function mockFaceQualityChecks(): QualityCheckResult[] {
  return [
    { name: 'face_centered', passed: true, score: 0.95 },
    { name: 'low_light',     passed: true, score: 0.89 },
    { name: 'too_far',       passed: true, score: 0.91 },
  ]
}

// ─── Session summary builder ──────────────────────────────────────────────────

function toSessionSummary(state: MockSessionState): SessionSummary {
  return {
    sessionId: state.sessionId,
    status:    state.status,
    expiresAt: state.expiresAt,
  }
}

// ─── Mock service implementation ──────────────────────────────────────────────
//
// Each function simulates the relevant network round-trip.
//
// KEY SEPARATION — upload success ≠ verification success:
//
//   upload*()    → puts artifacts on the backend; returns uploadId + preliminary
//                  quality checks. Session status stays 'collecting_inputs'.
//                  This is analogous to the file landing on S3 — not yet processed.
//
//   submitStep() → tells the backend to run its validation pipeline on the
//                  uploaded artifact. Status advances step-by-step.
//                  Only after the LAST step is submitted does status move to
//                  'processing', and only fetchStatus() returns the final
//                  outcome ('approved' / 'rejected').
//
//   fetchStatus()→ the only place where verification success is communicated.
//                  Returns 'processing' for the first poll, then 'approved'
//                  to simulate a short async pipeline.

export const mockVerificationService: VerificationService = {

  // ── Start session ────────────────────────────────────────────────────────────

  async startSession(req: StartSessionRequest) {
    await sleep(...DELAY.session)

    const sessionId = generateId('ses')
    const token     = generateId('tok')
    const requirements = pickRequirements(req.flowVersion)

    const state: MockSessionState = {
      sessionId,
      token,
      status:          'collecting_inputs',
      startedAt:       isoNow(),
      expiresAt:       isoIn(30),
      requirements,
      selectedDocType: null,
      uploads:         new Map(),
      submittedSteps:  new Set(),
      statusPollCount: 0,
    }
    sessions.set(sessionId, state)

    return ok<StartSessionResponse>({
      session:      toSessionSummary(state),
      token,
      requirements,
    })
  },

  // ── Resume session ────────────────────────────────────────────────────────────
  //
  // Real-world: validates the session token, refreshes it, and returns current
  // progress. Mock: looks up in-memory state; fails on unknown IDs (page reload).

  async resumeSession(req: ResumeSessionRequest) {
    await sleep(...DELAY.session)

    const session = requireSession(req.sessionId)
    if (!('sessionId' in session)) return session  // narrowed to ApiResponse<never>

    // Refresh token for the resumed session
    const newToken = generateId('tok')
    session.token  = newToken

    return ok<ResumeSessionResponse>({
      session:  toSessionSummary(session),
      token:    newToken,
      requirements: session.requirements,
      nextStep: deriveNextStep(session),
    })
  },

  // ── Upload document ───────────────────────────────────────────────────────────
  //
  // Accepts front or back. Records the selected docType from the first upload.
  // Returns a preliminary quality check — NOT the final validation result.
  // Session status does NOT advance here; it stays 'collecting_inputs'.

  async uploadDocument(req: UploadDocumentRequest) {
    await sleep(...DELAY.upload)

    const session = requireSession(req.sessionId)
    if (!('sessionId' in session)) return session

    // Record which document type was selected (from the first upload)
    if (session.selectedDocType === null) {
      session.selectedDocType = req.docType
    }

    const uploadId = generateId('upl')
    const stepType: BackendStepType = req.side === 'front' ? 'document_front' : 'document_back'
    session.uploads.set(uploadId, stepType)

    return ok<UploadDocumentResponse>({
      uploadId,
      side:          req.side,
      qualityChecks: mockDocQualityChecks(),
      acceptable:    true,
    })
  },

  // ── Upload face capture ───────────────────────────────────────────────────────
  //
  // Same pattern as document upload: artifact lands on backend, preliminary
  // checks run, but the face-match pipeline does not run until submitStep().

  async uploadFace(req: UploadFaceRequest) {
    await sleep(...DELAY.upload)

    const session = requireSession(req.sessionId)
    if (!('sessionId' in session)) return session

    const uploadId = generateId('upl')
    session.uploads.set(uploadId, 'face_capture')

    return ok<UploadFaceResponse>({
      uploadId,
      qualityChecks: mockFaceQualityChecks(),
      acceptable:    true,
    })
  },

  // ── Upload liveness capture ───────────────────────────────────────────────────
  //
  // Accepts either a livenessToken (from a provider SDK) or a raw file.
  // The mock treats both equally: record the upload, return a stub score.
  // Liveness validation does not run until submitStep().

  async uploadLiveness(req: UploadLivenessRequest) {
    await sleep(...DELAY.upload)

    const session = requireSession(req.sessionId)
    if (!('sessionId' in session)) return session

    const uploadId = generateId('upl')
    session.uploads.set(uploadId, 'liveness')

    return ok<UploadLivenessResponse>({
      uploadId,
      livenessScore: 0.94,   // stub confidence score
      acceptable:    true,
    })
  },

  // ── Submit step ───────────────────────────────────────────────────────────────
  //
  // This is the boundary between "artifact uploaded" and "step validated".
  // The backend runs its pipeline here (document OCR, face match, liveness check).
  //
  // When the last required step is submitted, status moves to 'processing'.
  // The frontend should then poll fetchStatus() for the final outcome.

  async submitStep(req: SubmitStepRequest) {
    await sleep(...DELAY.submit)

    const session = requireSession(req.sessionId)
    if (!('sessionId' in session)) return session

    // Verify all provided uploadIds belong to this session
    for (const uploadId of req.uploadIds) {
      if (!session.uploads.has(uploadId)) {
        return err(
          'UPLOAD_NOT_FOUND',
          `Upload '${uploadId}' does not belong to session '${req.sessionId}'.`,
          false,
        )
      }
    }

    session.submittedSteps.add(req.step)
    session.statusPollCount = 0 // reset polling counter for next fetchStatus

    const nextStep = deriveNextStep(session)

    if (nextStep === null) {
      // All required steps collected — pipeline begins
      session.status = 'processing'
    } else {
      session.status = 'collecting_inputs'
    }

    return ok<SubmitStepResponse>({
      sessionId:     session.sessionId,
      submittedStep: req.step,
      status:        session.status,
      nextStep,
    })
  },

  // ── Fetch verification status ─────────────────────────────────────────────────
  //
  // The only endpoint that communicates final verification success.
  //
  // While status is 'processing', returns 'processing' on the first poll,
  // then 'approved' + outcome 'verified' on subsequent polls — simulating a
  // short async backend pipeline. This matches real KYC backends that process
  // asynchronously after all inputs are collected.

  async fetchStatus(req: FetchStatusRequest) {
    await sleep(...DELAY.status)

    const session = requireSession(req.sessionId)
    if (!('sessionId' in session)) return session

    session.statusPollCount++

    // Still collecting inputs — not all steps submitted yet
    if (session.status === 'collecting_inputs') {
      return ok<FetchStatusResponse>({
        sessionId:     session.sessionId,
        status:        'collecting_inputs',
        retryAllowed:  true,
        updatedAt:     isoNow(),
      })
    }

    // Processing: first poll returns 'processing', second returns final result.
    // This simulates the async pipeline completing between polls.
    if (session.status === 'processing') {
      if (session.statusPollCount === 1) {
        return ok<FetchStatusResponse>({
          sessionId:    session.sessionId,
          status:       'processing',
          retryAllowed: false,
          updatedAt:    isoNow(),
        })
      }

      // Pipeline complete — mock always approves
      session.status = 'approved'
    }

    // Terminal: approved
    if (session.status === 'approved') {
      return ok<FetchStatusResponse>({
        sessionId:    session.sessionId,
        status:       'approved',
        outcome:      'verified',
        retryAllowed: false,
        updatedAt:    isoNow(),
      })
    }

    // Fallback for any other terminal status (rejected, expired, cancelled)
    return ok<FetchStatusResponse>({
      sessionId:    session.sessionId,
      status:       session.status,
      outcome:      'rejected',
      retryAllowed: false,
      updatedAt:    isoNow(),
    })
  },
}
