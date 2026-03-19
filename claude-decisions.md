# Claude Decisions Log

---

## Decision: Two-System Architecture — Navigation Separate from Machine State

**Date:** 2026-03-19

**Context:**
The original prototype used a single `useVerifyFlow` hook with a flat `FlowState` object to manage both screen navigation and all verification data. As the machine grew to 23 states with rich context, this became too coupled.

**Decision:**
Run two independent systems in parallel:
- `useVerifyFlow` — manages screen navigation only (which screen is shown, forward/back, retry)
- `useVerificationMachine` — manages the full verification lifecycle state machine

Wire them together only in `VerifyFlow.tsx`, which is the sole file that knows about both.

**Alternatives Considered:**
- Single unified hook managing both navigation and machine state
- XState or another state machine library (see separate decision)

**Reasoning:**
Navigation concerns (screen stack, direction, animation) are distinct from verification concerns (capture artifacts, backend status, retry counts). Keeping them separate makes each independently testable and prevents `VerifyFlow.tsx` from becoming a god component. The integration surface is small and explicit.

**Implications:**
`VerifyFlow.tsx` is the only file that reads both systems. All other files depend on at most one. This boundary must be preserved — do not let screens import from `useVerificationMachine` directly.

**Status:** active

---

## Decision: State Machine as a Pure Function, Not a Library

**Date:** 2026-03-19

**Context:**
Need a formal state machine with typed states, events, context, and transitions. Options include XState, Robot, or a hand-rolled implementation.

**Decision:**
Implement the machine as a pure `transition(state, event, context) → TransitionResult | null` function in `features/verification/machine/transitions.ts`. Wrap it in a `useReducer` hook in `hooks/useVerificationMachine.ts`.

**Alternatives Considered:**
- XState — battle-tested, rich tooling, visualizer
- Robot — lightweight, functional style
- Custom hook with useState and imperative transition logic

**Reasoning:**
The verification flow is not deeply nested or concurrent — it is a linear flow with a small number of conditional branches. XState would add significant bundle weight and learning overhead for a problem this size. A pure function is easier to test, easier to read, has no dependencies, and can be swapped for XState later if the complexity grows.

**Implications:**
The transition function must remain pure — no I/O, no React imports. Side effects (uploads, polling) live in `useSessionLifecycle`. If the machine grows to need parallel states or hierarchical logic, migrating to XState is the recommended path.

**Status:** active

---

## Decision: VerificationFlowConfig Is Read-Only for the Session Lifetime

**Date:** 2026-03-19

**Context:**
The session config (which countries, documents, face capture, liveness, outcomes are enabled) needed a clear ownership model. The machine needed to branch on these values without mutation risk.

**Decision:**
`VerificationFlowConfig` is constructed once at session start (from `startSession()` response) and treated as immutable for the duration of the session. It is never mutated by the machine or screens.

**Alternatives Considered:**
- Storing config fields in `VerificationContext` so the machine can read them directly
- Allowing partial config updates mid-session (e.g., if a backend step unlocks additional options)

**Reasoning:**
KYC session requirements are defined by the backend at session start and do not change mid-flow. Treating the config as immutable prevents a class of bugs where a mid-session event accidentally mutates branching logic.

**Implications:**
All branching decisions (back-side required, liveness required, upload fallback) are resolved from the config via resolver functions, not from machine context. The config must be passed to any component or hook that needs to make a branching decision.

**Status:** active

---

## Decision: Upload and Submit Are Separate Backend Operations

**Date:** 2026-03-19

**Context:**
Designing the backend service interface and the mock, needed to decide whether uploading a file should immediately trigger validation or whether upload and validation should be separate steps.

**Decision:**
`upload*()` puts the artifact on the backend (like landing a file on S3). Session status stays `collecting_inputs`. The validation pipeline does not run.
`submitStep()` triggers the backend pipeline for that artifact. Only after the last required step is submitted does status advance to `processing`.
`fetchStatus()` is the only endpoint that communicates the final outcome.

**Alternatives Considered:**
- Single combined upload-and-validate endpoint per step
- Implicit submit (backend auto-submits after last upload is received)

**Reasoning:**
Mirrors how production KYC backends actually work (e.g., Onfido, Veriff). Decoupling upload from validation gives the backend flexibility to run preliminary quality checks synchronously during upload and defer expensive ML pipelines to the submit phase. It also allows re-upload without re-triggering the pipeline.

**Implications:**
The frontend must call both `uploadDocument()` and `submitStep()` for each capture step. The mock enforces this separation — callers that skip `submitStep()` will never see `processing` status. The `useSessionLifecycle` hook handles sequencing.

**Status:** active

---

## Decision: ApiResponse<T> Envelope Over try/catch

**Date:** 2026-03-19

**Context:**
All seven `VerificationService` methods are async. Needed a consistent error-handling pattern across the codebase.

