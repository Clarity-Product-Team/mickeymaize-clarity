'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { VerifyShell } from '@/components/layout/VerifyShell'
import { ScreenMotion } from '@/components/layout/ScreenMotion'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { FlowInspector } from '@/components/demo/FlowInspector'
import { ThemeSwitcher } from '@/components/demo/ThemeSwitcher'
import { useVerifyFlow } from '@/hooks/useVerifyFlow'
import { useVerificationMachine } from '@/hooks/useVerificationMachine'
import { docSelectConfigFromFlowConfig } from '@/features/verification/config/adapters'
import { EXAMPLE_LOW_RISK_FLOW } from '@/features/verification/config/examples'
import { resolveLivenessRequired, resolveUploadFallbackAllowed } from '@/features/verification/config/resolvers'
import { mockVerificationService } from '@/features/verification/services/mockService'
import { useSessionLifecycle, persistSessionId } from '@/hooks/useSessionLifecycle'
import type { BackendRequiredStep } from '@/features/verification/services/types'
import { clarityTheme } from '@/lib/theme'
import type { ClarityTheme } from '@/lib/theme'

import { WelcomeScreen } from '@/screens/WelcomeScreen'
import { CountryDocSelectScreen } from '@/screens/CountryDocSelectScreen'
import { DocGuidanceScreen } from '@/screens/DocGuidanceScreen'
import { DocCaptureScreen } from '@/screens/DocCaptureScreen'
import { SelfieGuidanceScreen } from '@/screens/SelfieGuidanceScreen'
import { SelfieCaptureScreen } from '@/screens/SelfieCaptureScreen'
import { LivenessScreen } from '@/screens/LivenessScreen'
import { ProcessingScreen } from '@/screens/ProcessingScreen'
import { OutcomeScreen } from '@/screens/OutcomeScreen'
import { RetryScreen } from '@/screens/RetryScreen'
import type { FlowScreenId, VerificationOutcome } from '@/lib/types'
import type { VerificationStateName } from '@/features/verification/machine/states'
import type { VerificationContext } from '@/features/verification/machine/context'

// ── Outcome derivation ────────────────────────────────────────────────────────
//
// Maps the machine state (and optional backend-provided context.outcome) to the
// VerificationOutcome used by OutcomeScreen. context.outcome is authoritative
// when present (set by BACKEND_RESULT_RECEIVED); the state-based fallbacks cover
// terminal states that arrive without an explicit backend outcome.

function deriveOutcome(
  machineState: VerificationStateName,
  machineContext: VerificationContext,
): VerificationOutcome {
  if (machineContext.outcome) return machineContext.outcome
  switch (machineState) {
    case 'pending_manual_review':    return 'pending'
    case 'additional_step_required': return 'additional_step'
    case 'retryable_failure':        return 'retry'
    case 'unrecoverable_failure':    return 'rejected'
    default:                         return 'verified'
  }
}

// ── Resume: BackendRequiredStep → FlowScreenId ────────────────────────────────
//
// Maps the backend's "next required step" (returned by resumeSession) to the
// UI screen the user should be dropped into. Non-UI steps (address_proof,
// video_call, custom) map to null — callers should handle those via the
// additional_step_required outcome path rather than direct navigation.

function stepToFlowScreen(step: BackendRequiredStep): FlowScreenId | null {
  switch (step.type) {
    case 'document_front': return 'doc-capture-front'
    case 'document_back':  return 'doc-capture-back'
    case 'face_capture':   return 'selfie-capture'
    case 'liveness':       return 'liveness'
    default:               return null
  }
}

const CAMERA_SCREENS: FlowScreenId[] = [
  'doc-capture-front',
  'doc-capture-back',
  'selfie-capture',
  'liveness',
]

