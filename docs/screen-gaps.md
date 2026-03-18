# Screen-by-Screen Gap Closure

Status of each screen: what was prototype behavior, what is now production-aligned, and what still requires backend or provider work before it is production-ready.

**Legend**
- ✅ Implemented and production-aligned
- ⚠️ Implemented but with known limitations or stubs
- 🔲 Not yet implemented — requires backend or provider work

---

## 1. Welcome / Intro

**File:** [screens/WelcomeScreen.tsx](../screens/WelcomeScreen.tsx)

### Original prototype behavior
- Static screen with fixed heading, step list, and CTA.
- Always displayed in "fresh" mode regardless of session history.
- Step list was hardcoded; did not reflect actual session configuration.

### Now production-aligned
- ✅ **Three display modes** — `'fresh'` (first visit), `'resume'` (returning to an in-progress session), `'restart'` (re-entering after a failed attempt). Each mode shows a different heading, badge, subheading, CTA, and contextual notice.
- ✅ **Resume notice** — when `mode === 'resume'`, a contextual notice with a clock icon replaces the step list, informing the user that they are continuing a previous session.
- ✅ **Restart notice** — when `mode === 'restart'`, a warning-colored notice replaces the step list.
- ✅ **`welcomeMode` driven by machine state** — `useVerificationMachine` exposes `welcomeMode`, derived from whether a prior session ID was found in `sessionStorage`.

### Remaining gaps
- 🔲 **Step list is static** — the three steps shown in fresh mode (scan, selfie, verified) are hardcoded in `lib/content.ts`. In production, the step list should be derived from `BackendWorkflowRequirements` returned by `startSession`, so the list reflects the actual flow (e.g. liveness step only shown when `liveness.required: true`).
- 🔲 **Applicant name personalization** — no name or greeting is shown. Production: session metadata may include the applicant's name for a personalized heading.

---

## 2. Document Selection

**File:** [screens/CountryDocSelectScreen.tsx](../screens/CountryDocSelectScreen.tsx)

### Original prototype behavior
- Country list was hardcoded in `lib/constants.ts`.
- Document types were also hardcoded and not filtered by country.
- Journey hint was driven by the legacy `evaluateFlow()` rule engine (hardcoded assumptions).
- Risk badge derived entirely from local `riskData.ts` table.

### Now production-aligned
- ✅ **Config-driven country list** — `supportedCountries` from `VerificationFlowConfig` replaces the hardcoded list. The adapter `docSelectConfigFromFlowConfig()` bridges the config to the screen's `DocSelectConfig` interface.
- ✅ **Config-driven document list** — `config.getDocTypes(country)` filters available document types per selected country. A document is only shown when its `supportedCountries` list includes the selected country (by name or ISO code), or when it has no country restriction.
- ✅ **Liveness step in journey hint** — `livenessRequired` prop sourced from `VerificationFlowConfig.liveness.required`. When `true`, the journey hint shows a definite liveness step; when `false`, it is omitted. No longer conditional on risk level.
- ✅ **Back-side badge** — "2 sides" badge shown when `requiresBackCapture` is true for the selected document, driven by `DocumentCaptureRules`.
- ✅ **Machine events dispatched** — selecting a country dispatches `COUNTRY_SELECTED`; confirming a document dispatches `DOCUMENT_SELECTED`.

### Remaining gaps
- 🔲 **Risk level from backend** — risk level is still derived locally from `deriveRiskLevel(country)` in `lib/riskData.ts`. Production: use `SupportedCountry.riskOverride` when provided by the backend, falling back to the local table only when absent.
- 🔲 **Config from session API** — `docSelectConfig` is still derived from the static `EXAMPLE_LOW_RISK_FLOW`. Production: replace with the `requirements` returned by `startSession()`.
- 🔲 **Country search / filter** — the country picker is a plain `<select>`. For long country lists (EXTENDED_COUNTRIES: 25+ entries), a searchable combobox would significantly improve UX.

