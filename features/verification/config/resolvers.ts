import type { DocType } from '@/lib/types'
import type {
  DocumentTypeConfig,
  VerificationFlowConfig,
} from './types'

// ─── Resolver return types ────────────────────────────────────────────────────

/**
 * High-level step identifiers for the capture journey.
 *
 * These are intentionally coarser than `VerificationStateName` — each id
 * maps to multiple machine states (capturing + validating + reviewing).
 * The machine-state expansion happens in a future integration layer.
 */
export type FlowStepId =
  | 'document_front'   // capturing + validating + reviewing front
  | 'document_back'    // capturing + validating + reviewing back
  | 'face_capture'     // capturing + validating face
  | 'liveness'         // capturing + validating motion
  | 'processing'       // uploading + processing + awaiting result

/** A single resolved step in the user's capture journey. */
export interface ResolvedFlowStep {
  /** Step identifier — stable key for list rendering and machine mapping. */
  id: FlowStepId
  /** Display label shown in step indicators and progress summaries. */
  label: string
  /**
   * Whether this step is guaranteed to appear in the flow.
   * False means the step is conditional on a runtime factor (e.g. back-side
   * capture depends on the selected document type when docType is not yet known).
   */
  required: boolean
}

/**
 * High-level summary of the resolved flow.
 *
 * Used by the country/document selection screen to show a "what to expect"
 * journey hint before the user begins capturing.
 */
export interface ResolvedFlowSummary {
  /** Ordered steps the user will complete. */
  steps: ResolvedFlowStep[]
  /** Total count of steps that are definitely required. */
  requiredStepCount: number
  /** Whether any document in the config may require back-side capture. */
  backCapturePossible: boolean
  /** Whether liveness is definitely required for this session. */
  livenessRequired: boolean
}

// ─── Validation types ─────────────────────────────────────────────────────────

export type FlowConfigIssueLevel = 'error' | 'warning'

/**
 * A single validation finding for a `VerificationFlowConfig`.
 *
 * Errors represent invalid combinations that will cause the machine to fail
 * or produce unreachable states. Warnings represent unusual but technically
 * valid configurations that may produce unexpected UX.
 */
export interface FlowConfigIssue {
  level: FlowConfigIssueLevel
  /** Short machine-readable code for programmatic handling. */
  code: string
  /** Human-readable explanation of the issue. */
  message: string
}

/**
 * Result of `validateFlowConfig`.
 *
 * `valid` is true when there are no errors (warnings do not affect validity).
 * `issues` contains all errors and warnings, ordered errors-first.
 */
export interface FlowConfigValidation {
  valid: boolean
  issues: FlowConfigIssue[]
}

// ─── Document lookup ──────────────────────────────────────────────────────────

/**
 * Returns the `DocumentTypeConfig` for a given `docType`, or null if the
 * document type is not present in the config's supported documents list.
 *
 * All other document-specific resolvers call this internally.
 */
export function resolveDocumentConfig(
  config: VerificationFlowConfig,
  docType: DocType,
): DocumentTypeConfig | null {
  return config.supportedDocuments.find((d) => d.docType === docType) ?? null
}

// ─── Capture requirement resolvers ───────────────────────────────────────────

/**
 * Returns true if the selected document type requires a back-side scan.
 *
 * Returns false (safe default) when:
 * - The document type is not found in the config's supported documents.
 * - `docType` is null (selection not yet made).
 *
 * The machine uses this result to decide whether `capturing_document_back`
 * is reachable after `reviewing_document_front`.
 */
export function resolveBackSideRequired(
  config: VerificationFlowConfig,
  docType: DocType | null,
): boolean {
  if (!docType) return false
  return resolveDocumentConfig(config, docType)?.capture.backSideRequired ?? false
}

/**
 * Returns true if face capture (selfie) is required in this session.
 *
 * Reads directly from `config.faceCapture.required`.
 * When false, the machine skips `capturing_face` and `validating_face`.
 */
export function resolveFaceCaptureRequired(config: VerificationFlowConfig): boolean {
  return config.faceCapture.required
}

/**
 * Returns true if liveness verification is required in this session.
 *
 * Reads directly from `config.liveness.required`.
 * When false, the machine skips `capturing_motion` and `validating_motion`.
 *
 * Note: liveness requires face capture — an invalid config where
 * `liveness.required: true` and `faceCapture.required: false` is caught by
 * `validateFlowConfig`. In that case this resolver still returns the raw
 * config value; the caller is responsible for checking validation first.
 */
export function resolveLivenessRequired(config: VerificationFlowConfig): boolean {
  return config.liveness.required
}

/**
 * Returns true if the user may substitute a file upload for live camera
 * capture of the given document type.
 *
 * Returns false when:
 * - The document type is not found in the config's supported documents.
 * - `docType` is null.
 *
 * Used by `canUploadFallback()` in the machine selectors and by capture
 * screens to decide whether to show the "Upload a photo instead" affordance.
 */
export function resolveUploadFallbackAllowed(
  config: VerificationFlowConfig,
  docType: DocType | null,
): boolean {
  if (!docType) return false
  return resolveDocumentConfig(config, docType)?.capture.uploadFallbackAllowed ?? false
}

// ─── Step summary resolver ────────────────────────────────────────────────────

/** Step label strings — kept in the resolver layer, separate from screen copy. */
const STEP_LABELS: Record<FlowStepId, string> = {
  document_front: 'Scan document',
  document_back:  'Both sides',
  face_capture:   'Selfie',
  liveness:       'Presence check',
  processing:     'Verification',
}

