# Verification State Machine

This document is the authoritative reference for the Clarity Verify state machine.

It covers all states, all events, the transition rules between them, context fields, retry behavior, and which states are terminal. It is written for engineers who integrate with or extend the machine, and for product teams who need to understand what the machine tracks and why.

**Source files**

```
features/verification/machine/states.ts       — state names and group constants
features/verification/machine/events.ts       — event union and payloads
features/verification/machine/context.ts      — VerificationContext type
features/verification/machine/transitions.ts  — transition() function and table
features/verification/selectors/index.ts      — derived view data (progress, labels, errors)
```

---

## How the machine works

The machine is a pure reducer: given a current state, an event, and the current context, `transition()` returns the next state and a partial context update. It has no side effects and does not perform I/O.

```
transition(currentState, event, context) → { state, contextPatch } | null
```

`null` means the event is not valid in the current state — the machine stays where it is. Callers (the React hook `useVerificationMachine`) treat `null` as a no-op.

Context fields are updated by merging `contextPatch` into the existing context. Only changed fields are included in the patch.

---

## States

States are grouped by phase. The groups are organisational — the machine does not enforce them as a type constraint.

### Entry

| State | Meaning |
|---|---|
| `idle` | Machine created; session not yet started |
| `intro` | Welcome / onboarding screen is shown to the user |

### Setup

| State | Meaning |
|---|---|
| `preparation` | Pre-capture checks running (device readiness, network) |
| `requesting_permissions` | Camera permission prompt is in progress |
| `selecting_country` | User is choosing the document's issuing country |
| `selecting_document` | User is choosing the document type |

### Document capture

Each capture step has three sub-states: the live camera view (`capturing_*`), the automated quality check (`validating_*`), and a user-facing review screen (`reviewing_*`). Together they form one logical step. The progress indicator does not advance within a logical step.

| State | Meaning |
|---|---|
| `capturing_document_front` | Camera live — front side of document |
| `validating_document_front` | Quality and authenticity check running — front |
| `reviewing_document_front` | User confirms the captured image or requests a retake |
| `capturing_document_back` | Camera live — back side of document |
| `validating_document_back` | Quality and authenticity check running — back |
| `reviewing_document_back` | User confirms the captured image or requests a retake |

### Biometrics

| State | Meaning |
|---|---|
| `capturing_face` | Selfie auto-capture in progress |
| `validating_face` | Face quality and preliminary match check |
| `capturing_motion` | Liveness: user following head-movement instruction |
| `validating_motion` | Liveness: post-motion quality check |

> **Note (current implementation):** `validating_face` always transitions to `capturing_motion` regardless of whether liveness is required for the flow. A future context-aware transition will skip to `uploading` when `flowConfig.liveness.required` is false.

### Backend

| State | Meaning |
|---|---|
| `uploading` | Captured artifacts being uploaded to the backend |
| `processing` | Backend pipeline running; UI progress animation plays |
| `awaiting_backend_result` | Polling `fetchStatus()` for the async decision |

### Outcomes

These states are reached when the backend returns a final decision. They are **not** strictly terminal — `CONTINUE` is accepted so the UI can acknowledge user actions — but no further verification work can be performed from them. The caller is responsible for closing or redirecting the flow.

| State | Meaning |
|---|---|
| `additional_step_required` | Backend requires further action from the user (e.g. address proof, video call) |
| `pending_manual_review` | Submitted; decision deferred to a human reviewer |
| `verified` | Identity confirmed — final success state |

### Failure / exit

| State | Meaning |
|---|---|
| `retryable_failure` | A step failed; the user may attempt it again (subject to attempt limits) |
| `unrecoverable_failure` | Hard rejection, camera blocked at OS level, or session exhausted — no retry possible |
| `cancelled` | Session cancelled by the user or system |

---

## Terminal states

Terminal states accept no further events. `transition()` returns `null` for any event dispatched from a terminal state.

```
verified
unrecoverable_failure
cancelled
```

`pending_manual_review` and `additional_step_required` behave like soft terminals: they accept `CONTINUE` for acknowledgement (the machine loops back to the same state) but no verification work proceeds.