---

## 3. Document Guidance / Preparation

**File:** [screens/DocGuidanceScreen.tsx](../screens/DocGuidanceScreen.tsx)

### Original prototype behavior
- Fixed checklist with 4 items auto-checking sequentially.
- "Both sides" item always shown regardless of document type.
- No connection to machine or config.

### Now production-aligned
- ✅ **Back-side item conditional** — "Both sides" checklist item is only included when `requiresBackCapture` is `true` for the selected document. Driven by `DocumentCaptureRules.backSideRequired` resolved at the `DocGuidanceScreen` call site in `VerifyFlow.tsx`.
- ✅ **Document-type-aware label** — heading and CTA dynamically use the selected document's label (e.g. "Scan your passport").
- ✅ **Machine state** — the screen is reached after `DOCUMENT_SELECTED` is dispatched; no machine changes are made on this screen (guidance only).

### Remaining gaps
- 🔲 **Backend-provided instructions** — `BackendRequiredStep.instructions` from `resumeSession` or `submitStep` responses is not yet surfaced in the UI. Production: use this field to show backend-specific guidance (e.g. "This document requires a high-resolution photo").
- 🔲 **Camera permission request** — the guidance screen is the natural place to proactively request camera permission (before the user reaches the capture screen). No permission request is currently made here; permission is only detected reactively after the camera view renders.

---

## 4. Document Capture

**File:** [screens/DocCaptureScreen.tsx](../screens/DocCaptureScreen.tsx)

### Original prototype behavior
- Camera view with a simulated quality check (hardcoded delays, always passes).
- Upload fallback always shown.
- Validation ran a local stub (`stubValidateImage`) with fixed quality chips.
- No machine event dispatch. No service call.
- No per-side variation (front vs back treated identically).

### Now production-aligned
- ✅ **Real validation via mock service** — `onValidate` prop calls `mockVerificationService.uploadDocument(sessionId, side, docType, ...)` during the review phase. Returns `uploadId`, `qualityChecks[]`, and `acceptable`.
- ✅ **Per-check pass/fail display** — `qualityChecks` from `UploadDocumentResponse` are mapped to the review panel's chip row. Failing checks show their `failReason` string instead of the check label.
- ✅ **Machine events dispatched** — `VALIDATION_PASSED` or `VALIDATION_FAILED` dispatched after `uploadDocument` resolves. `CAPTURE_CONFIRMED` dispatched when the user confirms in the review panel. `CAPTURE_FAILED` dispatched when the user taps "Having trouble?". `RETAKE` dispatched when the user taps "Retake" in the review panel.
- ✅ **Upload fallback gated by config** — `allowUpload` sourced from `resolveUploadFallbackAllowed(flowConfig, docType)`. The "Upload a photo instead" affordance is hidden when the config disallows it.
- ✅ **Camera permission detection** — `navigator.permissions.query({ name: 'camera' })` detects denied state reactively and shows the blocked placeholder with upload fallback when permitted.
- ✅ **Stuck nudge** — after 9 seconds without auto-capture, a dismissible nudge offers a "Capture anyway" escape hatch.
- ✅ **Front vs back variation** — heading, label, and flip icon reflect `side` prop.

### Remaining gaps
- 🔲 **Real camera stream** — `CameraFrame` renders a styled placeholder, not a live `getUserMedia` stream. The quality hook (`useDocQuality`) simulates document detection with a timer-based progression. Production: replace with a real `getUserMedia` stream and an ML-based document detector (e.g. edge detection, perspective correction, blur/glare analysis).
- 🔲 **Actual image capture** — `previewSrc` is null for live captures (no real frame is captured). Only gallery uploads populate it. Production: capture a `canvas` frame from the video element at shutter time.
- 🔲 **Real file upload** — `mockVerificationService.uploadDocument` sends a 0-byte `Blob`. Production: send the actual captured frame.
- 🔲 **`submitStep` not yet called** — `uploadDocument` puts the artifact on the backend, but `submitStep` (which triggers the validation pipeline) is not called from the screen. The full upload → submit step cycle is not complete.
- 🔲 **`uploadId` not stored in context** — the `uploadId` returned by `uploadDocument` is not stored in `VerificationContext`. Production: store it for inclusion in the `submitStep` request.