**Decision:**
All service methods return `Promise<ApiResponse<T>>` where:
```typescript
type ApiResponse<T> =
  | { ok: true;  data: T;    error: null }
  | { ok: false; data: null; error: BackendError }
```
Callers check `res.ok` before reading `res.data`. No try/catch at call sites.

**Alternatives Considered:**
- Throwing errors from service methods, catching at call sites
- Returning `T | null` with a separate error channel
- Result-type library (neverthrow, etc.)

**Reasoning:**
`try/catch` with async errors is error-prone (easy to forget, swallows error type information). The discriminated union makes the error case impossible to ignore — TypeScript will not let you read `res.data` without checking `res.ok` first. Avoids a library dependency for a small, well-understood pattern.

**Implications:**
Every service call site follows the same `if (!res.ok) { ... return } res.data` pattern. Real HTTP implementations must wrap their fetch logic in this envelope before returning. The mock already returns this shape throughout.

**Status:** active

---

## Decision: Two Known Machine Transitions Left Unconditional (Accepted Gap)

**Date:** 2026-03-19

**Context:**
Two transitions in `features/verification/machine/transitions.ts` should be conditional on flow config but are not:
1. `reviewing_document_front → CAPTURE_CONFIRMED` always goes to `capturing_document_back`, even for single-sided documents
2. `validating_face → VALIDATION_PASSED` always goes to `capturing_motion`, even when `liveness.required` is false

**Decision:**
Accept both as known gaps for now. Document them with comments in `transitions.ts` and in `docs/handoff.md`. Do not fix them in this session.

**Alternatives Considered:**
- Fix immediately by passing `VerificationFlowConfig` as a fourth argument to `transition()`
- Pre-resolve booleans (`backSideRequired`, `livenessRequired`) into `VerificationContext` so the transition function can read them without needing the config

**Reasoning:**
Fixing requires a design choice about where config knowledge lives in the machine (fourth argument vs. context field). That decision has downstream implications for testing and resumability. Getting it wrong would need to be unwound. The current demo uses `EXAMPLE_LOW_RISK_FLOW` where liveness is off but back capture is on for most docs — both gaps are exercisable but non-critical for the demo. Better to fix deliberately than quickly.

**Implications:**
In the current demo, the liveness screen always appears after selfie even when `liveness.required: false`. Single-sided document flows (passport) will attempt to go to back capture but `VerifyFlow.tsx` will route past it via `useVerifyFlow` logic. These gaps must be fixed before any real backend integration.

**Status:** active

---

## Decision: Processing Steps and Outcome Metrics Are Hardcoded (Accepted Gap)

**Date:** 2026-03-19

**Context:**
`lib/content.ts` hardcodes 4 processing steps including "Comparing your face". `OutcomeScreen` hardcodes "Face match: Confirmed" in the verified metrics. Both are shown regardless of whether face capture was part of the flow.

**Decision:**
Accept both as known gaps. Document in `docs/screen-gaps.md` and `docs/handoff.md`. Do not fix in this session.

**Alternatives Considered:**
- Pass `flowConfig` into `ProcessingScreen` and `OutcomeScreen` and filter steps/metrics dynamically
- Move step list out of `lib/content.ts` and into a resolver function driven by config

**Reasoning:**
For the current demo default (`EXAMPLE_LOW_RISK_FLOW`), face capture is always required, so the hardcoded copy is always correct. Fixing requires a prop API change on two screens and a content layer refactor. Prioritized documentation over premature abstraction given the demo scope.

**Implications:**
These screens will show incorrect copy if `faceCapture.required` is set to `false` in the flow config. Must be fixed before shipping a flow that omits face capture.

**Status:** active

---

## Decision: Mock Service Always Resolves "Verified"

**Date:** 2026-03-19

**Context:**
The mock service needed a default final outcome for the polling loop. All 5 outcome paths exist in the mapping layer and machine states, but the mock needed a single default.

**Decision:**
`mockVerificationService.fetchStatus()` always resolves to `outcome: 'verified'` after two polls. Other outcomes are reachable by a one-line edit in `mockService.ts`.

**Alternatives Considered:**
- Randomly resolve to different outcomes on each run
- Add a `mockOutcome` configuration parameter to the mock
- Add a URL query param to control outcome in the dev server

**Reasoning:**
A deterministic happy path makes the demo reliable and easy to present. Other outcomes are exercisable by engineers who need to test them. A random outcome would make the demo unpredictable. A configuration param would add complexity not warranted for a demo mock.

**Implications:**
QA of non-verified outcomes requires manually editing `mockService.ts`. If this becomes a repeated need, consider adding a `?outcome=rejected` query param override to `VerifyFlow.tsx`.

**Status:** active

---

## Decision: OutcomeScreenProps.outcome Made Required

**Date:** 2026-03-19

