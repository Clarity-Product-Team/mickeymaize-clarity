import type {
  DocumentTypeConfig,
  SupportedCountry,
  VerificationFlowConfig,
} from './types'

// ─── Shared document type configs ─────────────────────────────────────────────
//
// Reusable building blocks composed into each example flow below.
// Each matches an existing `DocType` value and reflects real-world capture rules.

const PASSPORT: DocumentTypeConfig = {
  docType: 'passport',
  label: 'Passport',
  capture: {
    backSideRequired: false,      // single data page; no back scan needed
    uploadFallbackAllowed: true,  // photo upload is acceptable for documents
  },
}

const DRIVERS_LICENSE: DocumentTypeConfig = {
  docType: 'drivers-license',
  label: "Driver's License",
  capture: {
    backSideRequired: true,       // barcode / magnetic stripe on reverse
    uploadFallbackAllowed: true,
  },
}

const NATIONAL_ID: DocumentTypeConfig = {
  docType: 'national-id',
  label: 'National ID',
  capture: {
    backSideRequired: true,       // MRZ or chip data on reverse
    uploadFallbackAllowed: true,
  },
}

const RESIDENCE_PERMIT: DocumentTypeConfig = {
  docType: 'residence-permit',
  label: 'Residence Permit',
  capture: {
    backSideRequired: true,       // permit number and biometric data on reverse
    uploadFallbackAllowed: true,
  },
}

// ─── Shared country groups ────────────────────────────────────────────────────
//
// Two representative sets. ISO codes are included for production-readiness;
// they match the display names used throughout the existing COUNTRIES list
// in lib/constants.ts.

/** Low-risk countries where standard verification is sufficient. */
const STANDARD_COUNTRIES: SupportedCountry[] = [
  { name: 'United Kingdom', isoCode: 'GB' },
  { name: 'United States',  isoCode: 'US' },
  { name: 'Germany',        isoCode: 'DE' },
  { name: 'France',         isoCode: 'FR' },
  { name: 'Netherlands',    isoCode: 'NL' },
  { name: 'Canada',         isoCode: 'CA' },
  { name: 'Australia',      isoCode: 'AU' },
  { name: 'Spain',          isoCode: 'ES' },
  { name: 'Italy',          isoCode: 'IT' },
  { name: 'Israel',         isoCode: 'IL' },
]

/**
 * Extended country set that adds medium- and high-risk countries.
 * These trigger liveness or compliance requirements in risk-based flows.
 */
const EXTENDED_COUNTRIES: SupportedCountry[] = [
  ...STANDARD_COUNTRIES,
  // Medium risk (FATF Increased Monitoring)
  { name: 'Nigeria',      isoCode: 'NG', riskOverride: 'medium' },
  { name: 'Pakistan',     isoCode: 'PK', riskOverride: 'medium' },
  { name: 'Philippines',  isoCode: 'PH', riskOverride: 'medium' },
  { name: 'Egypt',        isoCode: 'EG', riskOverride: 'medium' },
  { name: 'Morocco',      isoCode: 'MA', riskOverride: 'medium' },
  { name: 'Bangladesh',   isoCode: 'BD', riskOverride: 'medium' },
  { name: 'Jordan',       isoCode: 'JO', riskOverride: 'medium' },
  { name: 'Senegal',      isoCode: 'SN', riskOverride: 'medium' },
  { name: 'Vietnam',      isoCode: 'VN', riskOverride: 'medium' },
  // High risk (broad sanctions / AML)
  { name: 'Afghanistan',  isoCode: 'AF', riskOverride: 'high' },
  { name: 'Iran',         isoCode: 'IR', riskOverride: 'high' },
  { name: 'Myanmar',      isoCode: 'MM', riskOverride: 'high' },
  { name: 'Syria',        isoCode: 'SY', riskOverride: 'high' },
  { name: 'Yemen',        isoCode: 'YE', riskOverride: 'high' },
]

// ─── Example flow configurations ──────────────────────────────────────────────

/**
 * Passport-only flow.
 *
 * Minimal friction: no back-side scan, no liveness, single document type.
 * Appropriate for services where passports are the only accepted identity
 * document — e.g. financial products restricted to passport holders.
 *
 * Capture path: front scan → selfie → processing
 * Outcomes: verified or rejected only (no manual review queue)
 */