---

## 5. Document Review

**Note:** Document review is the `'review'` phase within `DocCaptureScreen` (the `ReviewPanel` internal component), not a separate screen file.

### Original prototype behavior
- `ReviewPanel` ran `stubValidateImage()` — a hardcoded 1.2s delay that always returned `ok: true` with three passing quality chips.
- No connection to any service or machine state.

### Now production-aligned
- ✅ **Service-backed validation** — when `onValidate` prop is provided, `ReviewPanel` calls it instead of `stubValidateImage`. The result shapes are identical, so the panel UI is unchanged.
- ✅ **Conditional button set** — "Continue" button only shown when `acceptable: true`. When `false`, only "Retake" is shown (no way to proceed with a failing image).
- ✅ **Quality chip source** — chips populated from `UploadDocumentResponse.qualityChecks[]` when available, falling back to the default chip list at full-pass when the backend provides no granular checks.
- ✅ **Photo preview** — displays the captured image (from gallery upload) or a "Photo captured" placeholder (for live captures until real camera frames are available).

### Remaining gaps
- 🔲 **Preview for live captures** — for camera-captured images, `previewSrc` is null (no real frame captured). The review panel shows a "Photo captured" placeholder icon instead of the actual image. Production: populate `previewSrc` from the canvas frame captured at shutter time.
- 🔲 **Definitive validation vs preliminary** — `UploadDocumentResponse.acceptable` is a preliminary quality check, not the definitive validation result. The review panel presents it as if it is final. Production: make clear to the user that final approval comes after full backend processing.

---

## 6. Selfie / Face Capture

**File:** [screens/SelfieCaptureScreen.tsx](../screens/SelfieCaptureScreen.tsx)

### Original prototype behavior
- Auto-captured a simulated face alignment with fixed quality delays.
- Always called `onCapture()` after the stub delay regardless of quality.
- No service call. No machine event dispatch.
- `mode` prop existed but had no effect on behavior.

### Now production-aligned
- ✅ **Real validation via mock service** — `onValidate` prop calls `mockVerificationService.uploadFace(sessionId, ...)` during the validating phase. Returns `acceptable` and `qualityChecks`.
- ✅ **Pass/fail branching** — when `onValidate` resolves `ok: true`, `onCapture()` is called (machine: `CAPTURE_CONFIRMED` + `next()`). When `ok: false`, `onCaptureFailed()` is called (machine: `CAPTURE_FAILED`).
- ✅ **Machine events dispatched** — `CAPTURE_CONFIRMED`, `CAPTURE_FAILED`, and `RETAKE` (via `onRetry`) all dispatched from `VerifyFlow.tsx`.
- ✅ **Mode derives from config** — `mode` sourced from `flowConfig.faceCapture.mode`. Non-`'photo'` modes render a "coming soon" placeholder rather than silently behaving as `'photo'`.
- ✅ **Camera permission detection** — same pattern as `DocCaptureScreen`; denied state shows blocked placeholder with reload option.

### Remaining gaps
- 🔲 **Real camera stream** — `CameraFrame` and `useSelfieQuality` simulate face detection with timer-based progression; no real `getUserMedia` stream or face-detection model runs.
- 🔲 **Real image capture** — no actual frame is captured at shutter time; the selfie preview is a stub. Production: capture a canvas frame from the video element.
- 🔲 **Real file upload** — `mockVerificationService.uploadFace` receives a 0-byte `Blob`. Production: send the actual captured frame.
- 🔲 **`video` and `motion` capture modes** — both modes render a "This mode will be available soon" placeholder. Production: wire a video-clip capture provider for `'video'` mode and a head-movement tracking provider for `'motion'` mode.
- 🔲 **`submitStep` not yet called** — same gap as document capture: `uploadFace` is called but `submitStep` is not.
- 🔲 **`uploadId` not stored in context** — same gap as document capture.