export function VerifyFlow() {
  const [activeTheme, setActiveTheme] = useState<ClarityTheme>(clarityTheme)

  const {
    state,
    currentScreen,
    resolution,
    progress,
    stepInfo,
    showProgress,
    showBack,
    next,
    back,
    retry,
    resolveRetry,
    goToDocSelect,
    goToScreen,
    selectDoc,
    applyScenario,
  } = useVerifyFlow()

  const { dispatch: machineDispatch, welcomeMode, machineState, machineContext } = useVerificationMachine()

  // Flow config — used to drive the country/doc selection screen.
  // Future: replaced with the session config returned by startSession().
  const flowConfig = EXAMPLE_LOW_RISK_FLOW
  const docSelectConfig = docSelectConfigFromFlowConfig(flowConfig)
  const livenessRequired = resolveLivenessRequired(flowConfig)

  // ── Mock session ───────────────────────────────────────────────────────────
  // Start a mock backend session on mount so uploadDocument() has a valid
  // session to work with. In production this call happens after startSession()
  // resolves and the session ID is stored in VerificationContext.
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    mockVerificationService.startSession({}).then((res) => {
      if (res.ok) {
        sessionIdRef.current = res.data.session.sessionId
        persistSessionId(res.data.session.sessionId)
      }
    })
  }, [])

  // ── Document validate callback ─────────────────────────────────────────────
  // Passed to DocCaptureScreen so ReviewPanel can call the mock service
  // instead of the local stub. Falls back to passing if the session isn't
  // ready yet (shouldn't happen in practice given the selection steps).
  //
  // Dispatches VALIDATION_PASSED or VALIDATION_FAILED to the machine so it
  // tracks the review outcome even before it drives the full screen sequence.
  async function handleDocValidate(
    side: 'front' | 'back',
    docType: import('@/lib/types').DocType,
  ) {
    const sessionId = sessionIdRef.current
    if (!sessionId) {
      machineDispatch({ type: 'VALIDATION_PASSED' })
      return { ok: true }
    }

    const res = await mockVerificationService.uploadDocument({
      sessionId,
      side,
      docType,
      file: new Blob([''], { type: 'image/jpeg' }),
      mimeType: 'image/jpeg',
      capturedAt: new Date().toISOString(),
    })

    if (!res.ok) {
      machineDispatch({ type: 'VALIDATION_FAILED', reason: res.error.message })
      return { ok: false }
    }

    const checks = res.data.qualityChecks?.map((qc) => ({
      label: qc.name,
      ok:    qc.passed,
      failReason: qc.failReason,
    }))

    // Derive a failure reason from the first failing check, if any.
    const firstFailReason = checks?.find((c) => !c.ok)?.label

    if (res.data.acceptable) {
      machineDispatch({ type: 'VALIDATION_PASSED' })
    } else {
      machineDispatch({ type: 'VALIDATION_FAILED', reason: firstFailReason ?? 'quality_check_failed' })
    }

    return { ok: res.data.acceptable, checks }
  }

  // ── Face validate callback ─────────────────────────────────────────────────
  // Passed to SelfieCaptureScreen so it can call the mock service during the
  // validating phase instead of using the hardcoded stub delay.

  async function handleFaceValidate() {
    const sessionId = sessionIdRef.current
    if (!sessionId) {
      machineDispatch({ type: 'VALIDATION_PASSED' })
      return { ok: true }
    }

    const res = await mockVerificationService.uploadFace({
      sessionId,
      file: new Blob([''], { type: 'image/jpeg' }),
      mimeType: 'image/jpeg',
      capturedAt: new Date().toISOString(),
    })

    if (!res.ok) {
      machineDispatch({ type: 'VALIDATION_FAILED', reason: res.error.message })
      return { ok: false }
    }

    if (res.data.acceptable) {
      machineDispatch({ type: 'VALIDATION_PASSED' })
    } else {
      machineDispatch({ type: 'VALIDATION_FAILED', reason: res.data.rejectReason ?? 'face_quality_failed' })
    }

    return { ok: res.data.acceptable }
  }

  // ── Session lifecycle: resume + polling ───────────────────────────────────────
  //
  // onResumed: called after a successful resumeSession() — navigate to the
  //   screen for the next required step, or to 'processing' if all steps
  //   have already been submitted and the backend is running its pipeline.
  //
  // onOutcomeReady: called when the poll loop receives a terminal result —
  //   advance the UI to the 'success' screen (which reads outcome from machine).

  const onResumed = useCallback((nextStep: BackendRequiredStep | null) => {
    if (!nextStep) {
      goToScreen('processing')
      return
    }
    const screen = stepToFlowScreen(nextStep)
    if (screen) goToScreen(screen)
  }, [goToScreen])

  const { beginPolling } = useSessionLifecycle({
    service:         mockVerificationService,
    sessionIdRef,
    machineDispatch,
    onResumed,
    onOutcomeReady:  next,
  })

  // ── Retry navigation ──────────────────────────────────────────────────────────
  //
  // When the machine enters retryable_failure with a failedState pointing to a
  // known capture step, navigate the UI to that step. This handles backend-driven
  // retries (fetchStatus → needs_retry → RETRY_STEP) as well as any future path
  // where the machine independently signals a retry without the UI having already
  // routed via retry().
  //
  // This effect intentionally does NOT trigger for retryable_failure states caused
  // by the normal capture flow (those are handled by onRetry/retry() callbacks in
  // the capture screens themselves and show RetryScreen).

  useEffect(() => {
    if (machineState !== 'retryable_failure') return
    if (currentScreen !== 'processing') return   // only handle backend-driven retries here
    const failedState = machineContext.failedState
    if (!failedState) return
    const stateToScreen: Partial<Record<VerificationStateName, FlowScreenId>> = {
      capturing_document_front: 'doc-capture-front',
      capturing_document_back:  'doc-capture-back',
      capturing_face:           'selfie-capture',
      capturing_motion:         'liveness',
    }
    const screen = stateToScreen[failedState]
    if (screen) goToScreen(screen)
  }, [machineState, machineContext.failedState, currentScreen, goToScreen])

  const isCameraScreen = CAMERA_SCREENS.includes(currentScreen)
  const screenKey = state.retryError ? `retry-${state.retryError}` : currentScreen

  function renderContent() {
    if (state.retryError) {
      return (
        <RetryScreen
          errorType={state.retryError}
          onRetry={resolveRetry}
          onChangeDoc={state.retryError === 'wrong_doc' ? goToDocSelect : undefined}
        />
      )
    }

    switch (currentScreen) {
      case 'welcome':
        return (
          <WelcomeScreen
            mode={welcomeMode}
            onStart={() => {
              machineDispatch({ type: 'START' })
              machineDispatch({ type: 'CONTINUE' }) // intro → selecting_country
              next()
            }}
          />
        )
      case 'country-doc':
        return (
          <CountryDocSelectScreen
            config={docSelectConfig}
            livenessRequired={livenessRequired}
            onSelect={(docType, country) => {
              machineDispatch({ type: 'COUNTRY_SELECTED', country })
              machineDispatch({ type: 'DOCUMENT_SELECTED', docType })
              selectDoc(docType, country)
            }}
          />
        )
      case 'doc-guidance':
        return (
          <DocGuidanceScreen
            docType={state.docType}
            requiresBackCapture={resolution.flags.requiresBackCapture}
            onContinue={next}
          />
        )
      case 'doc-capture-front':
        return (
          <DocCaptureScreen
            side="front"
            docType={state.docType}
            allowUpload={resolveUploadFallbackAllowed(flowConfig, state.docType)}
            onValidate={handleDocValidate}
            onCapture={() => {
              machineDispatch({ type: 'CAPTURE_CONFIRMED' })
              next()
            }}
            onRetry={(error) => {
              machineDispatch({ type: 'CAPTURE_FAILED', reason: error })
              retry(error)
            }}
            onRetakeFromReview={() => machineDispatch({ type: 'RETAKE' })}
          />
        )
      case 'doc-capture-back':
        return (
          <DocCaptureScreen
            side="back"
            docType={state.docType}
            allowUpload={resolveUploadFallbackAllowed(flowConfig, state.docType)}
            onValidate={handleDocValidate}
            onCapture={() => {
              machineDispatch({ type: 'CAPTURE_CONFIRMED' })
              next()
            }}
            onRetry={(error) => {
              machineDispatch({ type: 'CAPTURE_FAILED', reason: error })
              retry(error)
            }}
            onRetakeFromReview={() => machineDispatch({ type: 'RETAKE' })}
          />
        )
      case 'selfie-guidance':
        return <SelfieGuidanceScreen onContinue={next} />
      case 'selfie-capture':
        return (
          <SelfieCaptureScreen
            mode={flowConfig.faceCapture.mode}
            onValidate={handleFaceValidate}
            onCapture={() => {
              machineDispatch({ type: 'CAPTURE_CONFIRMED' })
              next()
            }}
            onCaptureFailed={() =>
              machineDispatch({ type: 'CAPTURE_FAILED', reason: 'face_mismatch' })
            }
            onRetry={(error) => {
              machineDispatch({ type: 'CAPTURE_FAILED', reason: error })
              retry(error)
            }}
          />
        )
      case 'liveness':
        return <LivenessScreen onComplete={next} />
      case 'processing':
        return <ProcessingScreen onComplete={beginPolling} />
      case 'success':
        return (
          <OutcomeScreen
            outcome={deriveOutcome(machineState, machineContext)}
            onContinue={() => alert('Continue — integrate your callback here')}
            onRetry={goToDocSelect}
          />
        )
      default:
        return null
    }
  }

  return (
    // reducedMotion="user" makes all Framer Motion animations respect
    // the OS-level prefers-reduced-motion preference.
    <MotionConfig reducedMotion="user">
    <ThemeProvider theme={activeTheme}>
      <>
        {/* Demo-only: Theme switcher pill */}
        <ThemeSwitcher activeKey={activeTheme.key} onChange={setActiveTheme} />

        <VerifyShell
          progress={progress}
          stepInfo={stepInfo}
          showProgress={showProgress}
          showBack={showBack}
          onBack={back}
        >
          <AnimatePresence mode="wait" custom={state.direction}>
            <ScreenMotion
              key={screenKey}
              direction={state.direction}
              mode={isCameraScreen ? 'camera' : 'default'}
            >
              {renderContent()}
            </ScreenMotion>
          </AnimatePresence>
        </VerifyShell>

        {/* Demo-only: Flow Inspector overlay */}
        <FlowInspector
          resolution={resolution}
          currentScreen={currentScreen}
          onApplyScenario={applyScenario}
        />
      </>
    </ThemeProvider>
    </MotionConfig>
  )
}
