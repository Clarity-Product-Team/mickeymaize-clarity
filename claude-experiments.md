# Claude Experiments & Bugs Log

---

## Bug: RetryScreenProps Missing onChangeDoc Prop

**Date:** 2026-03-19

**Description:**
`RetryScreen.tsx` accepts and uses an `onChangeDoc?: () => void` prop. `VerifyFlow.tsx` passes it conditionally when `retryError === 'wrong_doc'`. However, `RetryScreenProps` in `lib/types.ts` did not declare the prop at all.

**Steps to Reproduce:**
1. Open `lib/types.ts` and read `RetryScreenProps`
2. Open `screens/RetryScreen.tsx` and check its prop destructure
3. `onChangeDoc` appears in the component but not in the interface

**Observed Behavior:**
TypeScript did not catch the mismatch because `RetryScreen.tsx` used an inline prop type in its function signature rather than importing `RetryScreenProps`. The component worked at runtime; the type gap was invisible at call sites.

**Expected Behavior:**
`RetryScreenProps` in `lib/types.ts` should be the single source of truth for the screen's prop contract. All props must be declared there.

**Suspected Cause:**
The component was implemented before the type interface was finalized, and the interface was never updated to match.

**Work Done So Far:**
- Confirmed gap by reading both files
- Added `onChangeDoc?: () => void` to `RetryScreenProps` in `lib/types.ts` with JSDoc
- Ran `npx tsc --noEmit` — zero errors after fix

**Next Action:**
None — fixed. Ongoing: keep screen prop interfaces in `lib/types.ts` as the authoritative contract and avoid inline prop types in screen components.

**Status:** fixed

---

## Bug: OutcomeScreenProps.outcome Optional with Silent 'verified' Default

**Date:** 2026-03-19

**Description:**
`OutcomeScreenProps.outcome` was typed as `outcome?: VerificationOutcome` with a JS default of `= 'verified'` in the component destructure. Any call site that omitted `outcome` would silently render the verified/success screen regardless of actual outcome.

**Steps to Reproduce:**
1. Render `<OutcomeScreen />` without passing `outcome`
2. Observe: success screen renders with "Identity Verified" copy
3. No TypeScript error; no runtime warning

**Observed Behavior:**
Silent success screen rendered when the prop was absent.

**Expected Behavior:**
TypeScript should require callers to explicitly pass `outcome`. Omitting it should be a compile error, not a silent default.

**Suspected Cause:**
Defensive default added during initial implementation before `VerifyFlow.tsx` was wired to always derive and pass `outcome`. The default was never removed after the wiring was complete.

**Work Done So Far:**
- Confirmed `VerifyFlow.tsx` always passes `outcome={deriveOutcome(machineState, machineContext)}` — the default was never needed
- Removed `?` from `OutcomeScreenProps.outcome` in `lib/types.ts`
- Removed `= 'verified'` default from `OutcomeScreen` function destructure
- Ran `npx tsc --noEmit` — zero errors after fix

**Next Action:**
None — fixed. Ongoing: outcome screens should never have silent success defaults.

**Status:** fixed

---

## Bug: Machine Transition reviewing_document_front → capturing_document_back Is Unconditional

**Date:** 2026-03-19

**Description:**
In `features/verification/machine/transitions.ts`, the `reviewing_document_front` state routes `CAPTURE_CONFIRMED` unconditionally to `capturing_document_back`. For single-sided documents (passport), this is incorrect — the machine should skip back capture and go to `capturing_face`.

**Steps to Reproduce:**
1. Run the demo with `EXAMPLE_LOW_RISK_FLOW`
2. Select "Passport" (single-sided document)
3. Complete front capture and advance through review
4. Observe: machine attempts to go to back capture state even though passport has no back side

**Observed Behavior:**
Machine transitions to `capturing_document_back`. `VerifyFlow.tsx` navigates past it via `useVerifyFlow` screen routing, masking the issue in the current demo.

**Expected Behavior:**
`CAPTURE_CONFIRMED` from `reviewing_document_front` should call `resolveBackSideRequired(config, docType)` and route to `capturing_face` when false.

**Suspected Cause:**
The conditional was deferred — the transition function does not currently receive `VerificationFlowConfig`. A comment in `transitions.ts` marks this explicitly.

**Work Done So Far:**
- Confirmed in `transitions.ts` (line ~79-84)
- Documented in `docs/handoff.md` and `docs/screen-gaps.md`
- Comment added in `transitions.ts` marking the gap

**Next Action:**
Pass `VerificationFlowConfig` (or pre-resolved booleans) into `transition()` and add a conditional branch for this case. See `docs/handoff.md` Step 4 for the recommended fix approach.

**Status:** open

---

## Bug: Machine Transition validating_face → capturing_motion Is Unconditional

**Date:** 2026-03-19

**Description:**
In `features/verification/machine/transitions.ts`, the `validating_face` state routes `VALIDATION_PASSED` unconditionally to `capturing_motion` (liveness screen). When `liveness.required` is false in the flow config, the machine should skip liveness and go to `uploading`.

**Steps to Reproduce:**
1. Run the demo with `EXAMPLE_LOW_RISK_FLOW` (liveness: `{ required: false }`)
2. Complete selfie capture
3. Observe: machine transitions to liveness screen even though liveness is not required

**Observed Behavior:**
Liveness screen appears regardless of `liveness.required` value in config.

**Expected Behavior:**
`VALIDATION_PASSED` from `validating_face` should call `resolveLivenessRequired(config)` and route to `uploading` when false.