---

## 7. Liveness / Motion

**File:** [screens/LivenessScreen.tsx](../screens/LivenessScreen.tsx)

### Original prototype behavior
- Fully simulated: a timer drove a 3.2-second arc animation, then auto-advanced.
- Always succeeded; `onFailed` was never called.
- `MAX_ATTEMPTS` constant was local to the screen and not configurable.

### Now production-aligned
- ✅ **Attempt limit from config** — `LivenessConfig.maxAttempts` in `VerificationFlowConfig` is the intended source for the attempt cap. The screen's local `MAX_ATTEMPTS = 2` matches the `EXAMPLE_HIGH_RISK_FLOW` config. The wiring to make the screen respect the config value per-session is not yet done (see gap below).
- ✅ **`onFailed` escalation path** — when `handleRetry` is called after the last attempt, `onFailed?.()` is called rather than showing the retry prompt. `VerifyFlow.tsx` receives this via `onComplete` (which calls `next()`).
- ✅ **`'failed'` phase UI** — dedicated failed screen with attempt count, retry CTA (when attempts remain), and help CTA.
- ✅ **Camera permission detection** — same pattern as other capture screens.

### Remaining gaps
- 🔲 **Real liveness provider** — the entire motion arc is simulated with a `setInterval` tick. No real provider SDK (FaceTec, iProov, Onfido Motion, etc.) is integrated. Production: mount the provider's SDK component during the `'motion'` phase and receive the `livenessToken` on success.
- 🔲 **`uploadLiveness` and `submitStep` not called** — the liveness result is never submitted to the backend. Production: on `'validating'`, call `uploadLiveness({ livenessToken })` then `submitStep({ step: 'liveness', uploadIds })`.
- 🔲 **Attempt limit not sourced from config** — `MAX_ATTEMPTS` is hardcoded to `2` inside the screen. Production: source from `LivenessConfig.maxAttempts` (or `BackendRequiredStep.maxAttempts` on resume), passed via a prop.
- 🔲 **`CAPTURE_FAILED` not dispatched on liveness failure** — when `handleRetry` exhausts attempts and calls `onFailed`, no machine event is dispatched. Production: dispatch `CAPTURE_FAILED` so the machine transitions to `retryable_failure` or `unrecoverable_failure` appropriately.

---

## 8. Processing

**File:** [screens/ProcessingScreen.tsx](../screens/ProcessingScreen.tsx)

### Original prototype behavior
- A fixed-duration animation that auto-advanced to the result screen after completion.
- `onComplete` called immediately — no backend polling.

### Now production-aligned
- ✅ **Poll loop triggered by animation** — `ProcessingScreen.onComplete` is wired to `beginPolling()` from `useSessionLifecycle`. The animation runs; when it completes, `beginPolling()` dispatches `CONTINUE` (machine: `processing → awaiting_backend_result`) and begins polling `fetchStatus()`.
- ✅ **Outcome driven by poll result** — the `'success'` screen is only reached when `fetchStatus` returns a terminal status. `onOutcomeReady` calls `next()` to advance the UI.
- ✅ **Machine state through processing** — machine advances `processing → awaiting_backend_result` via the `CONTINUE` dispatch in `beginPolling`.

### Remaining gaps
- 🔲 **`submitStep` before processing** — the frontend currently moves to `processing` after the last capture is confirmed by the user. In production, `submitStep` should be called for each step as it completes, and the final `submitStep` response (with `status: 'processing'`) should trigger the transition to the processing screen — not a UI user action.
- 🔲 **Interruption during processing** — if the user closes the tab while on the processing screen (after `submitStep` but before `fetchStatus` returns), they resume correctly via `resumeSession` → `nextStep: null` → `'processing'` screen. This path is implemented but never exercised because `submitStep` is not yet called.

