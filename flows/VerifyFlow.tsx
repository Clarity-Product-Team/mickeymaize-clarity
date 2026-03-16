'use client'

import { useState } from 'react'
import { AnimatePresence, MotionConfig } from 'framer-motion'
import { VerifyShell } from '@/components/layout/VerifyShell'
import { ScreenMotion } from '@/components/layout/ScreenMotion'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { FlowInspector } from '@/components/demo/FlowInspector'
import { ThemeSwitcher } from '@/components/demo/ThemeSwitcher'
import { useVerifyFlow } from '@/hooks/useVerifyFlow'
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
import { SuccessScreen } from '@/screens/SuccessScreen'
import { RetryScreen } from '@/screens/RetryScreen'
import type { FlowScreenId } from '@/lib/types'

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
    selectDoc,
    applyScenario,
  } = useVerifyFlow()

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
        return <WelcomeScreen onStart={next} />
      case 'country-doc':
        return <CountryDocSelectScreen onSelect={selectDoc} />
      case 'doc-guidance':
        return <DocGuidanceScreen docType={state.docType} onContinue={next} />
      case 'doc-capture-front':
        return <DocCaptureScreen side="front" docType={state.docType} onCapture={next} onRetry={retry} />
      case 'doc-capture-back':
        return <DocCaptureScreen side="back" docType={state.docType} onCapture={next} onRetry={retry} />
      case 'selfie-guidance':
        return <SelfieGuidanceScreen onContinue={next} />
      case 'selfie-capture':
        return <SelfieCaptureScreen onCapture={next} onRetry={retry} />
      case 'liveness':
        return <LivenessScreen onComplete={next} />
      case 'processing':
        return <ProcessingScreen onComplete={next} />
      case 'success':
        return <SuccessScreen />
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