**Suspected Cause:**
Same root cause as the back-capture transition gap — `transition()` does not receive `VerificationFlowConfig`. Comment in `transitions.ts` marks the gap explicitly.

**Work Done So Far:**
- Confirmed in `transitions.ts` (line ~115-121)
- Documented in `docs/handoff.md` and `docs/screen-gaps.md`
- Comment added in `transitions.ts` marking the gap

**Next Action:**
Same fix as the back-capture gap — pass config or resolved booleans into `transition()`. Both gaps should be fixed together in one pass.

**Status:** open

---

## Bug: Processing Steps Hardcoded — "Comparing your face" Always Shown

**Date:** 2026-03-19

**Description:**
`lib/content.ts` defines `processing.steps` as a fixed array of 4 steps, always including `{ id: 'face', label: 'Comparing your face' }`. `ProcessingScreen` renders all 4 steps regardless of whether `faceCapture.required` is true in the flow config.

**Steps to Reproduce:**
1. Set `faceCapture: { required: false }` in the flow config
2. Run the flow through to the processing screen
3. Observe: "Comparing your face" step appears even though no selfie was collected

**Observed Behavior:**
All 4 steps always render.

**Expected Behavior:**
Steps that correspond to skipped capture stages should not appear. The step list should be derived from the active flow config.

**Suspected Cause:**
`ProcessingScreen` does not receive `flowConfig` as a prop. Step list is a static constant in `lib/content.ts`, not a resolver function.

**Work Done So Far:**
- Confirmed by reading `lib/content.ts` and `screens/ProcessingScreen.tsx`
- Documented in `docs/screen-gaps.md` and `docs/handoff.md`

**Next Action:**
Pass `flowConfig` into `ProcessingScreen`. Move step list generation into a resolver that filters steps based on which captures are required. `lib/content.ts` keeps the step label strings; the resolver decides which to include.

**Status:** open

---

## Bug: Outcome Metrics Hardcode "Face match: Confirmed" Regardless of Flow

**Date:** 2026-03-19

**Description:**
`OutcomeScreen` renders a metrics row for the `'verified'` outcome that always includes `{ label: 'Face match', status: 'Confirmed' }`, even when `faceCapture.required` is false and no selfie was collected.

**Steps to Reproduce:**
1. Set `faceCapture: { required: false }` in the flow config
2. Complete a verification flow that reaches the `'verified'` outcome
3. Observe: "Face match: Confirmed" appears in the outcome metrics

**Observed Behavior:**
Outcome metrics always show face match result.

**Expected Behavior:**
Metrics should only include steps that were actually performed in the flow.

**Suspected Cause:**
`OutcomeScreen` does not receive `flowConfig` or `VerificationContext` — it only receives the outcome string. Metrics are hardcoded in the screen.

**Work Done So Far:**
- Confirmed by reading `screens/OutcomeScreen.tsx`
- Documented in `docs/screen-gaps.md` and `docs/handoff.md`

**Next Action:**
Pass relevant context (or resolved flags) into `OutcomeScreen` so metrics reflect the actual steps performed. Alternatively, derive metrics from `VerificationContext` fields (e.g., `selfie !== null` → show face match metric).

**Status:** open

---

## Experiment: npm run typecheck — Script Not Found

**Date:** 2026-03-19

**Goal:**
Run a TypeScript type check after applying the two QA fixes to confirm zero errors.

**What We Tried:**
Ran `npm run typecheck` as documented in the README.

**Result:**
```
npm error Missing script: "typecheck"
```
The script does not exist in `package.json`. Only `dev`, `build`, `start`, and `lint` are defined.

**Conclusion:**
Failed — the README documents `npm run typecheck` but `package.json` does not define it. `npx tsc --noEmit` works directly and produces the same result.

**Next Action:**
Either add `"typecheck": "tsc --noEmit"` to `package.json` scripts, or update the README to use `npx tsc --noEmit`. The README currently says:
```bash
npm run typecheck  # TypeScript check (npx tsc --noEmit)
```
The inline comment is accurate but the script itself is missing.

**Status:** open

---

## Experiment: QA Pass — Systematic Type Safety and Hardcoding Review

**Date:** 2026-03-19

**Goal:**
Identify hidden hardcoded assumptions, silent success states, missing type safety, and fixed copy that conflicts with dynamic flow config — without starting a large refactor.

**What We Tried:**
Systematically read the following files looking for the six categories of issue:
- `lib/types.ts` — screen prop interfaces
- `lib/content.ts` — user-facing copy
- `screens/RetryScreen.tsx` — retry screen implementation
- `screens/OutcomeScreen.tsx` — outcome screen implementation
- `screens/ProcessingScreen.tsx` — processing screen implementation
- `features/verification/machine/transitions.ts` — transition table

**Result:**
Found 6 concrete issues:
1. `RetryScreenProps` missing `onChangeDoc` — **fixed**
2. `OutcomeScreenProps.outcome` optional with silent default — **fixed**
3. Processing steps hardcode "Comparing your face" — **documented, not fixed**
4. Outcome metrics hardcode "Face match: Confirmed" — **documented, not fixed**
5. `validating_face → capturing_motion` unconditional — **documented, not fixed**
6. `reviewing_document_front → capturing_document_back` unconditional — **documented, not fixed**

`npx tsc --noEmit` passed clean after the two fixes.

**Conclusion:**
Partially successful. The two high-confidence, low-risk fixes were applied cleanly. The four structural gaps require design decisions about how config reaches the machine and screens — deferred intentionally.

**Next Action:**
Fix the two unconditional machine transitions as the next implementation step. Both require the same solution: passing config or resolved booleans into `transition()`.

**Status:** successful
