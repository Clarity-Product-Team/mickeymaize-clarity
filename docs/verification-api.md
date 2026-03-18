# Verification API and Backend Mapping Layer

Engineering and product reference for the backend contract, service interface, async lifecycle, and status mapping layer.

**Source files**
- `features/verification/services/types.ts` — request/response types and backend contracts
- `features/verification/services/service.ts` — `VerificationService` interface
- `features/verification/services/mapping.ts` — `BackendSessionStatus` → machine state/event mapping
- `features/verification/services/mockService.ts` — in-memory mock implementation
- `hooks/useSessionLifecycle.ts` — React hook: session persistence, resume, and poll loop

---

## Overview

The service layer sits between the frontend state machine and the backend verification API. It has three responsibilities:

1. **Transport** — sending and receiving HTTP calls (see `VerificationService` interface)
2. **Envelope** — wrapping every response in `ApiResponse<T>` so callers narrow with `if (!res.ok)` rather than `try/catch`
3. **Mapping** — translating `BackendSessionStatus` to machine states and events

The layer is provider-agnostic: no Onfido, Jumio, or Persona specifics appear in it. Any KYC backend that implements the contract in `types.ts` can be swapped in by providing a new implementation of `VerificationService`.

---

## Backend Contract Assumptions

The frontend assumes the following about the backend:

| Assumption | Notes |
|---|---|
| Session token is short-lived | Returned by `startSession` and `resumeSession`; must be rotated on resume for long-running sessions |
| `startSession` returns full workflow requirements | The client does not need to fetch the config separately |
| Upload ≠ submit | Uploading a file does **not** start the validation pipeline. A separate `submitStep` call does. |
| `submitStep` advances session status | After the last required step is submitted, status moves to `'processing'` |
| Final outcome comes only from polling | `fetchStatus` is the only endpoint that communicates `'approved'` or `'rejected'` |
| Backend may request additional steps | `needs_additional_step` and the `nextStep` field on responses allow the backend to redirect the user mid-flow |
| Session IDs are stable across tab close/reopen | The client persists the session ID in `sessionStorage` and calls `resumeSession` on mount |

---

## Response Envelope

Every service call returns `ApiResponse<T>` — a discriminated union on `ok`:

```typescript
type ApiResponse<T> =
  | { ok: true;  data: T;    error: null }
  | { ok: false; data: null; error: BackendError }
```

Usage pattern:

```typescript
const res = await service.startSession(req)
if (!res.ok) {
  // res.error.code, res.error.retryable, res.error.httpStatus
  return
}
// res.data is fully typed as StartSessionResponse
```

### `BackendError`

```typescript
interface BackendError {
  code:        string   // e.g. 'SESSION_EXPIRED', 'UPLOAD_TOO_LARGE'
  message:     string   // developer-facing only — never shown to end users
  retryable:   boolean  // true = transient failure; same request may be resent
  httpStatus?: number
}
```

---

## Service Interface

`VerificationService` is the stable contract that both the mock and the real HTTP implementation must satisfy. Callers inject whichever implementation is in scope — no code changes are required when switching from mock to real.

```typescript
interface VerificationService {
  startSession(req:    StartSessionRequest):    Promise<ApiResponse<StartSessionResponse>>
  resumeSession(req:   ResumeSessionRequest):   Promise<ApiResponse<ResumeSessionResponse>>
  uploadDocument(req:  UploadDocumentRequest):  Promise<ApiResponse<UploadDocumentResponse>>
  uploadFace(req:      UploadFaceRequest):      Promise<ApiResponse<UploadFaceResponse>>
  uploadLiveness(req:  UploadLivenessRequest):  Promise<ApiResponse<UploadLivenessResponse>>
  submitStep(req:      SubmitStepRequest):      Promise<ApiResponse<SubmitStepResponse>>
  fetchStatus(req:     FetchStatusRequest):     Promise<ApiResponse<FetchStatusResponse>>
}
```

The current implementation is `mockVerificationService` in `features/verification/services/mockService.ts`. The real HTTP implementation will satisfy the same interface.

---

## Request / Response Shapes

### `startSession`

**Request**

```typescript
interface StartSessionRequest {
  applicantId?:  string                    // ties the session to an existing user record
  metadata?:     Record<string, string>    // passed through to webhooks + audit log
  flowVersion?:  string                    // selects a named flow variant (e.g. 'high_risk')
}
```

**Response**

```typescript
interface StartSessionResponse {
  session:       SessionSummary                // { sessionId, status, expiresAt }
  token:         string                        // bearer token for all subsequent requests
  requirements:  BackendWorkflowRequirements   // full session config (countries, docs, steps)
}
```

