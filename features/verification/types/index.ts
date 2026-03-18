// ─── Verification domain types ────────────────────────────────────────────────
//
// Public type surface for the verification feature.
//
// Consumers should import from this barrel rather than from the individual
// machine/config/services sub-modules, so that internal reorganisation of
// those modules does not require changes at the call site.

export type { VerificationStateName } from '../machine/states'
export type { VerificationEvent, VerificationEventType }     from '../machine/events'
export type { VerificationContext, CaptureArtifact, AttemptRecord } from '../machine/context'

export type {
  VerificationFlowConfig,
  SupportedCountry,
  DocumentTypeConfig,
  FaceCaptureConfig,
  LivenessConfig,
  OutcomeConfig,
} from '../config/types'

export type {
  VerificationService,
} from '../services/service'

export type {
  BackendSessionStatus,
  BackendStepType,
  BackendRequiredStep,
  ApiResponse,
  StartSessionResponse,
  ResumeSessionResponse,
  UploadDocumentResponse,
  UploadFaceResponse,
  FetchStatusResponse,
  SubmitStepResponse,
} from '../services/types'
