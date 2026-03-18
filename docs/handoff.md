# Clarity Verify — Engineering and Product Handoff

**Date:** March 2026
**Status:** UI complete. Mock backend wired. Ready for real provider integration.

---

## 1. What Changed

This document covers the full scope of production-alignment work applied to the initial demo prototype.

### Added

- **State machine** (`features/verification/machine/`) — 23 states, 19 events, typed context, typed transitions, context patch builder. Pure function. No React dependencies.
- **Flow configuration system** (`features/verification/config/`) — `VerificationFlowConfig` schema, 4 example configs, resolver functions, adapter layer, and validation.
- **Backend service layer** (`features/verification/services/`) — `VerificationService` interface, `ApiResponse<T>` envelope, request/response types, `BackendSessionStatus` → machine state mapping, polling control, mock implementation.
- **Session lifecycle hook** (`hooks/useSessionLifecycle.ts`) — handles session start on mount, resume from `sessionStorage`, upload orchestration, and poll loop.
- **`OutcomeScreen`** (`screens/OutcomeScreen.tsx`) — full 5-outcome screen replacing the old stub, driven by machine context.
- **`RetryScreen`** (`screens/RetryScreen.tsx`) — error-specific copy, retry CTA, and optional "choose a different document" path for `wrong_doc` errors.
- **Engineering documentation** (`docs/verification-machine.md`, `docs/verification-config.md`, `docs/verification-api.md`, `docs/screen-gaps.md`).
- **Updated README** — engineer-facing reference with architecture, injection points, extension guides, and screen table.

### Fixed (QA pass)

- `RetryScreenProps` was missing `onChangeDoc?: () => void` — added to `lib/types.ts`.
- `OutcomeScreenProps.outcome` was optional with a silent `'verified'` default — made required.

---

## 2. Architecture

Two independent systems run in parallel and are wired together only in `VerifyFlow.tsx`.

```
app/verify/page.tsx
  └── flows/VerifyFlow.tsx                    ← sole integration point
        ├── hooks/useVerifyFlow.ts             ← screen navigation (which screen is shown)
        ├── hooks/useVerificationMachine.ts    ← state machine reducer
        ├── hooks/useSessionLifecycle.ts       ← session start, resume, upload, polling
        └── screens/                           ← one file per screen
```

**`useVerifyFlow`** manages a flat navigation stack: a `FlowScreenId[]`, a pointer, a direction, and a retry error. It does not know about machine states.

**`useVerificationMachine`** is a `useReducer` wrapper around the pure `transition()` function. It holds the machine state and the full `VerificationContext`. It does not know about screen order.

**`VerifyFlow.tsx`** reads both, routes the current screen from `useVerifyFlow`, reads outcome state from `useVerificationMachine`, and injects callbacks from `useSessionLifecycle` into the capture screens.

**`VerificationFlowConfig`** is the session-level config object. It is constructed from `startSession()` response data (today: a static `EXAMPLE_LOW_RISK_FLOW` from `features/verification/config/examples.ts`). It is read-only for the session lifetime. All branching decisions (back-side required, liveness required, upload fallback) are resolved from this object via the functions in `features/verification/config/resolvers.ts`.

---

## 3. Screen-by-Screen Correction Summary

| Screen | What was a stub | What is now implemented | Remaining gap |
|---|---|---|---|
| **Welcome** | Static text, always "fresh" mode | `WelcomeMode`: `fresh` / `resume` / `restart` driven by session state | Resume mode requires live backend session check |
| **Country + Doc Select** | Hard-coded country list | Driven by `VerificationFlowConfig` via `docSelectConfigFromFlowConfig()` | Country list hard-coded to 10 countries in `EXAMPLE_LOW_RISK_FLOW` |
| **Doc Guidance** | Static checklist | `requiresBackCapture` prop drives checklist items | No NFC hint (some passports/IDs) |
| **Doc Capture** | Always showed "upload" option | `allowUpload` resolved from `resolveUploadFallbackAllowed(config, docType)` | Camera is simulated; no real frame capture |
| **Doc Review (ReviewPanel)** | Absent | Confirm / retake panel with simulated preview | Preview is a placeholder image |
| **Selfie** | Auto-advance | Quality simulation, phase progression, auto-capture countdown | Camera is simulated |
| **Liveness** | Absent | Full phase progression: intro → align → motion → validating → complete/failed, with MAX_ATTEMPTS | Active liveness (motion tracking) is a stub |
| **Processing** | Static 4-step list | Animated step progression | "Comparing your face" always shown regardless of flow config |
| **Outcome** | Single stub success screen | 5 outcomes: verified, pending, additional step, retry, rejected | Metrics always show "Face match: Confirmed" regardless of flow |
| **Retry** | Absent | Error-specific copy, retry CTA, `onChangeDoc` for `wrong_doc` | — |