The `requirements` field is the authoritative session config. In production this replaces the static `EXAMPLE_LOW_RISK_FLOW` that `VerifyFlow.tsx` uses today.

---

### `resumeSession`

**Request**

```typescript
interface ResumeSessionRequest {
  sessionId: string
}
```

**Response**

```typescript
interface ResumeSessionResponse {
  session:       SessionSummary
  token:         string                        // refreshed token
  requirements:  BackendWorkflowRequirements
  nextStep:      BackendRequiredStep | null    // null = all steps already submitted
}
```

`nextStep` tells the frontend which capture screen to navigate to. When null, all inputs have been collected and the frontend should go to the `processing` screen.

---

### `uploadDocument`

**Request** — sent as `multipart/form-data` by the real service layer.

```typescript
interface UploadDocumentRequest {
  sessionId:   string
  side:        'front' | 'back'
  docType:     DocType
  file:        Blob | File
  mimeType:    string
  capturedAt:  string   // ISO 8601 — client records this at capture time
}
```

**Response**

```typescript
interface UploadDocumentResponse {
  uploadId:       string                  // opaque ID, passed to submitStep
  side:           'front' | 'back'
  qualityChecks?: QualityCheckResult[]    // preliminary checks (blur, glare, partial)
  acceptable:     boolean                 // passed preliminary checks?
  rejectReason?:  string
}
```

`acceptable: true` means the file is usable. It is **not** the final verification result — that only comes from polling `fetchStatus`.

---

### `uploadFace`

```typescript
interface UploadFaceRequest  { sessionId, file, mimeType, capturedAt }
interface UploadFaceResponse { uploadId, qualityChecks?, acceptable, rejectReason? }
```

Same pattern as `uploadDocument`. Preliminary quality checks: `face_centered`, `low_light`, `too_far`.

---

### `uploadLiveness`

Supports two patterns — provider-token-based and raw-file-based:

```typescript
interface UploadLivenessRequest {
  sessionId:       string
  livenessToken?:  string       // from provider SDK (mutually exclusive with file)
  file?:           Blob | File  // raw clip for backend analysis (mutually exclusive with livenessToken)
  mimeType?:       string
  capturedAt:      string
}

interface UploadLivenessResponse {
  uploadId:        string
  livenessScore?:  number   // 0–1 confidence, when backend scores it
  acceptable:      boolean
  rejectReason?:   string
}
```

---

### `submitStep`

Triggers the backend validation pipeline for a completed capture step.

```typescript
interface SubmitStepRequest {
  sessionId:  string
  step:       BackendStepType    // which step is being submitted
  uploadIds:  string[]           // IDs from the preceding upload call(s)
}

interface SubmitStepResponse {
  sessionId:      string
  submittedStep:  BackendStepType
  status:         BackendSessionStatus   // 'processing' when last step, otherwise 'collecting_inputs'
  nextStep:       BackendRequiredStep | null
  message?:       string
}
```

When `nextStep` is null and `status` is `'processing'`, all required steps have been collected. The frontend should navigate to the processing screen and begin polling `fetchStatus`.

---

### `fetchStatus`

The only source of truth for the final verification outcome.

```typescript
// Request: sessionId is typically a path parameter — no body.
interface FetchStatusRequest { sessionId: string }

interface FetchStatusResponse {
  sessionId:       string
  status:          BackendSessionStatus
  outcome?:        VerificationOutcome   // present when status is 'approved' or 'rejected'
  reviewToken?:    string                // present when status is 'manual_review'
  failureReason?:  string                // present on 'rejected' or 'needs_retry'
  retryAllowed:    boolean
  updatedAt:       string                // ISO 8601
}
```

---

## Backend Session Status

`BackendSessionStatus` is the backend's view of where a session is in its lifecycle.

```
initiated             → idle / intro (session created, no inputs collected)
collecting_inputs     → any capture state (user is actively submitting documents/selfie)
validating_inputs     → any validating_* state (backend is running preliminary checks)
processing            → processing / awaiting_backend_result (final pipeline running)
needs_retry           → retryable_failure (a step failed; user must redo it)
needs_additional_step → additional_step_required (backend requests extra input)
manual_review         → pending_manual_review (submission is queued for human review)
approved              → verified
rejected              → unrecoverable_failure
expired               → unrecoverable_failure (session token expired)
cancelled             → cancelled
```

**Terminal statuses** (no further transitions): `approved`, `rejected`, `expired`, `cancelled`.

---

## Status → Machine State Mapping

`mapBackendStatusToMachineState(status, nextStep?)` in `mapping.ts` converts a backend status to the equivalent frontend `VerificationStateName`.

For statuses that depend on which step the backend is waiting on (`collecting_inputs`, `validating_inputs`, `needs_retry`), the optional `nextStep` parameter is used to land in the correct capture or validating state. When `nextStep` is absent, a safe fallback is used.

