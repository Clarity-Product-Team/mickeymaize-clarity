# Verification Flow Configuration

Engineering and product reference for the `VerificationFlowConfig` system.

**Source files**
- `features/verification/config/types.ts` — schema types
- `features/verification/config/examples.ts` — built-in example configs
- `features/verification/config/resolvers.ts` — resolver and validation functions
- `features/verification/config/adapters.ts` — bridge to screen-layer interfaces

---

## Overview

A `VerificationFlowConfig` is the single object that describes everything a verification session needs before the user begins capturing:

- which countries are accepted
- which document types are accepted (and their capture requirements)
- whether face capture and liveness are required
- which backend outcome states can occur

The config is **read-only for the duration of a session**. It is consumed by resolvers and adapters — it is never mutated by the machine.

In production, this object is returned by the session-initialization API (e.g. `POST /sessions`) and cached on the client for the session lifetime. Today it is constructed statically in code.

---

## Schema Reference

### `VerificationFlowConfig`

Top-level session config object.

```typescript
interface VerificationFlowConfig {
  supportedCountries: SupportedCountry[]
  supportedDocuments: DocumentTypeConfig[]
  faceCapture:        FaceCaptureConfig
  liveness:           LivenessConfig
  outcomes:           OutcomeConfig
}
```

---

### `SupportedCountry`

One entry in the country picker.

```typescript
interface SupportedCountry {
  name:          string       // display name shown in the picker
  isoCode?:      string       // ISO 3166-1 alpha-2 (e.g. 'GB') — required in production
  riskOverride?: RiskLevel    // 'low' | 'medium' | 'high' — pins risk, bypasses local derivation
}
```

`riskOverride` is optional. When present it bypasses the local risk table. In production the backend risk service always provides this value.

---

### `DocumentTypeConfig`

One document type in the catalog.

```typescript
interface DocumentTypeConfig {
  docType:            DocType               // 'passport' | 'drivers-license' | 'national-id' | 'residence-permit'
  label:              string                // display label in the picker
  supportedCountries?: string[]             // ISO codes or display names; absent = accepted everywhere
  capture:            DocumentCaptureRules
}
```

`supportedCountries` scopes a document to specific issuing countries. If absent or empty, the document is available for all countries in the flow. Matching is case-sensitive on either display name or ISO code.

---

### `DocumentCaptureRules`

Capture requirements for a specific document type.

```typescript
interface DocumentCaptureRules {
  backSideRequired:      boolean  // true → machine must pass through capturing_document_back
  uploadFallbackAllowed: boolean  // true → capture screens show "Upload a photo instead"
}
```