---

## 4. State Machine Summary

**Source:** `features/verification/machine/`

### States (23)

```
idle → intro
  → selecting_country → selecting_document
  → capturing_document_front → validating_document_front → reviewing_document_front
  → capturing_document_back  → validating_document_back  → reviewing_document_back
  → capturing_face → validating_face
  → capturing_motion → validating_motion
  → uploading → processing → awaiting_backend_result
  → verified | pending_manual_review | additional_step_required
  → retryable_failure | unrecoverable_failure | cancelled
```

`TERMINAL_STATES`: `verified`, `unrecoverable_failure`, `cancelled` — no further transitions.
`CAPTURE_STATES`: the four `capturing_*` states — used to gate camera permission checks.

### Events (19)

Session: `START`, `RESUME`, `RESTART`, `CANCEL`, `CONTINUE`
Setup: `COUNTRY_SELECTED`, `DOCUMENT_SELECTED`
Permissions: `PERMISSION_GRANTED`, `PERMISSION_DENIED`, `PERMISSION_BLOCKED`
Capture: `CAPTURE_CONFIRMED`, `CAPTURE_FAILED`, `RETAKE`, `SKIP_STEP`
Upload: `UPLOAD_STARTED`, `UPLOAD_SUCCEEDED`, `UPLOAD_FAILED`
Validation: `VALIDATION_PASSED`, `VALIDATION_FAILED`
Backend: `BACKEND_RESULT_RECEIVED`
Retry: `RETRY_STEP`

### Context (key fields)

| Field | Type | Purpose |
|---|---|---|
| `sessionId` | `string \| null` | Backend session identifier |
| `docType` | `DocType \| null` | Selected document type |
| `country` | `string \| null` | Selected country |
| `cameraPermission` | `'unknown' \| 'granted' \| 'denied' \| 'blocked'` | Camera permission state |
| `documentFront/Back` | `CaptureArtifact \| null` | Captured image artifacts |
| `selfie` | `CaptureArtifact \| null` | Selfie artifact |
| `livenessToken` | `string \| null` | Token from liveness provider |
| `attempts` | `AttemptRecord` | Per-capture-state retry counter |
| `outcome` | `VerificationOutcome \| null` | Final backend outcome |
| `failedState` | `VerificationStateName \| null` | State to return to on `RETRY_STEP` |
| `failureReason` | `string \| null` | Human-readable failure reason |

### Known transition gaps

- `reviewing_document_front → capturing_document_back` is unconditional. In production, `CAPTURE_CONFIRMED` here should consult `backSideRequired` and skip to `capturing_face` for single-sided documents.
- `validating_face → capturing_motion` is unconditional. In production, `VALIDATION_PASSED` here should consult `liveness.required` and skip to `uploading` when liveness is not required.

Both gaps are marked with comments in `transitions.ts`. Fixing them requires passing `VerificationFlowConfig` into the transition function.

---

## 5. Flow Configuration Summary

**Source:** `features/verification/config/`

A `VerificationFlowConfig` is the single object describing the session:

```typescript
interface VerificationFlowConfig {
  supportedCountries:  SupportedCountry[]
  supportedDocuments:  DocumentTypeConfig[]
  faceCapture:         FaceCaptureConfig     // required + mode
  liveness:            LivenessConfig        // required + maxAttempts
  outcomes:            OutcomeConfig         // manualReviewPossible + additionalStepsPossible
}
```

**Current demo config:** `EXAMPLE_LOW_RISK_FLOW` — all 4 document types, 10 countries, face required, liveness off, no manual review.

**How branching works:**

| Decision | Resolver | Source field |
|---|---|---|
| Back-side scan | `resolveBackSideRequired(config, docType)` | `DocumentCaptureRules.backSideRequired` |
| Face capture | `resolveFaceCaptureRequired(config)` | `FaceCaptureConfig.required` |
| Liveness | `resolveLivenessRequired(config)` | `LivenessConfig.required` |
| Upload fallback | `resolveUploadFallbackAllowed(config, docType)` | `DocumentCaptureRules.uploadFallbackAllowed` |

**In production:** replace the static example config with the `requirements` field returned by `startSession()`. The mock already returns this shape — see `BackendWorkflowRequirements` in `features/verification/services/types.ts`.

---

## 6. API Mapping Summary

**Source:** `features/verification/services/`

### VerificationService interface

```typescript
interface VerificationService {
  startSession(req)     → Promise<ApiResponse<StartSessionResponse>>
  resumeSession(req)    → Promise<ApiResponse<ResumeSessionResponse>>
  uploadDocument(req)   → Promise<ApiResponse<UploadDocumentResponse>>
  uploadFace(req)       → Promise<ApiResponse<UploadFaceResponse>>
  uploadLiveness(req)   → Promise<ApiResponse<UploadLivenessResponse>>
  submitStep(req)       → Promise<ApiResponse<SubmitStepResponse>>
  fetchStatus(req)      → Promise<ApiResponse<FetchStatusResponse>>
}
```

