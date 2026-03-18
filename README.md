# Clarity Verify

A high-fidelity, interactive KYC identity verification UI. Built as a design and engineering reference for what a production-grade verification widget should look and feel like.

**Stack:** Next.js 16 · React 19 · TypeScript · Framer Motion · Lucide React

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000/verify](http://localhost:3000/verify).

Runs entirely in the browser. No backend required. Camera capture is simulated. No data is sent anywhere.

---

## Architecture

```
app/verify/page.tsx
    └── flows/VerifyFlow.tsx          ← root orchestrator
            ├── hooks/useVerifyFlow.ts        ← screen navigation state
            ├── hooks/useVerificationMachine.ts  ← state machine hook
            ├── hooks/useSessionLifecycle.ts  ← session persistence + polling
            ├── features/verification/
            │   ├── machine/          ← state machine types + transitions
            │   ├── config/           ← flow configuration (countries, docs, steps)
            │   ├── services/         ← backend contract + mock service
            │   └── selectors/        ← derived state helpers
            └── screens/              ← one file per screen
```

Two systems run in parallel:

- **`useVerifyFlow`** — manages screen navigation (which screen is currently shown, forward/back, retry). Lightweight; does not know about machine states.
- **`useVerificationMachine`** — a `useReducer`-based state machine that tracks the full lifecycle of the session (idle → capture → upload → processing → outcome). Drives machine events independently from UI navigation.

The two systems are wired together in `VerifyFlow.tsx`, which is the only file that needs to understand both.

---

## Running locally

```bash
npm run dev        # dev server at http://localhost:3000
npm run build      # production build
npm run typecheck  # TypeScript check (npx tsc --noEmit)
npm run lint       # ESLint
```

All commands run from the repo root.

---

## Where things live

### State machine

```
features/verification/machine/
  states.ts       — VerificationStateName union (23 states)
  events.ts       — VerificationEvent discriminated union (19 events)
  context.ts      — VerificationContext interface + INITIAL_CONTEXT
  transitions.ts  — transition(state, event, context) → TransitionResult | null
  index.ts        — re-exports all of the above
```

The machine is a pure function. `transitions.ts` maps `(state, event)` pairs to the next state and any context mutations. It has no React dependencies and no side effects.

The React hook that wraps it:

```
hooks/useVerificationMachine.ts
```

Full documentation: [docs/verification-machine.md](docs/verification-machine.md)

---

### Flow configuration

```
features/verification/config/
  types.ts       — VerificationFlowConfig and supporting interfaces
  examples.ts    — EXAMPLE_LOW_RISK_FLOW, EXAMPLE_HIGH_RISK_FLOW, and two others
  resolvers.ts   — resolver functions + validateFlowConfig()
  adapters.ts    — docSelectConfigFromFlowConfig() (bridges config → screen props)
  index.ts       — re-exports all of the above
```

A `VerificationFlowConfig` describes the session: which countries and documents are accepted, whether face capture and liveness are required, and which outcome states the backend may return. It is read-only for the duration of a session.

The demo currently uses `EXAMPLE_LOW_RISK_FLOW` from `examples.ts`. In production, this is replaced by the `requirements` field returned by `startSession()`.

Full documentation: [docs/verification-config.md](docs/verification-config.md)

---

### Backend service mapping

```
features/verification/services/
  types.ts       — all request/response types (provider-agnostic)
  service.ts     — VerificationService interface
  mockService.ts — in-memory mock implementation (current default)
  mapping.ts     — BackendSessionStatus → machine state/event mapping
  index.ts       — re-exports all of the above
```

`VerificationService` is the stable interface both the mock and any real HTTP implementation must satisfy:

```typescript
interface VerificationService {
  startSession(req)    → Promise<ApiResponse<StartSessionResponse>>
  resumeSession(req)   → Promise<ApiResponse<ResumeSessionResponse>>
  uploadDocument(req)  → Promise<ApiResponse<UploadDocumentResponse>>
  uploadFace(req)      → Promise<ApiResponse<UploadFaceResponse>>
  uploadLiveness(req)  → Promise<ApiResponse<UploadLivenessResponse>>
  submitStep(req)      → Promise<ApiResponse<SubmitStepResponse>>
  fetchStatus(req)     → Promise<ApiResponse<FetchStatusResponse>>
}
```

Full documentation: [docs/verification-api.md](docs/verification-api.md)

---

## How to swap mock services for a real backend

The mock service is injected in two places:

**1. `flows/VerifyFlow.tsx`** — session start and upload callbacks:

```typescript
// Find this line:
import { mockVerificationService } from '@/features/verification/services/mockService'

// Replace with your HTTP implementation:
import { httpVerificationService } from '@/features/verification/services/httpService'
```

**2. `hooks/useSessionLifecycle.ts`** — called with `service: mockVerificationService` from `VerifyFlow.tsx`. Same swap applies.

Your HTTP implementation must satisfy the `VerificationService` interface in `features/verification/services/service.ts`. No other files need to change.

The `ApiResponse<T>` envelope handles errors without `try/catch`:

```typescript
const res = await service.startSession(req)
if (!res.ok) {
  // res.error.code, res.error.retryable
  return
}
// res.data is fully typed as StartSessionResponse
```

---

## How to extend machine logic

**Add a new state:**

1. Add the state name to `VerificationStateName` in `features/verification/machine/states.ts`.
2. Add transitions from and to the new state in `features/verification/machine/transitions.ts`.
3. Add it to `TERMINAL_STATES` or `CAPTURE_STATES` if applicable.

**Add a new event:**

1. Add the event type to `VerificationEvent` in `features/verification/machine/events.ts`.
2. Handle it in the relevant states inside `transitions.ts`.

**Add context fields:**

1. Add the field to `VerificationContext` in `features/verification/machine/context.ts`.
2. Add an initial value to `INITIAL_CONTEXT`.
3. Update any transitions that should set or read the field.

The machine is typed exhaustively. TypeScript will surface unhandled states and events.

---

## How to change flow configuration

**Change which countries are available:**

Edit the `supportedCountries` array in the relevant config in `features/verification/config/examples.ts`, or in whatever config object your session initialisation creates.

**Add a new document type:**

1. Add the value to `DocType` in `lib/types.ts`.
2. Add a display entry to `DOC_TYPES` in `lib/constants.ts`.
3. Add a `DocumentTypeConfig` entry to `supportedDocuments` in your flow config.

**Toggle liveness on or off:**

```typescript
liveness: { required: true,  maxAttempts: 2 }   // on
liveness: { required: false }                    // off
```

Liveness requires `faceCapture.required: true`. `validateFlowConfig()` will flag the combination if it is invalid.

**Toggle upload fallback:**

```typescript
capture: { backSideRequired: true, uploadFallbackAllowed: true }   // gallery upload allowed
capture: { backSideRequired: true, uploadFallbackAllowed: false }  // camera only
```

**Validate a config before use:**

```typescript
import { validateFlowConfig } from '@/features/verification/config/resolvers'

const result = validateFlowConfig(myConfig)
if (!result.valid) {
  console.error(result.issues.filter(i => i.level === 'error'))
}
```

Full documentation: [docs/verification-config.md](docs/verification-config.md)

---

## Screens

| Screen | File | Machine states |
|---|---|---|
| Welcome | `screens/WelcomeScreen.tsx` | `idle`, `intro` |
| Country + document selection | `screens/CountryDocSelectScreen.tsx` | `selecting_country`, `selecting_document` |
| Document guidance | `screens/DocGuidanceScreen.tsx` | — (guidance only) |
| Document capture (front + back) | `screens/DocCaptureScreen.tsx` | `capturing_document_front/back`, `validating_*`, `reviewing_*` |
| Selfie guidance | `screens/SelfieGuidanceScreen.tsx` | — (guidance only) |
| Selfie capture | `screens/SelfieCaptureScreen.tsx` | `capturing_face`, `validating_face` |
| Liveness | `screens/LivenessScreen.tsx` | `capturing_motion`, `validating_motion` |
| Processing | `screens/ProcessingScreen.tsx` | `processing`, `awaiting_backend_result` |
| Outcome | `screens/OutcomeScreen.tsx` | `verified`, `pending_manual_review`, `additional_step_required`, `retryable_failure`, `unrecoverable_failure` |
| Retry | `screens/RetryScreen.tsx` | `retryable_failure` |

Flow paths vary by document type and liveness requirement:
- **Passport, no liveness:** welcome → doc select → front capture → selfie → processing → outcome
- **Two-sided document:** adds back capture after front
- **Liveness required:** adds liveness step before processing

---

## Components

### Layout

| Component | Purpose |
|---|---|
| `VerifyShell` | Top bar (back button, step label, brand mark), progress bar |
| `ThemeProvider` | Injects `ClarityTheme` as CSS custom properties; provides `useTheme()` |
| `ScreenMotion` | Direction-aware slide transition wrapper |

### Camera

| Component | Purpose |
|---|---|
| `CameraFrame` | Dark viewport container; accepts overlays as absolute children |
| `FaceOverlay` | SVG oval with issue states and liveness arc |
| `DocCaptureOverlay` | Document rectangle with corner brackets and issue effects |
| `DocCaptureInstruction` | Bottom banner for active document quality issue |
| `SelfieInstruction` | Bottom banner for active face quality issue |
| `ShutterButton` | Capture button with animated SVG progress ring |

### Primitives

| Component | Purpose |
|---|---|
| `Button` | 4 variants, 3 sizes, leading and trailing icon |
| `Badge` | Inline label chip with 5 color variants |
| `NoticeBox` | Alert box with 4 semantic variants |
| `AnimatedCheck` | Sequenced circle-then-tick animation (success screen) |

### Demo-only (remove in production)

| Component | Purpose |
|---|---|
| `FlowInspector` | Overlay showing current state, screen list, applied flags |
| `ThemeSwitcher` | Floating pill for switching between theme presets |

---

## Theming and white-label

Pass a `ClarityTheme` object to `ThemeProvider`:

```tsx
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { myTheme } from './myTheme'

<ThemeProvider theme={myTheme}>
  <VerifyFlow />
</ThemeProvider>
```

A theme controls accent color, typography, border radius, progress style, and illustration density. `ThemeProvider` converts the object to CSS custom properties — no component code changes when switching themes.

Three preset themes are included: `clarityTheme`, `apexTheme`, `trustBazaarTheme`. See `lib/theme.ts`.

---

## Theming, copy, and accessibility

- **All user-facing copy** lives in `lib/content.ts`. Edit strings there; nothing is hardcoded in component files.
- **Accessibility:** semantic landmarks, ARIA live regions, `aria-pressed` on selection controls, 44 px touch targets, `prefers-reduced-motion` via `<MotionConfig reducedMotion="user">`, safe-area insets on sticky footers.

---

## Documentation

| Topic | File |
|---|---|
| State machine — states, events, context, transitions | [docs/verification-machine.md](docs/verification-machine.md) |
| Flow configuration — schema, examples, branching, how-tos | [docs/verification-config.md](docs/verification-config.md) |
| Backend API and mapping layer — contracts, lifecycle, resume, retry | [docs/verification-api.md](docs/verification-api.md) |
| Screen-by-screen gap closure | [docs/screen-gaps.md](docs/screen-gaps.md) |
| Architecture overview | [docs/architecture.md](docs/architecture.md) |
| Engineering conventions | [docs/engineering.md](docs/engineering.md) |