---

## Camera states

The `CAPTURE_STATES` constant identifies states that require an active device camera. UI code uses this to gate camera permission checks and manage the camera lifecycle.

```
capturing_document_front
capturing_document_back
capturing_face
capturing_motion
```

---

## Events

All events are discriminated on the `type` field. Events with no additional data use the minimal `{ type: 'EVENT_NAME' }` shape.

### Session lifecycle

| Event | Payload | Dispatched when |
|---|---|---|
| `START` | — | User taps the primary CTA on the welcome screen |
| `RESUME` | `sessionId: string` | A stored session ID was found and `resumeSession()` succeeded |
| `RESTART` | — | User or system resets from `intro` back to `idle` |
| `CANCEL` | — | User explicitly cancels, or the backend returns `cancelled` status |
| `CONTINUE` | — | General forward signal — used at multiple points (see transition table) |

### Setup

| Event | Payload | Dispatched when |
|---|---|---|
| `COUNTRY_SELECTED` | `country: string` | User selects an issuing country |
| `DOCUMENT_SELECTED` | `docType: DocType` | User selects a document type |

### Camera permission

| Event | Payload | Dispatched when |
|---|---|---|
| `PERMISSION_GRANTED` | — | Browser confirms camera access |
| `PERMISSION_DENIED` | — | User denied the permission prompt — recoverable |
| `PERMISSION_BLOCKED` | — | Camera blocked at OS or browser policy level — not recoverable |

### Capture

| Event | Payload | Dispatched when |
|---|---|---|
| `CAPTURE_CONFIRMED` | — | Auto-capture fires (selfie) or user confirms from the review screen |
| `CAPTURE_FAILED` | `reason: ErrorType` | Capture-time failure detected (blur, glare, wrong doc, etc.) |
| `RETAKE` | — | User taps "retake" on the review screen |
| `SKIP_STEP` | — | Selfie is optional and the user skips it |

`ErrorType` values: `'blur'` `'glare'` `'partial'` `'wrong_doc'` `'expired'` `'face_mismatch'`

### Upload

| Event | Payload | Dispatched when |
|---|---|---|
| `UPLOAD_STARTED` | — | Upload to backend begins (informational; not currently wired to a transition) |
| `UPLOAD_SUCCEEDED` | — | Backend accepted the upload and returned a valid step response |
| `UPLOAD_FAILED` | `reason: string` | Upload failed (network error, server rejection) |

### Validation

| Event | Payload | Dispatched when |
|---|---|---|
| `VALIDATION_PASSED` | — | Quality check passed; artifact is acceptable |
| `VALIDATION_FAILED` | `reason: string` | Quality check failed; artifact rejected |

### Backend result

| Event | Payload | Dispatched when |
|---|---|---|
| `BACKEND_RESULT_RECEIVED` | `outcome: VerificationOutcome`, `reviewToken?: string` | `fetchStatus()` poll returns a terminal or actionable status |

`VerificationOutcome` values: `'verified'` `'pending'` `'additional_step'` `'retry'` `'rejected'`

### Retry

| Event | Payload | Dispatched when |
|---|---|---|
| `RETRY_STEP` | — | User confirms retry on the retry screen, or backend returns `needs_retry` |

---

## Context fields

`VerificationContext` is the data carried across all transitions. It is initialised from `INITIAL_CONTEXT` when the machine starts and updated incrementally by context patches.

### Session

| Field | Type | Set by | Meaning |
|---|---|---|---|
| `sessionId` | `string \| null` | `RESUME` | Opaque ID from the backend. Null until `resumeSession()` succeeds or session start stores it externally |
| `startedAt` | `number \| null` | `START`, `RESUME` | Unix timestamp (ms) when the session was first started on this device |

### Flow configuration

| Field | Type | Set by | Meaning |
|---|---|---|---|
| `docType` | `DocType \| null` | `DOCUMENT_SELECTED` | Selected document type |
| `country` | `string \| null` | `COUNTRY_SELECTED` | Selected issuing country |
| `riskLevel` | `RiskLevel \| null` | Not yet wired | Risk level derived from country + document |
| `deviceType` | `DeviceType` | Initialised externally | `'mobile'` or `'desktop'` — informs flow rules |