### ApiResponse envelope

```typescript
type ApiResponse<T> =
  | { ok: true;  data: T;    error: null }
  | { ok: false; data: null; error: BackendError }
```

All callers check `res.ok` before reading `res.data`. No try/catch required.

### BackendSessionStatus → machine state

| Backend status | Machine state |
|---|---|
| `initiated` | `intro` |
| `collecting_inputs` | `capturing_*` (from `nextStep`) |
| `validating_inputs` | `validating_*` (from `nextStep`) |
| `needs_retry` | `retryable_failure` |
| `needs_additional_step` | `additional_step_required` |
| `processing` | `awaiting_backend_result` |
| `manual_review` | `pending_manual_review` |
| `approved` | `verified` |
| `rejected` | `unrecoverable_failure` |
| `expired` | `unrecoverable_failure` |
| `cancelled` | `cancelled` |

### Upload vs. submit separation

`upload*()` puts the artifact on the backend. Session status stays `collecting_inputs`. The face-match and liveness pipelines do **not** run yet.

`submitStep()` triggers the backend pipeline for that artifact. When the last required step is submitted, status advances to `processing`.

`fetchStatus()` is the only endpoint that communicates the final outcome.

---

## 7. Remaining Mocked Areas

| Area | Current behavior | What production requires |
|---|---|---|
| **Camera capture** | `useDocQuality`, `useSelfieQuality` simulate quality detection with timeouts | Real camera feed; real quality analysis (blur, glare, partial, face detection) |
| **Document image** | Preview is a placeholder; capture is a no-op | Actual frame from `getUserMedia`; image encoded as base64 or Blob for upload |
| **Selfie image** | Auto-captures after simulated quality pass | Actual frame; face detection via ML or provider SDK |
| **Liveness** | Timer-based arc animation; no actual motion tracking | Active liveness SDK (e.g. iProov, Onfido Studio, AWS Rekognition) |
| **NFC chip read** | Not implemented | Optional step for passports/IDs with NFC chip |
| **Session backend** | `mockVerificationService` — in-memory, cleared on reload | Real HTTP implementation satisfying `VerificationService` |
| **Processing outcome** | Always resolves `'verified'` after 2 polls | Real async pipeline result from backend |
| **Processing steps copy** | Hardcodes 4 steps including "Comparing your face" | Steps should be filtered from `VerificationFlowConfig` at render time |
| **Outcome metrics** | Hardcodes "Face match: Confirmed" | Should reflect which steps were actually completed |

---

## 8. Next Steps for Real Provider Integration

### Step 1 — Implement `VerificationService` for your backend

Create `features/verification/services/httpService.ts` implementing the `VerificationService` interface. No other files need to change.

```typescript
// flows/VerifyFlow.tsx — find this import:
import { mockVerificationService } from '@/features/verification/services/mockService'

// Replace with:
import { httpVerificationService } from '@/features/verification/services/httpService'
```

Same swap in `hooks/useSessionLifecycle.ts` (the `service` parameter).

### Step 2 — Wire real camera capture

Replace the simulated `useDocQuality` hook with one that opens a real `getUserMedia` stream. The `DocCaptureScreen` already accepts an `onCapture` callback — the image data should be stored in machine context (`documentFront` / `documentBack`) before this is called.

### Step 3 — Populate `startSession()` requirements

The `StartSessionResponse` already includes a `requirements: BackendWorkflowRequirements` field. In `VerifyFlow.tsx`, replace:

```typescript
const flowConfig = EXAMPLE_LOW_RISK_FLOW
```

with the `requirements` returned by `startSession()`, converted via the adapter if needed.

### Step 4 — Fix conditional machine transitions

- `reviewing_document_front → CAPTURE_CONFIRMED`: check `resolveBackSideRequired(config, docType)` and route to `capturing_face` if false.
- `validating_face → VALIDATION_PASSED`: check `resolveLivenessRequired(config)` and route to `uploading` if false.

Both transitions are in `features/verification/machine/transitions.ts` with comments marking the gaps.

### Step 5 — Wire a liveness provider

`LivenessScreen` currently runs a timer-based arc animation. Replace the inner loop with your provider's SDK (iProov, Onfido, etc.). On success, write the provider token to `context.livenessToken` and dispatch `CAPTURE_CONFIRMED`. On failure, dispatch `CAPTURE_FAILED`.

### Step 6 — Filter processing steps and outcome metrics

Pass `flowConfig` into `ProcessingScreen` and `OutcomeScreen` so:
- Processing step list omits "Comparing your face" when `faceCapture.required` is false.
- Outcome metrics reflect only the steps that were actually collected.

