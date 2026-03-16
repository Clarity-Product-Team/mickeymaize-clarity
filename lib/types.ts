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

export interface QualityCheck {
  label: string
  ok: boolean
}

// ─── Screen props ─────────────────────────────────────────────────────────────

export interface WelcomeScreenProps {
  onStart: () => void
}

export interface CountryDocSelectScreenProps {
  onSelect: (docType: DocType) => void
}

export interface DocGuidanceScreenProps {
  docType: DocType
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
}

export interface LivenessScreenProps {
  onComplete: () => void
}

export interface ProcessingScreenProps {
  onComplete: () => void
}

export interface RetryScreenProps {
  errorType: ErrorType
  onRetry: () => void
}
