// ─── Document & Flow ──────────────────────────────────────────────────────────

export type DocType =
  | 'passport'
  | 'drivers-license'
  | 'national-id'
  | 'residence-permit'

export type ErrorType =
  | 'blur'
  | 'glare'
  | 'partial'
  | 'wrong_doc'
  | 'expired'
  | 'face_mismatch'

export type FlowScreenId =
  | 'welcome'
  | 'country-doc'
  | 'doc-guidance'
  | 'doc-capture-front'
  | 'doc-capture-back'
  | 'selfie-guidance'
  | 'selfie-capture'
  | 'liveness'
  | 'processing'
  | 'success'
  | 'retry'

export interface FlowState {
  docType: DocType
  country: string
  riskLevel: RiskLevel
  screens: FlowScreenId[]
  screenIndex: number
  retryError: ErrorType | null
  direction: 1 | -1
}

export interface StepInfo {
  step: number
  total: number
  label: string
}

// ─── Adaptive flow ────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high'
export type DeviceType = 'mobile' | 'desktop'

export interface FlowContext {
  docType: DocType
  country: string
  riskLevel: RiskLevel
  deviceType: DeviceType
}

export type FlowRuleTag = 'document' | 'risk' | 'compliance' | 'ux' | 'device'

export interface FlowEffect {
  type: 'insert_after' | 'insert_before' | 'remove'
  screen: FlowScreenId
  /** Reference screen for insert operations */
  anchor?: FlowScreenId
}

export interface FlowRule {
  id: string
  label: string
  description: string
  tags: FlowRuleTag[]
  condition: (ctx: FlowContext) => boolean
  effect: FlowEffect
}

export interface AppliedRule {
  id: string
  label: string
  description: string
  tags: FlowRuleTag[]
}

export interface FlowResolution {
  screens: FlowScreenId[]
  appliedRules: AppliedRule[]
  context: FlowContext
  flags: {
    requiresBackCapture: boolean
    requiresLiveness: boolean
    isStreamlined: boolean
  }
}

// ─── Component design system ─────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'lg' | 'md' | 'sm'
export type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger'
export type BadgeSize = 'sm' | 'md'
export type NoticeVariant = 'info' | 'success' | 'warning' | 'danger'

// ─── Camera ───────────────────────────────────────────────────────────────────

export type DocIssueType = 'too_dark' | 'too_far' | 'partial' | 'glare' | 'blur'
export type FaceIssueType = 'not_centered' | 'too_far' | 'low_light' | 'glasses_glare' | 'too_close'

/**
 * All distinct sub-states of the selfie capture screen.
 *
 * Extends FaceIssueType with lifecycle states that sit outside quality analysis.
 *
 * Future: becomes the discriminant in the verification state machine alongside
 * CapturePhase, allowing selfie behaviour to be driven from outside the screen.
 */
export type SelfieCapturePhase =
  | FaceIssueType    // quality issues — maps directly to FaceIssueType
  | 'detecting'      // camera active, initializing — no face yet
  | 'scanning'       // quality checks active, at least one issue unresolved
  | 'all_clear'      // all checks pass; auto-capture countdown running
  | 'capturing'      // shutter fired; success flash
  | 'validating'     // post-capture: quality analysis / backend call stub
  | 'camera_denied'  // browser camera permission denied or blocked

/**
 * Determines which capture mechanism the selfie screen uses.
 *
 * - photo:  Single-frame auto-capture (current, fully implemented).
 * - video:  Short clip recording (stub — not yet implemented).
 * - motion: Head-movement tracking for passive liveness (stub — not yet implemented).
 *
 * Future: resolved from session config so the backend can control which mode
 * applies per risk level or jurisdiction.
 */
export type SelfieCaptureMode = 'photo' | 'video' | 'motion'

/**
 * All distinct sub-states of the liveness screen.
 *
 * 'camera_denied' is a first-class phase because the user experiences it
 * as a named state, not a background error flag.
 *
 * Future: driven from session config when a real liveness provider is wired in.
 */
export type LivenessPhase =
  | 'intro'         // brief explanation; user taps Begin before camera starts
  | 'align'         // face alignment check before motion (stub: auto-advance 600ms)
  | 'motion'        // active arc animation, interval-driven progress
  | 'validating'    // post-motion quality check stub (1200ms)
  | 'failed'        // attempt failed; may retry up to MAX_ATTEMPTS
  | 'complete'      // motion accepted; brief success state before onComplete()
  | 'camera_denied' // browser camera permission blocked