**Context:**
`OutcomeScreenProps.outcome` was typed as `outcome?: VerificationOutcome` with a default of `'verified'`. Any call site that forgot to pass it would silently render the success screen regardless of actual outcome.

**Decision:**
Remove the `?` — make `outcome: VerificationOutcome` required. Remove the `= 'verified'` default from the `OutcomeScreen` destructure.

**Alternatives Considered:**
- Keep the optional default but add a runtime warning when outcome is undefined
- Keep as-is (accepted the silent failure mode)

**Reasoning:**
`VerifyFlow.tsx` always passes `outcome={deriveOutcome(machineState, machineContext)}` — the default was never needed in practice. Silent defaults that mask missing data are dangerous in outcome screens. A required prop surfaces the omission at compile time.

**Implications:**
Any future call site rendering `OutcomeScreen` must explicitly pass `outcome`. TypeScript will enforce this.

**Status:** active

---

## Decision: RetryScreenProps Missing onChangeDoc — Fixed

**Date:** 2026-03-19

**Context:**
`RetryScreen.tsx` accepted `onChangeDoc?: () => void` and `VerifyFlow.tsx` passed it conditionally for `wrong_doc` errors. But `RetryScreenProps` in `lib/types.ts` did not declare the prop. TypeScript allowed it because the component used an inline type.

**Decision:**
Add `onChangeDoc?: () => void` to `RetryScreenProps` in `lib/types.ts` with a JSDoc note.

**Alternatives Considered:**
- Leave as-is (the component worked without the type)
- Move the inline type out of the component and into `lib/types.ts` entirely

**Reasoning:**
Screen prop interfaces in `lib/types.ts` are the contract between `VerifyFlow.tsx` and each screen. A prop that exists in the component but not the interface is a type hole. Fixing it makes the contract explicit and ensures future callers can discover the prop via autocomplete.

**Implications:**
`RetryScreenProps` now fully reflects the component's actual API. Any tool or code generator reading `lib/types.ts` for the screen contract will see `onChangeDoc`.

**Status:** active

---

## Decision: Demo-Only Components Isolated in components/demo/

**Date:** 2026-03-19

**Context:**
`FlowInspector` (state overlay) and `ThemeSwitcher` (floating theme pill) are useful for development and demos but must not ship to production users.

**Decision:**
Keep both in `components/demo/`. Their render calls in `VerifyFlow.tsx` are clearly marked — remove those render calls before shipping.

**Alternatives Considered:**
- Environment-flag them (`if (process.env.NODE_ENV === 'development')`)
- Delete them before handoff

**Reasoning:**
They are genuinely useful for demos and stakeholder walkthroughs. Environment-flagging adds build complexity. Keeping them in an explicit `demo/` directory makes their status unambiguous without requiring any build configuration.

**Implications:**
Must be actively removed from `VerifyFlow.tsx` render output before production deployment. The directory can be deleted entirely at that point.

**Status:** active

---

## Decision: All User-Facing Copy Lives in lib/content.ts

**Date:** 2026-03-19

**Context:**
Screen components needed access to copy (labels, instructions, error messages, CTA text). Options include inline strings, component-level constants, or a central content file.

**Decision:**
All user-facing strings live in `lib/content.ts`. No copy is hardcoded inside component files.

**Alternatives Considered:**
- i18n library (react-i18next, next-intl)
- Copy co-located with each screen file
- CMS-driven copy

**Reasoning:**
Centralizing copy makes it easy to audit, review for tone, and hand off to a copywriter or localization system. An i18n library is premature for a single-locale product reference implementation. Co-located copy is harder to review holistically.

**Implications:**
`lib/content.ts` is the single source of truth for all strings. Changes to UI copy happen there, not in screen files. When localization is added, `content.ts` becomes the base locale that feeds into the i18n layer.

**Status:** active

---

## Decision: sessionStorage for Session Resume, Not localStorage

**Date:** 2026-03-19

**Context:**
The resume model needs to persist a `sessionId` across navigation events (accidental back button, refresh) but not across browser sessions or tabs.

**Decision:**
Store the session ID under key `cv_session_id` in `sessionStorage`. Clear it on verified or unrecoverable terminal outcomes.

**Alternatives Considered:**
- `localStorage` — persists across tabs and browser restarts
- Cookie — more configurable expiry, survives harder reloads
- URL param — shareable but exposes session ID in history

**Reasoning:**
`sessionStorage` is tab-scoped and automatically cleared when the tab closes — matching the expected lifecycle of a KYC session. `localStorage` would persist a stale session ID after the browser is closed, causing confusing resume attempts. Cookies add complexity without benefit for a client-only store.

**Implications:**
Sessions cannot be resumed from a different tab or a different device. If cross-device resume is required (e.g., start on mobile, finish on desktop), the backend must provide a separate resume link mechanism.

**Status:** active
