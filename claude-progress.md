# Claude Progress

## Goal
Transform the Clarity Verify KYC prototype into a production-aligned identity verification UI — with a typed state machine, flow configuration system, backend service layer, session lifecycle management, complete screen implementations, and full engineering documentation — ready for real provider integration.

## What We Did
- **Config-aware machine transitions** (2026-03-23) — fixed the two unconditional transitions in `transitions.ts`; `transition()` now accepts `VerificationFlowConfig` as a 4th argument; `useVerificationMachine` accepts `config` and closes over it in the reducer; `VerifyFlow.tsx` passes `flowConfig`
- **State machine** — implemented `features/verification/machine/` with 23 states, 19 events, typed `VerificationContext`, and a pure `transition()` function with a static transition table and conditional branches (BACKEND_RESULT_RECEIVED, PERMISSION_GRANTED, RETRY_STEP)
- **Flow configuration system** — implemented `features/verification/config/` with `VerificationFlowConfig` schema, 4 example configs (passport-only, two-sided, low-risk, high-risk), resolver functions, `validateFlowConfig()`, and `docSelectConfigFromFlowConfig()` adapter
- **Backend service layer** — implemented `features/verification/services/` with `VerificationService` interface, `ApiResponse<T>` envelope, all request/response types, `BackendSessionStatus` → machine state/event mapping, and a fully functional in-memory mock service
- **Session lifecycle hook** — implemented `hooks/useSessionLifecycle.ts` for session start on mount, resume from `sessionStorage`, upload orchestration, and polling loop
- **`useVerificationMachine` hook** — `useReducer` wrapper around the pure transition function
- **`OutcomeScreen`** — full 5-outcome screen (verified, pending, additional step, retry, rejected) replacing the prototype stub
- **`RetryScreen`** — error-specific copy, retry CTA, `onChangeDoc` for `wrong_doc` errors
- **Screen updates** — `WelcomeScreen` modes, `CountryDocSelectScreen` driven by flow config, `DocCaptureScreen` upload fallback from config, `LivenessScreen` full phase progression
- **QA pass** — found and fixed two type safety gaps: `RetryScreenProps` missing `onChangeDoc`, `OutcomeScreenProps.outcome` made required (removed silent `'verified'` default)
- **Engineering docs** — created `docs/verification-machine.md`, `docs/verification-config.md`, `docs/verification-api.md`, `docs/screen-gaps.md`, `docs/handoff.md`
- **README** — rewrote as engineer-facing reference with architecture, injection points, extension guides, screen table
- **Committed and pushed** — all 38 files pushed to `origin/main` on `Clarity-Product-Team/mickeymaize-clarity`

## Current State
- **Working:** Full UI flow runnable at `http://localhost:3000/verify`. All screens implemented. Mock backend wired. State machine transitions correctly. Flow config drives branching. Session start, upload, and polling all functional via mock service.
- **Working:** TypeScript passes clean (`npx tsc --noEmit` — zero errors).
- **Working:** Machine transitions are now fully config-aware — back capture and liveness routing are driven by `VerificationFlowConfig` via resolver functions.
- **Partially working:** Processing steps and outcome metrics are still hardcoded (see Open Issues).
- **Not yet wired:** Real camera capture, real backend, real liveness provider.
- **Pushed:** Commit `2b43ca4` on `main`.

## Open Issues
- `ProcessingScreen` step list hardcodes "Comparing your face" regardless of `faceCapture.required` — needs `flowConfig` passed in
- `OutcomeScreen` metrics hardcode "Face match: Confirmed" regardless of which steps were collected — needs `flowConfig` passed in
- Camera capture is fully simulated — no real `getUserMedia` or frame extraction
- Liveness is timer-based — no real motion tracking or provider SDK
- Mock service always resolves `'verified'` — other outcomes (pending, rejected, additional step) not exercisable from normal flow without manual override

## Relevant Files
- `flows/VerifyFlow.tsx` — root orchestrator; only file that knows both navigation and machine state
- `features/verification/machine/transitions.ts` — pure transition function; where the two known gaps live
- `features/verification/machine/states.ts` — 23 state names + TERMINAL_STATES + CAPTURE_STATES
- `features/verification/config/examples.ts` — `EXAMPLE_LOW_RISK_FLOW` is the current demo default
- `features/verification/config/resolvers.ts` — all branching resolver functions
- `features/verification/services/mockService.ts` — in-memory mock; always approves; replace for real backend
- `features/verification/services/mapping.ts` — BackendSessionStatus → machine state/event mapping
- `hooks/useSessionLifecycle.ts` — session start, resume, upload, poll loop
- `hooks/useVerificationMachine.ts` — useReducer wrapper around transition()
- `lib/types.ts` — all shared types and screen prop interfaces
- `lib/content.ts` — all user-facing copy (processing steps and outcome metrics hardcoded here)
- `screens/OutcomeScreen.tsx` — 5-outcome screen; outcome prop now required
- `screens/RetryScreen.tsx` — retry screen; onChangeDoc now typed in RetryScreenProps
- `docs/handoff.md` — full engineering/product handoff document

## Important Commands / Steps
```bash
npm run dev             # dev server at http://localhost:3000/verify
npx tsc --noEmit        # type check (must be clean)
npm run lint            # ESLint
npm run build           # production build
git push origin main    # push to Clarity-Product-Team/mickeymaize-clarity
```

**To exercise different outcomes in the mock:** edit `mockService.ts` `fetchStatus()` — change `outcome: 'verified'` to `'rejected'`, `'pending'`, `'additional_step'`, or `'retry'` on the terminal branch.

**To switch to high-risk flow (liveness on):** in `flows/VerifyFlow.tsx`, change `EXAMPLE_LOW_RISK_FLOW` to `EXAMPLE_HIGH_RISK_FLOW`.

## Decisions Made
- Two-system architecture (navigation + machine) wired only in `VerifyFlow.tsx` — kept intentionally separate
- `VerificationFlowConfig` is read-only for the session lifetime; consumed by resolvers and adapters only
- Upload ≠ submit: `upload*()` puts artifact on backend; `submitStep()` triggers the pipeline — separation is explicit in mock and documented in API layer
- `ApiResponse<T>` envelope over try/catch — all callers check `res.ok` before reading `res.data`
- The two unconditional machine transitions are accepted as known gaps (documented, commented) rather than fixed now — fixing requires passing `VerificationFlowConfig` into `transition()`, which is a larger change
- Hardcoded processing steps and outcome metrics are accepted as known gaps — fixing requires screen prop changes
- Mock always approves — other outcome paths exist in the mapping layer and are reachable with a one-line mock edit
- `OutcomeScreenProps.outcome` made required — the optional default was a silent failure mode; `VerifyFlow.tsx` always passes it

## Next Step
Fix the two remaining hardcoded content gaps: pass `flowConfig` into `ProcessingScreen` so the step list omits "Comparing your face" when face capture is not required, and pass flow-awareness into `OutcomeScreen` so the verified metrics reflect only the steps that were actually collected.

## How To Resume Tomorrow
1. Run `npm run dev` and open `http://localhost:3000/verify` to confirm the flow works.
2. Run `npx tsc --noEmit` to confirm zero type errors.
3. The machine transition gaps are now fixed. The remaining content gaps are in `screens/ProcessingScreen.tsx` (hardcoded step list) and `screens/OutcomeScreen.tsx` (hardcoded metrics). Both need `flowConfig` passed in from `VerifyFlow.tsx`.
4. All code is on `main` at `https://github.com/Clarity-Product-Team/mickeymaize-clarity` (latest commit `2b43ca4`).