/**
 * Derives the ordered list of user-visible steps for the flow.
 *
 * When `docType` is provided, back-side capture is included only if that
 * document requires it. When `docType` is null (selection not yet made),
 * back-side capture is included if ANY document in the config may require it —
 * marked as `required: false` to signal that it is conditional.
 *
 * The returned list is always in capture order and never contains duplicates.
 *
 * Usage: step indicators, "what to expect" journey hints, progress bar total.
 */
export function resolveFlowSteps(
  config: VerificationFlowConfig,
  docType: DocType | null = null,
): ResolvedFlowStep[] {
  const steps: ResolvedFlowStep[] = []

  // Document front — always required
  steps.push({ id: 'document_front', label: STEP_LABELS.document_front, required: true })

  // Document back — depends on selected document type
  const backRequired = resolveBackSideRequired(config, docType)
  const backPossible = config.supportedDocuments.some((d) => d.capture.backSideRequired)

  if (docType !== null) {
    // Known document: include back only when this doc requires it
    if (backRequired) {
      steps.push({ id: 'document_back', label: STEP_LABELS.document_back, required: true })
    }
  } else {
    // Unknown document: include back as conditional if any doc might need it
    if (backPossible) {
      steps.push({ id: 'document_back', label: STEP_LABELS.document_back, required: false })
    }
  }

  // Face capture
  if (config.faceCapture.required) {
    steps.push({ id: 'face_capture', label: STEP_LABELS.face_capture, required: true })
  }

  // Liveness
  if (config.liveness.required) {
    steps.push({ id: 'liveness', label: STEP_LABELS.liveness, required: true })
  }

  // Processing — always the final step
  steps.push({ id: 'processing', label: STEP_LABELS.processing, required: true })

  return steps
}

/**
 * Returns a high-level summary of the resolved flow for display in the
 * country/document selection screen's journey hint.
 *
 * Combines `resolveFlowSteps` with aggregate flags that the UI needs to
 * decide which conditional notices to show (e.g. "a presence check may be
 * required" vs "a presence check is required").
 */
export function resolveFlowSummary(
  config: VerificationFlowConfig,
  docType: DocType | null = null,
): ResolvedFlowSummary {
  const steps = resolveFlowSteps(config, docType)
  return {
    steps,
    requiredStepCount: steps.filter((s) => s.required).length,
    backCapturePossible: config.supportedDocuments.some((d) => d.capture.backSideRequired),
    livenessRequired: config.liveness.required,
  }
}

// ─── Config validation ────────────────────────────────────────────────────────

/**
 * Validates a `VerificationFlowConfig` for invalid or unusual combinations.
 *
 * Errors prevent correct machine operation and must be fixed before the
 * config is used. Warnings describe configurations that will work but may
 * produce unexpected UX or are not yet fully implemented.
 *
 * Call this at session initialization time (before the machine starts) and
 * surface errors to the integrating developer, not the end user.
 */
export function validateFlowConfig(config: VerificationFlowConfig): FlowConfigValidation {
  const issues: FlowConfigIssue[] = []

  // ── Errors ───────────────────────────────────────────────────────────────────

  if (config.supportedCountries.length === 0) {
    issues.push({
      level: 'error',
      code: 'NO_SUPPORTED_COUNTRIES',
      message:
        'supportedCountries is empty. The country picker will have no options and the flow cannot start.',
    })
  }

  if (config.supportedDocuments.length === 0) {
    issues.push({
      level: 'error',
      code: 'NO_SUPPORTED_DOCUMENTS',
      message:
        'supportedDocuments is empty. No document types can be selected and the flow cannot proceed past country selection.',
    })
  }

  if (config.liveness.required && !config.faceCapture.required) {
    issues.push({
      level: 'error',
      code: 'LIVENESS_WITHOUT_FACE_CAPTURE',
      message:
        'liveness.required is true but faceCapture.required is false. Liveness verification requires a prior face capture step. Set faceCapture.required to true or set liveness.required to false.',
    })
  }

  // Duplicate document types produce ambiguous rule lookups
  const seenDocTypes = new Set<DocType>()
  for (const doc of config.supportedDocuments) {
    if (seenDocTypes.has(doc.docType)) {
      issues.push({
        level: 'error',
        code: 'DUPLICATE_DOCUMENT_TYPE',
        message:
          `Document type '${doc.docType}' appears more than once in supportedDocuments. Remove the duplicate — resolvers use the first match and subsequent entries are silently ignored.`,
      })
    }
    seenDocTypes.add(doc.docType)
  }

  // ── Warnings ─────────────────────────────────────────────────────────────────

  if (config.faceCapture.mode !== 'photo') {
    issues.push({
      level: 'warning',
      code: 'UNIMPLEMENTED_CAPTURE_MODE',
      message:
        `faceCapture.mode is '${config.faceCapture.mode}'. Only 'photo' mode is fully implemented. '${config.faceCapture.mode}' will render a placeholder screen until the capture provider is wired.`,
    })
  }

  if (config.liveness.maxAttempts !== undefined && config.liveness.maxAttempts < 1) {
    issues.push({
      level: 'warning',
      code: 'LIVENESS_MAX_ATTEMPTS_TOO_LOW',
      message:
        `liveness.maxAttempts is ${config.liveness.maxAttempts}. The minimum useful value is 1. Values below 1 will cause the machine to escalate to unrecoverable_failure on the first attempt with no retry opportunity.`,
    })
  }

  const allUploadDisabled = config.supportedDocuments.every(
    (d) => !d.capture.uploadFallbackAllowed,
  )
  if (allUploadDisabled && config.supportedDocuments.length > 0) {
    issues.push({
      level: 'warning',
      code: 'NO_UPLOAD_FALLBACK',
      message:
        'All supported document types have uploadFallbackAllowed: false. Users with camera issues will have no fallback path for document capture.',
    })
  }

  return {
    valid: issues.every((i) => i.level !== 'error'),
    issues,
  }
}