### Camera permission

| Field | Type | Set by | Values |
|---|---|---|---|
| `cameraPermission` | `string` | Permission events | `'unknown'` `'granted'` `'denied'` `'blocked'` |

### Capture artifacts

| Field | Type | Set by | Meaning |
|---|---|---|---|
| `documentFront` | `CaptureArtifact \| null` | Not yet wired | Preview URL + metadata for front-side capture |
| `documentBack` | `CaptureArtifact \| null` | Not yet wired | Preview URL + metadata for back-side capture |
| `selfie` | `CaptureArtifact \| null` | Not yet wired | Preview URL + metadata for selfie |
| `livenessToken` | `string \| null` | Not yet wired | Opaque token from the liveness provider |

`CaptureArtifact` shape: `{ previewUrl: string, mimeType: string, capturedAt: number }`

Artifacts are object URLs or signed blob references — never raw binary data.

### Retry tracking

| Field | Type | Set by | Meaning |
|---|---|---|---|
| `attempts` | `AttemptRecord` | `RETRY_STEP` | Map of `stateName → attempt count`. Incremented by each `RETRY_STEP` event |
| `failedState` | `VerificationStateName \| null` | Failure events | The state that most recently caused a failure. Used by `RETRY_STEP` and `PERMISSION_GRANTED` to return to the right capture step. Cleared on retry |

`AttemptRecord` is `Partial<Record<VerificationStateName, number>>`. States not yet retried have no key (equivalent to 0 attempts).

### Backend result

| Field | Type | Set by | Meaning |
|---|---|---|---|
| `outcome` | `VerificationOutcome \| null` | `BACKEND_RESULT_RECEIVED` | Final verification outcome from the backend |
| `reviewToken` | `string \| null` | `BACKEND_RESULT_RECEIVED` | Token for manual review lookup or support escalation |
| `failureReason` | `string \| null` | Failure events | Human-readable reason for the most recent failure. Cleared on retry |

---

## Transition table

The full transition table. Conditional transitions are marked with `†` and explained below.

### Entry

| From | Event | To |
|---|---|---|
| `idle` | `START` | `intro` |
| `idle` | `RESUME` | `preparation` |
| `intro` | `CONTINUE` | `selecting_country` |
| `intro` | `RESTART` | `idle` |

### Setup

| From | Event | To |
|---|---|---|
| `preparation` | `CONTINUE` | `selecting_country` |
| `preparation` | `CANCEL` | `cancelled` |
| `selecting_country` | `COUNTRY_SELECTED` | `selecting_document` |
| `selecting_country` | `CANCEL` | `cancelled` |
| `selecting_document` | `DOCUMENT_SELECTED` | `capturing_document_front` |
| `selecting_document` | `CANCEL` | `cancelled` |

### Camera permission

| From | Event | To |
|---|---|---|
| `requesting_permissions` | `PERMISSION_GRANTED` | `context.failedState` † |
| `requesting_permissions` | `PERMISSION_DENIED` | `retryable_failure` |
| `requesting_permissions` | `PERMISSION_BLOCKED` | `unrecoverable_failure` |
| `requesting_permissions` | `CANCEL` | `cancelled` |

†  `PERMISSION_GRANTED` returns the machine to whichever capture state triggered the permission request, stored in `context.failedState`. Falls back to `capturing_document_front` if `failedState` is null.

### Document capture — front

| From | Event | To |
|---|---|---|
| `capturing_document_front` | `CAPTURE_CONFIRMED` | `validating_document_front` |
| `capturing_document_front` | `CAPTURE_FAILED` | `retryable_failure` |
| `capturing_document_front` | `PERMISSION_DENIED` | `requesting_permissions` |
| `capturing_document_front` | `PERMISSION_BLOCKED` | `requesting_permissions` |
| `capturing_document_front` | `CANCEL` | `cancelled` |
| `validating_document_front` | `VALIDATION_PASSED` | `reviewing_document_front` |
| `validating_document_front` | `VALIDATION_FAILED` | `retryable_failure` |
| `reviewing_document_front` | `CAPTURE_CONFIRMED` | `capturing_document_back` ‡ |
| `reviewing_document_front` | `RETAKE` | `capturing_document_front` |
| `reviewing_document_front` | `CANCEL` | `cancelled` |

