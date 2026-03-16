# Clarity Verify

A high-fidelity, fully-interactive prototype of a modern identity verification (KYC) flow. Built as a design and engineering reference for what a production-grade verification widget should look and feel like.

**Stack:** Next.js 16 · React 19 · TypeScript · Framer Motion · Tailwind CSS v4 · Lucide React

---

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000/verify](http://localhost:3000/verify).

The entire prototype runs in the browser with no backend, no camera permission required, and no data sent anywhere. Camera capture is simulated.

---

## What this is

Clarity Verify is a redesign of the typical Onfido/Jumio-style KYC verification flow — the UI that users see when they're asked to upload a passport and take a selfie during account onboarding.

The goal was to design something significantly better across every dimension: faster, clearer, more forgiving, and more trustworthy. The prototype is fully interactive, white-label ready, and serves as a handoff artifact for engineering.

---

## The redesign in brief

Most existing KYC products are designed from the compliance side outward. The result is flows that feel like filling in a government form: too many screens, passive instructions, vague errors, and no sense of how long it will take. Abandonment rates are high.

Clarity Verify is designed from the user's experience inward. Every screen earns its presence. Every error is specific and fixable. Every camera interaction gives real-time feedback before asking for anything.

---

## UX improvements over a typical Onfido-style flow

| Dimension | Onfido-style | Clarity Verify |
|---|---|---|
| **Welcome** | Numbered list of steps | Animated trust card with time estimate, encryption badge, and purpose explanation |
| **Document selection** | Dropdown menus | Visual document cards with illustrations; country changes update the flow live |
| **Document guidance** | Static image + bullet list | Interactive checklist; CTA personalises to "Scan my Passport" when all items are confirmed |
| **Document capture** | Manual trigger only | Smart overlay with 5 real-time quality checks; auto-captures when all pass |
| **Quality feedback** | Post-submit errors | Issue-specific instructions appear *before* capture: blur, glare, partial, distance, darkness |
| **Stuck users** | Nothing | Nudge banner appears after 9 s of struggling; offers "Capture anyway →" escape hatch |
| **Back-side transition** | Separate static screen | Same capture component, new heading; flip icon signals continuity |
| **Selfie guidance** | Bullet list | Animated face silhouette + arc preview + three contextual tips |
| **Selfie capture** | Static oval, manual trigger | Dynamic oval responds to 5 face issues; header copy warms up as quality improves |
| **Liveness** | Jarring burst of instructions | Single screen, animated arc progress, status text changes naturally |
| **Processing** | Spinner | Four animated step cards tick through in real time |
| **Success** | Green checkmark | Confidence score cards, privacy note, verification ID |
| **Errors / Retry** | "Try again" generic | Six specific error types with visual diagrams and fixable tips; `wrong_doc` routes back to doc selection |
| **Flow length** | Fixed | Adaptive: streamlined for low-risk passport holders, extended for high-risk / compliance requirements |
| **Accessibility** | Minimal | Semantic landmarks, ARIA live regions, `:focus-visible` rings, 44 px touch targets, `prefers-reduced-motion` |
| **White-label** | Separate SDKs per client | Single theme object; swap colors, type, radius, logo, progress style, illustration density |

---

## Screens

### Flow A — Streamlined (passport · low risk · mobile)
Welcome → Document Select → Front Capture → Selfie Capture → Processing → Success

### Flow B — Standard (driver's license / national ID)
Welcome → Document Select → Document Guidance → Front Capture → **Back Capture** → Selfie Guidance → Selfie Capture → Processing → Success

### Flow C — Enhanced (medium risk or FATF-monitored country)
...same as B, with **Liveness Check** inserted before Processing

### Flow D — Full Compliance (high risk / FATF-listed / residence permit)
...same as C (back capture + liveness always required)

### Error/Retry screens (accessible from any capture step)
- `blur` — blurry photo; tip: brace your elbow
- `glare` — light reflection on document; tip: tilt away from light
- `partial` — corner out of frame; tip: move back
- `wrong_doc` — document type doesn't match selection; primary CTA navigates back to doc selection
- `expired` — document past its expiry date
- `face_mismatch` — selfie doesn't match document photo

---

## Main reusable components

### Layout

| Component | Purpose |
|---|---|
| `VerifyShell` | Top bar (back button, step label, brand mark), progress indicator, `<main>` landmark |
| `ThemeProvider` | Injects a `ClarityTheme` as CSS custom properties; provides `useTheme()` context hook |
| `ScreenMotion` | Direction-aware slide transition wrapper (slides in/out; camera screens fade only) |

### Camera

| Component | Purpose |
|---|---|
| `CameraFrame` | Dark viewport container with radial vignette; accepts overlays as absolute children |
| `FaceOverlay` | SVG oval with 5 issue-specific visual states + animated liveness arc |
| `DocCaptureOverlay` | Document rectangle with corner brackets + 5 issue-specific visual effects |
| `DocCaptureInstruction` | Bottom banner showing the current active doc quality issue |
| `SelfieInstruction` | Bottom banner showing the current active face quality issue |
| `ShutterButton` | Circular capture button with animated SVG progress ring |

### Primitives

| Component | Purpose |
|---|---|
| `Button` | 4 variants (primary / secondary / ghost / danger), 3 sizes, leading and trailing icon |
| `Badge` | Inline label chip with 5 color variants |
| `NoticeBox` | Alert box with 4 semantic variants (info / success / warning / danger) |
| `AnimatedCheck` | Sequenced circle-then-tick animation (used on success screen) |

### Demo tooling (removed in production)

| Component | Purpose |
|---|---|
| `FlowInspector` | Fixed overlay showing current context, resolved screen list, applied rules, flags |
| `ThemeSwitcher` | Floating pill for switching between theme presets in real time |

---

## Flow logic

The verification journey is not a fixed screen list. It is evaluated at runtime from a set of declarative rules.

### How it works

```
FlowContext  →  evaluateFlow(ctx, FLOW_RULES)  →  FlowResolution
```

**`FlowContext`** captures the user's situation:
- `docType` — passport / drivers-license / national-id / residence-permit
- `country` — issuing country selected on the document screen
- `riskLevel` — low / medium / high (derived from country using FATF risk data)
- `deviceType` — mobile / desktop (detected from `window.innerWidth`)

**`evaluateFlow`** starts from a base flow and applies each rule in definition order. Every rule has one atomic effect: `insert_before`, `insert_after`, or `remove` a named screen ID. Inserting a screen that already exists is a no-op, so multiple rules can require liveness without duplicating the step.

**`FlowResolution`** is the output:
- `screens` — the resolved, ordered list of screen IDs
- `appliedRules` — which rules fired (written to an audit log in production)
- `flags` — `requiresBackCapture`, `requiresLiveness`, `isStreamlined`

### The rules in this prototype

| Rule ID | Condition | Effect |
|---|---|---|
| `two-sided-doc` | DL / National ID / Residence permit | Insert `doc-capture-back` after front |
| `passport-streamlined` | Passport + low risk | Remove `doc-guidance` screen |
| `low-risk-selfie-streamlined` | Passport + low risk + mobile | Remove `selfie-guidance` screen |
| `desktop-skip-selfie-guidance` | Desktop device | Remove `selfie-guidance` screen |
| `medium-risk-liveness` | Risk level = medium | Insert `liveness` before processing |
| `high-risk-liveness` | Risk level = high | Insert `liveness` before processing |
| `high-risk-country-liveness` | FATF high-risk country | Insert `liveness` (compliance, non-waivable) |
| `medium-risk-country-liveness` | FATF monitored country + low individual risk | Insert `liveness` |
| `residence-permit-eu-aml` | Residence permit + low risk + EU | Insert `liveness` (5AMLD requirement) |

### Production scaling path

In production, rules live in a versioned config database. A new rule goes through compliance sign-off → product review → engineering review. Rules can be toggled per-client and per-region without a code deployment. A shadow evaluator runs candidates in read-only mode before activation. Conversion metrics are tracked per rule to measure friction impact.

---

## Theming and white-label

A client branding the widget does one thing:

```tsx
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { myTheme } from './myTheme'

<ThemeProvider theme={myTheme}>
  <VerifyFlow />
</ThemeProvider>
```

A `ClarityTheme` is a plain, serialisable object:

```typescript
interface ClarityTheme {
  key: string
  displayName: string
  brand: {
    name: string
    logoMark: 'clarity' | { initials: string }  // built-in SVG or two-letter monogram
  }
  colors: { accent, accentMuted, accentHover, accentPressed, accentOn,
            ink1, ink2, ink3, surface0, surface1, surfaceDark,
            border1, border2, success, successMuted, warning, warningMuted,
            danger, dangerMuted }
  typography: { fontFamily, headingWeight, headingLetterSpacing,
                buttonWeight, buttonLetterSpacing,
                buttonTextTransform: 'none' | 'uppercase',
                labelUppercase, labelLetterSpacing }
  shape: { radiusSm … radius2xl, radiusFull,
           cardRadius,    // desktop phone-preview card border-radius
           buttonRadius } // CTA button border-radius
  progress: { style: 'bar' | 'dots', height, activeColor?, trackColor? }
  illustrations: 'full' | 'minimal' | 'none'
}
```

`ThemeProvider` converts the object to CSS custom properties and applies them on a `display: contents` wrapper div — invisible to layout, but the cascade flows to every descendant component. No component code changes are needed when switching themes.

### Three preset themes

| Theme | Brand | Accent | Buttons | Progress | Illustrations |
|---|---|---|---|---|---|
| **Clarity** | Clarity Verify | Indigo `#4F5BD5` | Rounded 12 px, mixed case | 3 px bar | Full |
| **Apex Capital** | Apex Capital | Cobalt `#0052CC` | Sharp 6 px, UPPERCASE | 2 px thin bar | Minimal |
| **TrustBazaar** | TrustBazaar | Orange `#E85D29` | Pill 9999 px, mixed case | 8 px dot-per-step | Full |

---

## File structure

```
clarity-verify-app/
├── app/
│   ├── globals.css          ← Design tokens, CSS variables, layout helpers (.screen-scroll, .screen-footer)
│   └── verify/page.tsx      ← Next.js entry point
├── flows/
│   └── VerifyFlow.tsx       ← Root orchestrator: screen routing, theme state, demo tool wiring
├── screens/                 ← One file per screen in the verification journey
│   ├── WelcomeScreen.tsx
│   ├── CountryDocSelectScreen.tsx
│   ├── DocGuidanceScreen.tsx
│   ├── DocCaptureScreen.tsx
│   ├── SelfieGuidanceScreen.tsx
│   ├── SelfieCaptureScreen.tsx
│   ├── LivenessScreen.tsx
│   ├── ProcessingScreen.tsx
│   ├── SuccessScreen.tsx
│   └── RetryScreen.tsx
├── components/
│   ├── layout/
│   │   ├── VerifyShell.tsx       ← Shell wrapper, brand mark, progress bar
│   │   ├── ThemeProvider.tsx     ← CSS custom property injection + useTheme() hook
│   │   └── ScreenMotion.tsx      ← Direction-aware screen transitions
│   ├── camera/
│   │   ├── CameraFrame.tsx
│   │   ├── FaceOverlay.tsx
│   │   ├── DocCaptureOverlay.tsx
│   │   ├── DocCaptureInstruction.tsx
│   │   ├── SelfieInstruction.tsx
│   │   └── ShutterButton.tsx
│   ├── primitives/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── NoticeBox.tsx
│   │   ├── AnimatedCheck.tsx
│   │   └── Spinner.tsx
│   └── demo/
│       ├── FlowInspector.tsx     ← Dev-only overlay
│       └── ThemeSwitcher.tsx     ← Dev-only theme toggle
├── hooks/
│   ├── useVerifyFlow.ts     ← Flow state machine (navigation, retry, doc selection, scenario apply)
│   ├── useDocQuality.ts     ← Simulated document quality analysis (drop-in for real ML)
│   └── useSelfieQuality.ts  ← Simulated selfie quality analysis (drop-in for real ML)
└── lib/
    ├── types.ts             ← All TypeScript types
    ├── content.ts           ← All user-facing copy (single source of truth)
    ├── theme.ts             ← ClarityTheme interface + themeToVars() + 3 presets
    ├── flow.ts              ← getProgress(), getStepInfo(), screen/step label maps
    ├── flowEngine.ts        ← evaluateFlow() rule engine + detectDeviceType()
    ├── flowRules.ts         ← 8 declarative flow rules + 4 demo scenarios
    ├── constants.ts         ← DOC_TYPES, COUNTRIES, ERROR_CONFIGS
    ├── riskData.ts          ← Country risk classification (HIGH/MEDIUM_RISK sets)
    └── utils.ts             ← cn(), generateVerificationId()
```

---

## Accessibility

The prototype implements WCAG 2.1 AA across these dimensions:

- **Color contrast** — all text tokens meet ≥ 4.5 : 1 against their backgrounds (`--ink-3` is `#5E6E82`, 5.2 : 1 vs white)
- **Keyboard navigation** — `:focus-visible` rings on all interactive elements; `outline: none` never appears in component inline styles
- **ARIA** — `<header>` and `<main>` landmarks; `role="progressbar"`, `role="alert"` (retry screen), `role="status"` (processing + camera instructions); `aria-pressed` on toggle/select buttons; `aria-hidden` on all decorative illustrations
- **Screen reader announcements** — persistent `.sr-only` `aria-live="polite"` div outside `AnimatePresence` for step changes (AnimatePresence unmounting would swallow announcements); `aria-atomic="false"` on the processing step list for incremental announcements
- **Motion** — `<MotionConfig reducedMotion="user">` at the root respects the OS preference in Framer Motion's animation engine; `@media (prefers-reduced-motion: reduce)` covers CSS transitions
- **Touch targets** — all interactive elements meet 44 × 44 px (Apple HIG / WCAG 2.5.5)
- **Safe areas** — `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)` on sticky footers and camera controls

---

## Demo script

**Before you start:** run `npm run dev`, open `/verify` at ~390 px width. Close the Flow Inspector; ThemeSwitcher visible at top.

### Scene 1 — Default flow, Clarity theme (~2 min)

> "The welcome screen leads with a time estimate, a step preview, and an encrypted badge. One CTA, no walls of text."

**Get started** → select **Germany** · **Driver's License**.

> "Document selection. Watch the flow preview at the bottom — it updates live as you change the country or document type. The '2 sides' badge tells the user upfront what's coming."

**Continue** → **Scan my Driver's License**.

> "Five quality checks run live — blur, glare, distance, partial corners, darkness. The overlay shows what's wrong. Once all five pass, the shutter auto-fires. No button required."

Wait for auto-capture. Review panel. **Use this photo**. Repeat for back side. Continue to selfie screens.

> "The selfie oval reacts to five face issues. The header copy warms up: 'Looking good', 'Almost there', 'Hold still'. Processing ticks through four named steps instead of spinning."

Continue through **Processing** → **Success**.

### Scene 2 — Adaptive flow (~1.5 min)

Open **Flow Inspector** (gear icon, bottom right).

> "This shows which flow rules fired. The current context is UK passport, low risk — streamlined path, no back capture, no liveness."

Click **Compliance** scenario (Residence permit · Iran · High risk).

> "Two rules fired: back capture because it's a residence permit, liveness because Iran is FATF high-risk. The resolved flow strip shows exactly which screens will appear."

Close inspector. Walk through to the **Liveness** screen.

### Scene 3 — Error handling (~1 min)

Reset. Get to doc capture. Click **Having trouble?**.

> "Error screens are specific. The diagram shows what went wrong. The tip says exactly how to fix it."

Demonstrate `wrong_doc`: the primary button becomes **Change document** and navigates back to document selection instead of repeating the same capture.

### Scene 4 — White-label themes (~1.5 min)

Switch to **Apex — Fintech** using the top pill.

> "Sharp corners, uppercase CTAs, thin 2-px bar, minimal illustrations, system-ui type. A Stripe-style institutional feel."

Switch to **TrustBazaar — Marketplace**.

> "Warm orange, pill buttons, dot progress, bold headings. An Airbnb-style human feel. Same components, same accessibility, completely different brand. A client drops in one theme object — no component changes needed."

---

## Future improvements

### Product
- Real-time blur/glare/face detection (replace quality simulation hooks with WebAssembly or native SDK bridge)
- OCR field-level confidence display after document capture
- Active liveness: head-turn instruction with arc tracking
- Document MRZ/barcode highlight during back-capture
- Multi-language support (`content.ts` is already the single source of truth; wire `i18next`)
- Image crop and perspective correction for gallery uploads
- Guided retry with attempt counter and progressive support escalation after 2 failures

### Engineering
- Wire `getUserMedia` for real camera capture (same hook interface, no component changes)
- Connect capture callbacks to a verification API (Onfido, Veriff, Stripe Identity, or custom)
- Move `FLOW_RULES` to a server-side versioned config with per-client overrides and feature flags
- Session recovery: persist flow state to `sessionStorage` so refresh restarts gracefully
- Dark mode: add dark-surface token variants to `ClarityTheme` (CSS variable architecture already supports it)
- Automated accessibility testing with axe-core or Playwright
- Analytics: per-screen completion rate, retry rate per error type, flow abandonment
- Code-split camera components (only needed mid-flow)

### Design system
- Sync `ClarityTheme` tokens to a Figma variables file for design/eng parity
- Storybook stories for each primitive and camera component
- Motion design spec: name the easing curves and duration tokens

---

## Key design decisions

**CSS custom properties instead of CSS-in-JS theming** — the widget must be embeddable in any host app without bundler configuration. CSS variables work at the DOM boundary and would survive a Web Component wrapper.

**`display: contents` on ThemeProvider** — a wrapper `<div>` would break flex/grid layouts in parent components. `display: contents` makes the wrapper layout-transparent while still cascading custom properties to all descendants.

**Declarative flow rules instead of a config array** — rules can be reasoned about, tested, and toggled independently. A config array requires understanding the full screen order to make changes safely.

**Simulated quality hooks** — the prototype runs offline and can be demoed without camera permissions. The hooks present the identical interface as a real implementation. Replacing them is a one-file change per hook.

**All copy in `content.ts`** — one place to edit any user-facing string. Makes tone-of-voice reviews, copy edits, and localisation straightforward. No prose lives in component files.
