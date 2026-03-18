import type {
  ApiResponse,
  FetchStatusRequest,
  FetchStatusResponse,
  ResumeSessionRequest,
  ResumeSessionResponse,
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

// ─── Service interface ────────────────────────────────────────────────────────
//
// A stable contract that both the mock and the real HTTP service implement.
// Callers import VerificationService and receive whichever implementation
// is injected — no code changes required when switching from mock to real.
//
// Intentionally omits FetchWorkflow and FetchNextStep for now; those are
// included in StartSession and SubmitStep responses respectively.

export interface VerificationService {
  startSession(req: StartSessionRequest): Promise<ApiResponse<StartSessionResponse>>
  resumeSession(req: ResumeSessionRequest): Promise<ApiResponse<ResumeSessionResponse>>
  uploadDocument(req: UploadDocumentRequest): Promise<ApiResponse<UploadDocumentResponse>>
  uploadFace(req: UploadFaceRequest): Promise<ApiResponse<UploadFaceResponse>>
  uploadLiveness(req: UploadLivenessRequest): Promise<ApiResponse<UploadLivenessResponse>>
  submitStep(req: SubmitStepRequest): Promise<ApiResponse<SubmitStepResponse>>
  fetchStatus(req: FetchStatusRequest): Promise<ApiResponse<FetchStatusResponse>>
}