‡  A future context-aware transition will skip directly to `capturing_face` when the selected document does not require a back side (e.g. passport). Currently always routes to `capturing_document_back`.

### Document capture — back

| From | Event | To |
|---|---|---|
| `capturing_document_back` | `CAPTURE_CONFIRMED` | `validating_document_back` |
| `capturing_document_back` | `CAPTURE_FAILED` | `retryable_failure` |
| `capturing_document_back` | `PERMISSION_DENIED` | `requesting_permissions` |
| `capturing_document_back` | `PERMISSION_BLOCKED` | `requesting_permissions` |
| `capturing_document_back` | `CANCEL` | `cancelled` |
| `validating_document_back` | `VALIDATION_PASSED` | `reviewing_document_back` |
| `validating_document_back` | `VALIDATION_FAILED` | `retryable_failure` |
| `reviewing_document_back` | `CAPTURE_CONFIRMED` | `capturing_face` |
| `reviewing_document_back` | `RETAKE` | `capturing_document_back` |
| `reviewing_document_back` | `CANCEL` | `cancelled` |

### Biometrics

| From | Event | To |
|---|---|---|
| `capturing_face` | `CAPTURE_CONFIRMED` | `validating_face` |
| `capturing_face` | `CAPTURE_FAILED` | `retryable_failure` |
| `capturing_face` | `SKIP_STEP` | `capturing_motion` |
| `capturing_face` | `PERMISSION_DENIED` | `requesting_permissions` |
| `capturing_face` | `PERMISSION_BLOCKED` | `requesting_permissions` |
| `capturing_face` | `CANCEL` | `cancelled` |
| `validating_face` | `VALIDATION_PASSED` | `capturing_motion` ‡ |
| `validating_face` | `VALIDATION_FAILED` | `retryable_failure` |
| `capturing_motion` | `CAPTURE_CONFIRMED` | `validating_motion` |
| `capturing_motion` | `CAPTURE_FAILED` | `retryable_failure` |
| `capturing_motion` | `PERMISSION_DENIED` | `requesting_permissions` |
| `capturing_motion` | `PERMISSION_BLOCKED` | `requesting_permissions` |
| `capturing_motion` | `CANCEL` | `cancelled` |
| `validating_motion` | `VALIDATION_PASSED` | `uploading` |
| `validating_motion` | `VALIDATION_FAILED` | `retryable_failure` |

‡  A future context-aware transition will skip directly to `uploading` when liveness is not required for the flow. Currently always routes to `capturing_motion`.

### Backend

| From | Event | To |
|---|---|---|
| `uploading` | `UPLOAD_SUCCEEDED` | `processing` |
| `uploading` | `UPLOAD_FAILED` | `retryable_failure` |
| `uploading` | `CANCEL` | `cancelled` |
| `processing` | `CONTINUE` | `awaiting_backend_result` |
| `awaiting_backend_result` | `BACKEND_RESULT_RECEIVED` | outcome-dependent † |

† `BACKEND_RESULT_RECEIVED` maps `event.outcome` to the next state:

| Outcome value | Next state |
|---|---|
| `'verified'` | `verified` |
| `'pending'` | `pending_manual_review` |
| `'rejected'` | `unrecoverable_failure` |
| `'additional_step'` | `additional_step_required` |
| `'retry'` | `retryable_failure` |

### Failure

| From | Event | To |
|---|---|---|
| `retryable_failure` | `RETRY_STEP` | `context.failedState` † |
| `retryable_failure` | `CANCEL` | `cancelled` |

† `RETRY_STEP` requires `context.failedState` to be set. Returns `null` (no-op) if it is null.

### Post-outcome