### Step 7 — Remove demo-only components before shipping

`FlowInspector` and `ThemeSwitcher` are in `components/demo/`. Both are conditionally rendered in `VerifyFlow.tsx` — remove those render calls.

---

## 9. Run Instructions

```bash
npm install         # install dependencies
npm run dev         # dev server at http://localhost:3000
```

Open [http://localhost:3000/verify](http://localhost:3000/verify).

```bash
npm run build       # production build
npx tsc --noEmit    # TypeScript check (no errors)
npm run lint        # ESLint
```

No backend required. No environment variables required. No data is sent anywhere. Camera capture is simulated. Session state is in-memory; a page reload clears it.

---

## 10. File Tree

```
clarity-verify-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── verify/page.tsx                      ← entry point
│
├── flows/
│   └── VerifyFlow.tsx                        ← root orchestrator
│
├── hooks/
│   ├── useVerifyFlow.ts                      ← screen navigation state
│   ├── useVerificationMachine.ts             ← state machine hook
│   ├── useSessionLifecycle.ts                ← session start, resume, upload, polling
│   ├── useDocQuality.ts                      ← simulated document quality checks
│   ├── useSelfieQuality.ts                   ← simulated selfie quality checks
│   └── useQualitySimulation.ts               ← shared simulation primitives
│
├── screens/
│   ├── WelcomeScreen.tsx
│   ├── CountryDocSelectScreen.tsx
│   ├── DocGuidanceScreen.tsx
│   ├── DocCaptureScreen.tsx
│   ├── SelfieGuidanceScreen.tsx
│   ├── SelfieCaptureScreen.tsx
│   ├── LivenessScreen.tsx
│   ├── ProcessingScreen.tsx
│   ├── OutcomeScreen.tsx
│   ├── RetryScreen.tsx
│   └── SuccessScreen.tsx                     ← legacy stub; superseded by OutcomeScreen
│
├── features/
│   └── verification/
│       ├── machine/
│       │   ├── states.ts                     ← VerificationStateName (23 states)
│       │   ├── events.ts                     ← VerificationEvent (19 events)
│       │   ├── context.ts                    ← VerificationContext + INITIAL_CONTEXT
│       │   ├── transitions.ts                ← transition() pure function
│       │   └── index.ts
│       ├── config/
│       │   ├── types.ts                      ← VerificationFlowConfig schema
│       │   ├── examples.ts                   ← 4 example configs
│       │   ├── resolvers.ts                  ← resolver + validateFlowConfig()
│       │   ├── adapters.ts                   ← docSelectConfigFromFlowConfig()
│       │   └── index.ts
│       ├── services/
│       │   ├── types.ts                      ← all request/response types
│       │   ├── service.ts                    ← VerificationService interface
│       │   ├── mockService.ts                ← in-memory mock (current default)
│       │   ├── mapping.ts                    ← BackendSessionStatus → machine state/event
│       │   └── index.ts
│       ├── selectors/
│       │   └── index.ts                      ← derived state helpers
│       └── types/
│           └── index.ts                      ← public type barrel
│
├── components/
│   ├── camera/
│   │   ├── CameraFrame.tsx
│   │   ├── DocCaptureOverlay.tsx
│   │   ├── DocCaptureInstruction.tsx
│   │   ├── FaceOverlay.tsx
│   │   ├── SelfieInstruction.tsx
│   │   └── ShutterButton.tsx
│   ├── layout/
│   │   ├── VerifyShell.tsx                   ← top bar, progress bar
│   │   ├── ThemeProvider.tsx
│   │   └── ScreenMotion.tsx                  ← direction-aware slide transitions
│   ├── primitives/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── NoticeBox.tsx
│   │   ├── AnimatedCheck.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Spinner.tsx
│   └── demo/                                 ← remove before shipping
│       ├── FlowInspector.tsx
│       └── ThemeSwitcher.tsx
│
├── lib/
│   ├── types.ts                              ← shared types (DocType, ErrorType, screen props)
│   ├── constants.ts                          ← DOC_TYPES, display labels, icons
│   ├── content.ts                            ← all user-facing copy
│   ├── theme.ts                              ← ClarityTheme type + 3 preset themes
│   ├── flow.ts                               ← legacy flow rule types
│   ├── flowEngine.ts                         ← legacy rule engine
│   ├── flowRules.ts                          ← legacy flow rules
│   ├── riskData.ts                           ← country → risk level table
│   └── utils.ts
│
└── docs/
    ├── architecture.md
    ├── engineering.md
    ├── verification-machine.md               ← state machine reference
    ├── verification-config.md                ← flow config reference
    ├── verification-api.md                   ← backend API and mapping reference
    ├── screen-gaps.md                        ← per-screen gap closure log
    └── handoff.md                            ← this file
```
