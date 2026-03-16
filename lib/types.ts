// ─── Document & Flow Types ────────────────────────────────────────────────────

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

// ─── Flow Configuration ───────────────────────────────────────────────────────

export interface FlowConfig {
  docType?: DocType
  requireLiveness?: boolean
}

export interface FlowState {
  docType: DocType
  screens: FlowScreenId[]
  screenIndex: number
  retryError: ErrorType | null
  direction: 1 | -1
}

// ─── Navigation callbacks passed down to every screen ─────────────────────────

export interface FlowCallbacks {
  onNext: () => void
  onBack: () => void
  onRetry: (error: ErrorType) => void
  onResolveRetry: () => void
  onDocSelect: (docType: DocType) => void
}

// ─── Camera Quality ───────────────────────────────────────────────────────────

export interface QualityCheck {
  label: string
  ok: boolean
}

// ─── Design System ───────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'lg' | 'md' | 'sm'

export type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger'
export type BadgeSize = 'sm' | 'md'

export type NoticeVariant = 'info' | 'success' | 'warning' | 'danger'

// ─── Screen Prop Shapes ───────────────────────────────────────────────────────

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