/**
 * All distinct sub-states of the document capture screen.
 *
 * Extends DocIssueType with lifecycle states that sit outside quality analysis:
 * initialization, capture transitions, backend validation, and error conditions.
 *
 * Future: this becomes the CaptureState discriminant in the verification
 * state machine, allowing capture behaviour to be driven from outside the screen.
 */
export type CapturePhase =
  | DocIssueType       // quality issues — maps directly to DocIssueType
  | 'detecting'        // camera active, scanning for document
  | 'good_positioning' // all quality checks pass; progress ring filling
  | 'hold_steady'      // progress ring > 70%; capture imminent
  | 'capturing'        // shutter fired; brief confirmation flash
  | 'validating'       // post-capture: quality analysis / backend call stub
  | 'upload_failed'    // gallery upload errored
  | 'camera_denied'    // browser camera permission denied or blocked

export interface QualityCheck {
  label: string
  ok: boolean
}

// ─── Screen props ─────────────────────────────────────────────────────────────

/**
 * Drives WelcomeScreen content and behaviour.
 * - fresh:   first visit, no prior attempt (default)
 * - resume:  session exists and can be continued
 * - restart: previous attempt failed or was abandoned; user is starting over
 */
export type WelcomeMode = 'fresh' | 'resume' | 'restart'

export interface WelcomeScreenProps {
  onStart: () => void
  /** Defaults to 'fresh'. Pass 'resume' or 'restart' when session state warrants it. */
  mode?: WelcomeMode
}

export interface CountryDocSelectScreenProps {
  onSelect: (docType: DocType) => void
}

export interface DocGuidanceScreenProps {
  docType: DocType
  /** Whether the selected document requires a back-side capture. Drives the checklist. */
  requiresBackCapture: boolean
  onContinue: () => void
}

export interface DocCaptureScreenProps {
  side: 'front' | 'back'
  docType: DocType
  onCapture: () => void
  onRetry: (error: ErrorType) => void
}

export interface SelfieGuidanceScreenProps {
  onContinue: () => void
}

export interface SelfieCaptureScreenProps {
  onCapture: () => void
  onRetry: (error: ErrorType) => void
  /**
   * Capture mode. Defaults to 'photo'.
   * 'video' and 'motion' render stub placeholders until implemented.
   * Future: resolved from session config so the backend controls mode per flow.
   */
  mode?: SelfieCaptureMode
  /**
   * When provided, a low-prominence "Skip for now" affordance is rendered
   * below the camera. The screen makes no decision about skip validity —
   * that is entirely the caller's responsibility.
   */
  onSkip?: () => void
  /**
   * Optional async validation callback. Called after the shutter fires.
   * If it returns `{ ok: false }`, `onCaptureFailed` is invoked instead of `onCapture`.
   */
  onValidate?: () => Promise<{ ok: boolean }>
  /**
   * Called when `onValidate` returns `{ ok: false }`.
   * The caller should dispatch the machine `CAPTURE_FAILED` event here.
   */
  onCaptureFailed?: () => void
}

export interface LivenessScreenProps {
  onComplete: () => void
  /**
   * Called after MAX_ATTEMPTS retries are exhausted.
   * Optional — if absent, the failed state renders without an escalation path.
   * Future: wired to VerifyFlow's retry/escalation handler.
   */
  onFailed?: () => void
}

export interface ProcessingScreenProps {
  onComplete: () => void
}

export interface RetryScreenProps {
  errorType: ErrorType
  onRetry: () => void
  /**
   * Called when the user taps "Choose a different document".
   * Only rendered when the error is 'wrong_doc'; ignored otherwise.
   */
  onChangeDoc?: () => void
}

/**
 * The final determination returned after processing completes.
 *
 * - verified:         Full approval. The identity check passed. Final.
 * - pending:          Submitted but not yet decided — under manual review.
 * - additional_step:  More information or an extra step is required from the user.
 * - retry:            A specific step failed; the user can retry from that point.
 * - rejected:         Hard rejection. The verification could not be completed.
 *
 * Future: resolved from the POST /verify/complete API response body.
 * Today: VerifyFlow always passes 'verified' as a stub.
 */
export type VerificationOutcome =
  | 'verified'
  | 'pending'
  | 'additional_step'
  | 'retry'
  | 'rejected'

export interface OutcomeScreenProps {
  /**
   * The verification outcome. Required — callers must always resolve this
   * from the machine context or API response before rendering.
   * Production: resolved from context.outcome via deriveOutcome().
   */
  outcome: VerificationOutcome
  /** Called when the user taps the primary CTA (continue / done / get help). */
  onContinue?: () => void
  /**
   * Called when the user taps the retry CTA.
   * Only rendered for the 'retry' outcome; ignored otherwise.
   */
  onRetry?: () => void
}