| Rule | When to set `true` |
|---|---|
| `backSideRequired` | Two-sided documents (driver's license, national ID, residence permit). Back side carries MRZ data, barcode, or chip identifier. |
| `uploadFallbackAllowed` | Document capture only. Should be `false` for selfie and liveness steps (those steps do not use this field). |

---

### `FaceCaptureConfig`

```typescript
interface FaceCaptureConfig {
  required: boolean
  mode:     SelfieCaptureMode  // 'photo' | 'video' | 'motion'
}
```

| Mode | Status | Notes |
|---|---|---|
| `'photo'` | Implemented | Single auto-captured frame |
| `'video'` | Stub | Short video clip — placeholder screen only |
| `'motion'` | Stub | Passive head-movement liveness — placeholder screen only |

When `required` is `false`, the machine skips `capturing_face` and `validating_face` entirely.

---

### `LivenessConfig`

```typescript
interface LivenessConfig {
  required:     boolean
  maxAttempts?: number  // default: DEFAULT_MAX_ATTEMPTS (3) from machine selectors
}
```

Liveness is always downstream of face capture. Enabling `liveness.required` without `faceCapture.required` is a validation error (see [Validation](#validation)).

`maxAttempts` caps how many liveness attempts the user may make before the machine escalates to `unrecoverable_failure`. Omitting it applies the global `DEFAULT_MAX_ATTEMPTS`.

---

### `OutcomeConfig`

```typescript
interface OutcomeConfig {
  manualReviewPossible:    boolean  // enables pending_manual_review machine state
  additionalStepsPossible: boolean  // enables additional_step_required machine state
}
```

These flags align the machine's reachable outcome states with what the backend can actually return. When a flag is `false`, the corresponding state is unreachable — an unexpected backend result should be treated as an error.

---

## Example Configurations

Four pre-built examples cover the most common deployment patterns. All examples are in `features/verification/config/examples.ts`.

### `EXAMPLE_PASSPORT_FLOW` — passport only, no liveness

```
Countries:  STANDARD_COUNTRIES (10 low-risk countries)
Documents:  passport only
Face:       required, photo mode
Liveness:   not required
Outcomes:   verified or rejected only
```

Capture path: `front scan → selfie → processing`

Use for: financial products where only passport holders are accepted.

---

### `EXAMPLE_TWO_SIDED_ID_FLOW` — passport + DL + national ID, no liveness

```
Countries:  STANDARD_COUNTRIES
Documents:  passport, driver's license, national ID
Face:       required, photo mode
Liveness:   not required
Outcomes:   verified, pending manual review, or rejected
```

Capture path:
- Passport: `front → selfie → processing`
- Driver's license / national ID: `front → back → selfie → processing`

Manual review is enabled because back-side MRZ/barcode data can produce borderline results.

---

### `EXAMPLE_LOW_RISK_FLOW` — full catalog, no liveness *(current demo default)*

```
Countries:  STANDARD_COUNTRIES
Documents:  passport, driver's license, national ID, residence permit
Face:       required, photo mode
Liveness:   not required
Outcomes:   verified or rejected only
```

This is the config wired in `VerifyFlow.tsx` today.

---

### `EXAMPLE_HIGH_RISK_FLOW` — full catalog, liveness required

```
Countries:  EXTENDED_COUNTRIES (includes medium- and high-risk jurisdictions)
Documents:  passport, driver's license, national ID, residence permit
Face:       required, photo mode
Liveness:   required, maxAttempts: 2
Outcomes:   verified, pending manual review, additional step required, or rejected
```

Capture path: `front [+ back] → selfie → liveness → processing`

Use for: regulated sectors (financial services, crypto, cross-border payments) and sessions from medium- or high-risk jurisdictions.

---

## How Branching Works

The config drives two kinds of branching: **capture path branching** (which screens appear) and **outcome branching** (which terminal states are reachable).

### Capture path branching

The machine uses resolver functions to decide at runtime which steps to include:

| Decision point | Resolver | Config field consulted |
|---|---|---|
| Back-side scan required? | `resolveBackSideRequired(config, docType)` | `DocumentCaptureRules.backSideRequired` for the selected doc |
| Face capture required? | `resolveFaceCaptureRequired(config)` | `FaceCaptureConfig.required` |
| Liveness required? | `resolveLivenessRequired(config)` | `LivenessConfig.required` |
| Upload fallback available? | `resolveUploadFallbackAllowed(config, docType)` | `DocumentCaptureRules.uploadFallbackAllowed` for the selected doc |

All resolvers return safe defaults (`false`) when `docType` is null or not found in the config.

### Outcome branching

Backend results are mapped to machine events by `mapFetchStatusToEvent()` in `features/verification/services/mapping.ts`. The `OutcomeConfig` flags control which of those events can advance the machine to a non-rejected terminal state:

| `OutcomeConfig` flag | Enabled machine state |
|---|---|
| `manualReviewPossible: true` | `pending_manual_review` |
| `additionalStepsPossible: true` | `additional_step_required` |

---

## How Progress Adapts Dynamically

The progress bar and step indicator are driven by `resolveFlowSteps(config, docType)`.

**Before document selection** (`docType` is `null`): if any document in the config requires a back-side scan, a `document_back` step is included in the list with `required: false`. This shows the user a conditional step hint ("may be required depending on your document").

**After document selection** (`docType` is known): the step list is recomputed using the exact `DocumentCaptureRules` for the selected document. The `document_back` step is either present (`required: true`) or absent — no conditional hint.

`resolveFlowSummary(config, docType)` wraps this with aggregate counts and flags used by the country/document selection screen's journey preview.

---

## Validation

Call `validateFlowConfig(config)` at session initialization time (before the machine starts). Surface errors to the integrating developer, not to the end user.

```typescript
const result = validateFlowConfig(myConfig)
if (!result.valid) {
  console.error('Invalid flow config:', result.issues.filter(i => i.level === 'error'))
}
```

### Errors (block correct operation)

| Code | Condition |
|---|---|
| `NO_SUPPORTED_COUNTRIES` | `supportedCountries` is empty — country picker has no options |
| `NO_SUPPORTED_DOCUMENTS` | `supportedDocuments` is empty — flow cannot proceed past country selection |
| `LIVENESS_WITHOUT_FACE_CAPTURE` | `liveness.required: true` with `faceCapture.required: false` — liveness requires a prior face capture step |
| `DUPLICATE_DOCUMENT_TYPE` | Same `DocType` appears more than once — resolvers use the first match; subsequent entries are silently ignored |

### Warnings (unusual but technically valid)

| Code | Condition |
|---|---|
| `UNIMPLEMENTED_CAPTURE_MODE` | `faceCapture.mode` is not `'photo'` — will render a placeholder screen |
| `LIVENESS_MAX_ATTEMPTS_TOO_LOW` | `liveness.maxAttempts` is less than 1 — user gets no retry opportunity |
| `NO_UPLOAD_FALLBACK` | All documents have `uploadFallbackAllowed: false` — users with camera issues have no fallback |

---

## How to: Add a New Country

1. Add a `SupportedCountry` entry to `supportedCountries`:

```typescript
{
  name: 'Sweden',
  isoCode: 'SE',
  // riskOverride: 'low'  // optional — omit to use local risk table
}
```

2. If the country should only accept certain document types, add the ISO code or display name to those documents' `supportedCountries` arrays.

3. If the country is in a medium- or high-risk jurisdiction, set `riskOverride: 'medium'` or `riskOverride: 'high'`.

No resolver changes are required. The adapter (`docSelectConfigFromFlowConfig`) automatically filters documents by country on the selection screen.

---

## How to: Add a New Document Type

1. Add the value to the `DocType` union in `lib/types.ts`.

2. Add a display entry to `DOC_TYPES` in `lib/constants.ts` (label, description, icon).

3. Create a `DocumentTypeConfig` entry and add it to `supportedDocuments`:

```typescript
const MY_DOCUMENT: DocumentTypeConfig = {
  docType: 'my-document',
  label: 'My Document',
  capture: {
    backSideRequired: false,       // does this document have a required back side?
    uploadFallbackAllowed: true,
  },
}
```

4. Add the document to any flow configs where it should appear.

The resolver and adapter layers require no changes — they read `supportedDocuments` dynamically.

---

## How to: Enable or Disable Liveness

**Enable liveness:**

```typescript
liveness: {
  required: true,
  maxAttempts: 2,   // optional; defaults to DEFAULT_MAX_ATTEMPTS (3) if omitted
}
```

Ensure `faceCapture.required` is also `true` — enabling liveness without face capture is a validation error.

**Disable liveness:**

```typescript
liveness: {
  required: false,
}
```

When `required` is `false`, the machine skips `capturing_motion` and `validating_motion`. The liveness screen is not rendered.

---

## How to: Enable or Disable Upload Fallback

Upload fallback is controlled per document type, not globally.

**Enable for a document:**

```typescript
capture: {
  backSideRequired: true,
  uploadFallbackAllowed: true,   // "Upload a photo instead" appears in the capture screen
}
```

**Disable for a document:**

```typescript
capture: {
  backSideRequired: true,
  uploadFallbackAllowed: false,  // user must use the live camera
}
```

To disable fallback globally across all documents, set `uploadFallbackAllowed: false` on every `DocumentTypeConfig`. Note: `validateFlowConfig` will emit a `NO_UPLOAD_FALLBACK` warning in that case, flagging the accessibility risk for users with camera issues.

---

## Adapter Layer

`docSelectConfigFromFlowConfig(flowConfig)` in `features/verification/config/adapters.ts` converts a `VerificationFlowConfig` into the `DocSelectConfig` interface consumed by `CountryDocSelectScreen`.

This is the only place that knows about both the config shape and the screen's prop contract. It handles:

- country list extraction (`supportedCountries → string[]`)
- per-country document filtering (matching by display name or ISO code)
- mapping capture rules to the `DocTypeConfig.sides` / `requiresBackCapture` fields the screen expects
- description fallback to `DOC_TYPES` entries in `lib/constants.ts`

When adding new fields to `DocumentTypeConfig` that the selection screen needs, this adapter is the correct place to map them.

---

## File Map

```
features/verification/config/
  types.ts       — VerificationFlowConfig, SupportedCountry, DocumentTypeConfig,
                   DocumentCaptureRules, FaceCaptureConfig, LivenessConfig, OutcomeConfig
  examples.ts    — EXAMPLE_PASSPORT_FLOW, EXAMPLE_TWO_SIDED_ID_FLOW,
                   EXAMPLE_LOW_RISK_FLOW, EXAMPLE_HIGH_RISK_FLOW,
                   EXAMPLE_FLOW_CONFIGS (index), shared country/document blocks
  resolvers.ts   — resolveDocumentConfig, resolveBackSideRequired,
                   resolveFaceCaptureRequired, resolveLivenessRequired,
                   resolveUploadFallbackAllowed, resolveFlowSteps,
                   resolveFlowSummary, validateFlowConfig
  adapters.ts    — docSelectConfigFromFlowConfig
  index.ts       — re-exports all of the above
```