| Backend status | Frontend state (no `nextStep`) | Frontend state (with `nextStep`) |
|---|---|---|
| `initiated` | `intro` | — |
| `collecting_inputs` | `capturing_document_front` | `capturing_{step}` |
| `validating_inputs` | `validating_document_front` | `validating_{step}` |
| `needs_retry` | `retryable_failure` | — |
| `needs_additional_step` | `additional_step_required` | — |
| `processing` | `awaiting_backend_result` | — |
| `manual_review` | `pending_manual_review` | — |
| `approved` | `verified` | — |
| `rejected` | `unrecoverable_failure` | — |
| `expired` | `unrecoverable_failure` | — |
| `cancelled` | `cancelled` | — |

---

## Status → Machine Event Mapping

`mapFetchStatusToEvent(response)` converts a `fetchStatus` response into a machine event (or `null` when the machine should wait for the next poll).

| Backend status | Machine event dispatched |
|---|---|
| `approved` | `BACKEND_RESULT_RECEIVED { outcome: 'verified', reviewToken? }` |
| `rejected` | `BACKEND_RESULT_RECEIVED { outcome: 'rejected' }` |
| `expired` | `BACKEND_RESULT_RECEIVED { outcome: 'rejected' }` |
| `cancelled` | `CANCEL` |
| `manual_review` | `BACKEND_RESULT_RECEIVED { outcome: 'pending', reviewToken? }` |
| `needs_additional_step` | `BACKEND_RESULT_RECEIVED { outcome: 'additional_step' }` |
| `needs_retry` | `RETRY_STEP` |
| `processing` | `null` (continue polling) |
| `validating_inputs` | `null` (continue polling) |
| `collecting_inputs` | `null` (no event — user input drives this) |
| `initiated` | `null` |

`mapSubmitStepToEvent(response)` applies the same mapping to `submitStep` responses, with the addition that `collecting_inputs` and `processing` statuses both produce `UPLOAD_SUCCEEDED`.

---

## Polling Control

`shouldContinuePolling(status)` returns `true` only when the backend is actively doing async work and the frontend has nothing to do but wait:

| Status | Continue polling? |
|---|---|
| `processing` | Yes |
| `validating_inputs` | Yes |
| All other statuses | No |

The poll loop in `useSessionLifecycle` fires immediately on `beginPolling()` (`FIRST_POLL_DELAY_MS = 0`), then waits `RETRY_POLL_DELAY_MS = 2500ms` between subsequent calls.

---

## Async Session Lifecycle

The full session lifecycle in sequence:

```
1. startSession()       → session created; requirements returned; token stored
2. uploadDocument(front) → artifact stored; uploadId returned
   submitStep(doc_front) → pipeline triggered; nextStep returned
   [uploadDocument(back)]→ (two-sided docs only)
   [submitStep(doc_back)]
3. uploadFace()          → artifact stored; uploadId returned
   submitStep(face)      → pipeline triggered; nextStep returned
   [uploadLiveness()]
   [submitStep(liveness)]
4. submitStep(last step) → status → 'processing'; nextStep = null
5. beginPolling()        → CONTINUE dispatched; machine: processing → awaiting_backend_result
6. fetchStatus() × N    → polls every 2.5s until terminal status
7. Terminal result       → BACKEND_RESULT_RECEIVED or RETRY_STEP or CANCEL
   clearPersistedSession()  → session ID removed from sessionStorage
```

**Key separation: upload vs submit**

Uploading and submitting are separate operations:
- `upload*()` transfers the file to the backend and returns preliminary quality checks. Session status stays `collecting_inputs`. This is analogous to the file landing in object storage — not yet processed.
- `submitStep()` tells the backend to run its validation pipeline on the uploaded artifact. This is where OCR, face-match, and liveness checks run.

Callers must not assume that a successful upload means a step is complete.

---

## Resume Model

Session IDs are persisted to `sessionStorage` under the key `cv_session_id`. When the user returns to the app (refresh or tab reopen), the `useSessionLifecycle` hook detects the stored ID on mount and calls `resumeSession`:

```
Mount → readPersistedSessionId()
  → found → resumeSession({ sessionId })
      → success → dispatch RESUME; navigate to nextStep screen (or 'processing' if null)
      → failure → clearPersistedSession(); start fresh
  → not found → no resume
```

The response includes a refreshed token and a `nextStep` field. The frontend maps `nextStep` to a UI screen using `stepToFlowScreen()` in `VerifyFlow.tsx`:

| `BackendStepType` | UI screen |
|---|---|
| `document_front` | `doc-capture-front` |
| `document_back` | `doc-capture-back` |
| `face_capture` | `selfie-capture` |
| `liveness` | `liveness` |
| `address_proof` / `video_call` / `custom` | `null` → `additional_step_required` outcome |