export const EXAMPLE_PASSPORT_FLOW: VerificationFlowConfig = {
  supportedCountries: STANDARD_COUNTRIES,
  supportedDocuments: [PASSPORT],
  faceCapture: {
    required: true,
    mode: 'photo',
  },
  liveness: {
    required: false,
  },
  outcomes: {
    manualReviewPossible: false,
    additionalStepsPossible: false,
  },
}

/**
 * Two-sided ID flow.
 *
 * Accepts driver's licenses and national IDs alongside passports.
 * All non-passport types require a back-side scan (MRZ / barcode data).
 * No liveness required; manual review queue is enabled for edge cases.
 *
 * Capture path (passport):       front → selfie → processing
 * Capture path (DL / national):  front → back → selfie → processing
 * Outcomes: verified, pending manual review, or rejected
 */
export const EXAMPLE_TWO_SIDED_ID_FLOW: VerificationFlowConfig = {
  supportedCountries: STANDARD_COUNTRIES,
  supportedDocuments: [PASSPORT, DRIVERS_LICENSE, NATIONAL_ID],
  faceCapture: {
    required: true,
    mode: 'photo',
  },
  liveness: {
    required: false,
  },
  outcomes: {
    manualReviewPossible: true,    // back-side data can produce borderline results
    additionalStepsPossible: false,
  },
}

/**
 * Low-risk flow — all document types, no liveness.
 *
 * Full document catalog including residence permits. Face capture is required
 * but liveness is not — appropriate for consumer services that balance friction
 * with fraud risk at low-risk thresholds.
 *
 * Back-side capture applies to all two-sided documents.
 * Upload fallback is available on all capture steps.
 * Outcomes: verified or rejected only.
 */
export const EXAMPLE_LOW_RISK_FLOW: VerificationFlowConfig = {
  supportedCountries: STANDARD_COUNTRIES,
  supportedDocuments: [PASSPORT, DRIVERS_LICENSE, NATIONAL_ID, RESIDENCE_PERMIT],
  faceCapture: {
    required: true,
    mode: 'photo',
  },
  liveness: {
    required: false,
  },
  outcomes: {
    manualReviewPossible: false,
    additionalStepsPossible: false,
  },
}

/**
 * High-risk flow — full document catalog, liveness required.
 *
 * Designed for regulated sectors (financial services, crypto exchanges,
 * cross-border payments) and sessions originating from medium- or high-risk
 * jurisdictions. Liveness is mandatory and limited to 2 attempts before
 * escalating to manual review.
 *
 * Face capture uses 'photo' mode; the separate liveness step performs active
 * motion verification (the `capturing_motion` machine state).
 *
 * Capture path: front [+ back] → selfie → liveness → processing
 * Outcomes: verified, pending manual review, additional step required, or rejected
 */
export const EXAMPLE_HIGH_RISK_FLOW: VerificationFlowConfig = {
  supportedCountries: EXTENDED_COUNTRIES,
  supportedDocuments: [PASSPORT, DRIVERS_LICENSE, NATIONAL_ID, RESIDENCE_PERMIT],
  faceCapture: {
    required: true,
    mode: 'photo',              // selfie is always photo; liveness is a separate step
  },
  liveness: {
    required: true,
    maxAttempts: 2,             // liveness is harder to recover; escalate sooner
  },
  outcomes: {
    manualReviewPossible: true,        // expected for borderline risk profiles
    additionalStepsPossible: true,     // backend may request address proof etc.
  },
}

// ─── Example config index ─────────────────────────────────────────────────────

/**
 * All example configs keyed by a short identifier.
 *
 * Intended for use by the FlowInspector demo overlay and future config
 * resolver tests. Not for production use.
 */
export const EXAMPLE_FLOW_CONFIGS: Record<string, VerificationFlowConfig> = {
  passport_only:      EXAMPLE_PASSPORT_FLOW,
  two_sided_id:       EXAMPLE_TWO_SIDED_ID_FLOW,
  low_risk:           EXAMPLE_LOW_RISK_FLOW,
  high_risk_liveness: EXAMPLE_HIGH_RISK_FLOW,
}