| From | Event | To |
|---|---|---|
| `additional_step_required` | `CONTINUE` | `additional_step_required` (self-loop) |
| `pending_manual_review` | `CONTINUE` | `pending_manual_review` (self-loop) |

Self-loops exist so `CONTINUE` is not a no-op — it triggers a context patch opportunity and keeps the event model consistent. The caller is responsible for navigating the user out of the flow.

---

## Retry behavior

### How retries work

1. A capture or validation step fails.
2. The machine transitions to `retryable_failure`.
3. Context is updated: `failedState = <the state that failed>`, `failureReason = <reason string>`.
4. The UI shows `RetryScreen` with copy derived from `failureReason`.
5. User confirms retry → `RETRY_STEP` event dispatched.
6. Machine transitions back to `context.failedState`.
7. Context is updated: `attempts[failedState]++`, `failedState = null`, `failureReason = null`.

### Attempt limits

Defined in `features/verification/selectors/index.ts`. `canRetry(state, context)` returns false when the limit is reached — callers should escalate to `unrecoverable_failure` at that point.

| Step | Max attempts |
|---|---|
| `capturing_document_front` | 3 |
| `capturing_document_back` | 3 |
| `capturing_face` | 3 |
| `capturing_motion` | 2 (liveness is harder to recover from without human support) |
| `uploading` | 5 (network retries require no user effort) |
| All other steps | 3 (default) |

### Backend-driven retry

When `fetchStatus()` returns `needs_retry`, the mapping layer dispatches `RETRY_STEP`. This requires `context.failedState` to be set from a prior failure. If `failedState` is null at that point (all captures succeeded before polling), `RETRY_STEP` is a no-op and the caller must handle navigation explicitly.

### What is not retryable

- `PERMISSION_BLOCKED` → `unrecoverable_failure` (OS-level block cannot be resolved without leaving the browser).
- Any state once `TERMINAL_STATES` is reached.
- `retryable_failure` when `canRetry()` returns false (attempt limit exceeded).

---

## State groups quick reference

```
Entry            idle, intro
Setup            preparation, requesting_permissions,
                 selecting_country, selecting_document
Document front   capturing_document_front, validating_document_front, reviewing_document_front
Document back    capturing_document_back, validating_document_back, reviewing_document_back
Biometrics       capturing_face, validating_face, capturing_motion, validating_motion
Backend          uploading, processing, awaiting_backend_result
Outcomes         additional_step_required, pending_manual_review, verified
Failure / exit   retryable_failure, unrecoverable_failure, cancelled

Terminal (hard)  verified, unrecoverable_failure, cancelled
Terminal (soft)  additional_step_required, pending_manual_review
Camera required  capturing_document_front, capturing_document_back,
                 capturing_face, capturing_motion
```

---

## Known gaps and future work

| Gap | Notes |
|---|---|
| Back-side skip | `reviewing_document_front → CAPTURE_CONFIRMED` always routes to `capturing_document_back`. Should skip to `capturing_face` for single-sided documents (passport). Requires context-aware transition. |
| Liveness skip | `validating_face → VALIDATION_PASSED` always routes to `capturing_motion`. Should skip to `uploading` when `flowConfig.liveness.required` is false. Requires context-aware transition. |
| Artifact storage | `documentFront`, `documentBack`, `selfie`, `livenessToken` fields in context are defined but not yet populated by the capture screens. Currently stored as refs in the orchestrator. |
| `sessionId` on start | `START` event does not set `context.sessionId`. The session ID is stored in a ref in the orchestrator and written to `context` only on `RESUME`. A `SESSION_STARTED` event or a `startedAt` patch should populate this field. |
| Backend retry with no `failedState` | If `fetchStatus()` returns `needs_retry` after all captures succeeded, `RETRY_STEP` is a no-op because `context.failedState` is null. Requires a `failedStep` field in the backend response to resolve. |
| Max attempt enforcement | `canRetry()` is implemented but not yet wired to automatically escalate `retryable_failure → unrecoverable_failure`. Currently the UI is responsible for checking the limit. |