The session ID is cleared from `sessionStorage` when a terminal result is received, so the next visit starts fresh.

---

## Retry Model

The backend uses two mechanisms to request a retry:

### 1. `needs_retry` via polling

When `fetchStatus` returns `status: 'needs_retry'`, `mapFetchStatusToEvent` dispatches `RETRY_STEP`. The machine transitions from `awaiting_backend_result` to `retryable_failure`.

`VerifyFlow.tsx` watches for `machineState === 'retryable_failure'` while `currentScreen === 'processing'` and routes the user back to the appropriate capture screen using `context.failedState`:

| `failedState` | Retry screen |
|---|---|
| `capturing_document_front` | `doc-capture-front` |
| `capturing_document_back` | `doc-capture-back` |
| `capturing_face` | `selfie-capture` |
| `capturing_motion` | `liveness` |

### 2. `needs_retry` via `submitStep`

If `submitStep` immediately returns `needs_retry` (the backend rejected the artifact synchronously), `mapSubmitStepToEvent` also dispatches `RETRY_STEP`, and the same retry navigation applies.

### Attempt limits

`BackendRequiredStep.maxAttempts` carries the backend's cap for a given step. If absent, the client applies `DEFAULT_MAX_ATTEMPTS` (currently 3, from `features/verification/selectors/`). When the attempt limit is reached, the machine escalates to `unrecoverable_failure`.

---

## `BackendRequiredStep`

Used in resume and step-submission responses to describe exactly what the backend expects next:

```typescript
interface BackendRequiredStep {
  type:          BackendStepType   // which step
  documentType?: DocType           // which doc type (for doc_front / doc_back on resume)
  instructions?: string            // backend-provided guidance text (may be shown in UI)
  retryable:     boolean
  maxAttempts?:  number
}
```

`BackendStepType` extends the frontend's `FlowStepId` with backend-only steps:

| Type | Frontend handling |
|---|---|
| `document_front` | `capturing_document_front` |
| `document_back` | `capturing_document_back` |
| `face_capture` | `capturing_face` |
| `liveness` | `capturing_motion` |
| `address_proof` | `additional_step_required` — no direct capture screen |
| `video_call` | `additional_step_required` — no direct capture screen |
| `custom` | `additional_step_required` — requires custom handling |

---

## Mock Service

`mockVerificationService` implements `VerificationService` using an in-memory `Map`. It is the current active implementation in `VerifyFlow.tsx`.

**Simulated latency:**

| Operation | Delay range |
|---|---|
| `startSession` / `resumeSession` | 280–480 ms |
| `uploadDocument` / `uploadFace` / `uploadLiveness` | 700–1100 ms |
| `submitStep` | 350–550 ms |
| `fetchStatus` | 180–280 ms |

**Mock behavior:**
- All uploads return `acceptable: true` with stub quality checks.
- `submitStep` advances the step counter; when all required steps are submitted, status moves to `'processing'`.
- `fetchStatus` returns `'processing'` on the first poll after submission, then `'approved'` on the second — simulating a short async pipeline.
- `resumeSession` fails with `SESSION_NOT_FOUND` when called after a page reload (in-memory state is gone). The lifecycle hook treats this as a fresh session start.
- Flow variant `'high_risk'` can be requested via `startSession({ flowVersion: 'high_risk' })` to test the liveness path.

**Switching to a real implementation:**

Replace the `mockVerificationService` injection site in `VerifyFlow.tsx` and `hooks/useSessionLifecycle.ts` with an `httpVerificationService` that implements `VerificationService` using `fetch`. No other changes are required — the mapping layer and hook are implementation-agnostic.

---

## File Map

```
features/verification/services/
  types.ts       — ApiResponse, BackendError, BackendSessionStatus,
                   BackendStepType, BackendRequiredStep, SessionSummary,
                   BackendWorkflowRequirements, QualityCheckResult,
                   StartSession*, ResumeSession*, UploadDocument*,
                   UploadFace*, UploadLiveness*, SubmitStep*, FetchStatus*,
                   TERMINAL_BACKEND_STATUSES
  service.ts     — VerificationService interface
  mockService.ts — in-memory mock implementation (current default)
  mapping.ts     — mapBackendStatusToMachineState, mapNextStepToMachineState,
                   mapFetchStatusToEvent, mapSubmitStepToEvent,
                   shouldContinuePolling, mapFetchStatusToMachineAction
  index.ts       — re-exports all of the above

hooks/
  useSessionLifecycle.ts  — session persistence (sessionStorage), resumeSession
                            on mount, beginPolling poll loop, cleanup on unmount
```
