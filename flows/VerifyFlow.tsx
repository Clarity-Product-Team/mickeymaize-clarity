'use client'

import { AnimatePresence } from 'framer-motion'
import { VerifyShell } from '@/components/layout/VerifyShell'
import { useVerifyFlow } from '@/hooks/useVerifyFlow'

import { WelcomeScreen } from '@/screens/WelcomeScreen'
import { CountryDocSelectScreen } from '@/screens/CountryDocSelectScreen'
import { DocGuidanceScreen } from '@/screens/DocGuidanceScreen'
import { DocCaptureScreen } from '@/screens/DocCaptureScreen'
import { SelfieGuidanceScreen } from '@/screens/SelfieGuidanceScreen'
import { SelfieCaptureScreen } from '@/screens/SelfieCaptureScreen'
import { LivenessScreen } from '@/screens/LivenessScreen'
import { ProcessingScreen } from '@/screens/ProcessingScreen'
import { SuccessScreen } from '@/screens/SuccessScreen'
import { RetryScreen } from '@/screens/RetryScreen'

/**
 * Root client component — orchestrates the full verification journey.
 *
 * Responsibilities:
 *   - Owns all flow state via useVerifyFlow
 *   - Passes scoped callbacks (onNext, onRetry, etc.) to each screen
 *   - Wraps screens in AnimatePresence for exit/enter transitions
 *   - Renders VerifyShell for the persistent top bar and mobile frame
 *
 * Screens only know their own callbacks. They have no knowledge of
 * the surrounding flow, making them fully reusable and independently testable.
 */
export function VerifyFlow() {
  const {
    state,
    currentScreen,
    progress,
    showProgress,
    showBack,
    next,
    back,
    retry,
    resolveRetry,
    selectDoc,
  } = useVerifyFlow()

  function renderScreen() {
    // Retry overlay — takes precedence over the current flow screen
    if (state.retryError) {
      return (
        <RetryScreen
          key="retry"
          errorType={state.retryError}
          onRetry={resolveRetry}
        />
      )
    }

    switch (currentScreen) {
      case 'welcome':
        return <WelcomeScreen key="welcome" onStart={next} />

      case 'country-doc':
        return <CountryDocSelectScreen key="country-doc" onSelect={selectDoc} />

      case 'doc-guidance':
        return (
          <DocGuidanceScreen
            key="doc-guidance"
            docType={state.docType}
            onContinue={next}
          />
        )

      case 'doc-capture-front':
        return (
          <DocCaptureScreen
            key="doc-capture-front"
            side="front"
            docType={state.docType}
            onCapture={next}
            onRetry={retry}
          />
        )

      case 'doc-capture-back':
        return (
          <DocCaptureScreen
            key="doc-capture-back"
            side="back"
            docType={state.docType}
            onCapture={next}
            onRetry={retry}
          />
        )

      case 'selfie-guidance':
        return <SelfieGuidanceScreen key="selfie-guidance" onContinue={next} />

      case 'selfie-capture':
        return (
          <SelfieCaptureScreen
            key="selfie-capture"
            onCapture={next}
            onRetry={retry}
          />
        )

      case 'liveness':
        return <LivenessScreen key="liveness" onComplete={next} />

      case 'processing':
        return <ProcessingScreen key="processing" onComplete={next} />

      case 'success':
        return <SuccessScreen key="success" />

      default:
        return null
    }
  }

  return (
    <VerifyShell
      progress={progress}
      showProgress={showProgress}
      showBack={showBack}
      onBack={back}
    >
      <AnimatePresence mode="wait" custom={state.direction}>
        {renderScreen()}
      </AnimatePresence>
    </VerifyShell>
  )
}