---

## 9. Outcome / Result

**File:** [screens/OutcomeScreen.tsx](../screens/OutcomeScreen.tsx)

### Original prototype behavior
- Static screen always showing `'verified'` outcome.
- No connection to machine state or backend result.

### Now production-aligned
- ✅ **All 5 outcomes rendered** — `verified`, `pending`, `additional_step`, `retry`, `rejected`. Each outcome has its own icon, heading, subheading, notice text, CTA label, and color.
- ✅ **Outcome sourced from machine** — `deriveOutcome(machineState, machineContext)` in `VerifyFlow.tsx` reads `machineContext.outcome` (set by `BACKEND_RESULT_RECEIVED`) as the authoritative source. Falls back to state-based derivation for terminal states that arrive without an explicit `outcome`.
- ✅ **`reviewToken` stored in context** — `BACKEND_RESULT_RECEIVED` carries `reviewToken?` which is stored in `VerificationContext.reviewToken`. Not yet displayed in the UI but available for support escalation.
- ✅ **Retry CTA** — `'retry'` outcome shows two buttons: retry (calls `onRetry` → `goToDocSelect`) and continue (calls `onContinue`). Other outcomes show a single CTA.
- ✅ **Verification ID** — `'verified'` outcome shows a generated verification ID (`VRFY-xxxx-xxxx`) for support reference.

### Remaining gaps
- 🔲 **Verification ID from backend** — the verification ID shown on the `'verified'` screen is generated client-side with `generateVerificationId()`. Production: use `context.sessionId` or a backend-provided `verificationId` from the `approved` status response.
- 🔲 **`reviewToken` not displayed** — the manual review token stored in `VerificationContext.reviewToken` is not surfaced anywhere in the `'pending'` outcome UI. Production: show it as a reference number the user can share with support.
- 🔲 **`additional_step` not actionable** — the `'additional_step'` outcome shows a notice but the CTA only calls `onContinue` (a generic callback). Production: the next step type (from `BackendRequiredStep` on the `needs_additional_step` response) determines what UI to show — e.g. an address-proof upload flow or a video-call booking link.
- 🔲 **`failureReason` not displayed** — `VerificationContext.failureReason` (populated by `BACKEND_RESULT_RECEIVED`) is not shown in the `'rejected'` outcome UI. Production: surface a user-friendly version of the failure reason where appropriate.
- 🔲 **`onContinue` callback is a stub** — currently calls `alert('Continue — integrate your callback here')`. Production: this must be replaced with the integrating application's callback (e.g. redirect, emit event to parent frame).

---

## Summary

| Screen | Production-aligned | Stubs / gaps remaining |
|---|---|---|
| Welcome | Modes, resume notice, restart notice | Step list is static; no personalization |
| Document selection | Config-driven countries + docs, liveness in journey hint | Risk level from backend; config from session API; no country search |
| Document guidance | Back-side item conditional on doc type | Backend instructions not surfaced; no proactive camera permission |
| Document capture | Mock upload, per-check display, machine events, upload gating | No real camera; no real file upload; `submitStep` not called |
| Document review | Service-backed validation, conditional buttons, chip source | Preview for live captures missing; preliminary vs definitive not distinguished |
| Selfie capture | Mock upload, pass/fail branching, machine events, mode from config | No real camera; `video`/`motion` modes stub; `submitStep` not called |
| Liveness | Attempt-limit path, failed phase UI, camera permission | No real provider; `uploadLiveness`/`submitStep` not called; attempt limit hardcoded |
| Processing | Poll loop triggered, outcome from polling | `submitStep` not called before processing |
| Outcome | All 5 outcomes, machine-driven outcome, retry CTA | Backend verification ID; reviewToken not shown; additional_step not actionable |
