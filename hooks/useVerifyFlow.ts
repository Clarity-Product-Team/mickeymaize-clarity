'use client'

import { useState, useCallback, useMemo } from 'react'
import { evaluateFlow, detectDeviceType } from '@/lib/flowEngine'
import { FLOW_RULES, type DemoScenario } from '@/lib/flowRules'
import { deriveRiskLevel } from '@/lib/riskData'
import { getProgress, getStepInfo } from '@/lib/flow'
import type {
  DocType,
  ErrorType,
  FlowContext,
  FlowResolution,
  FlowScreenId,
  FlowState,
  RiskLevel,
  StepInfo,
} from '@/lib/types'

interface UseVerifyFlowResult {
  state: FlowState
  currentScreen: FlowScreenId
  resolution: FlowResolution
  progress: number
  stepInfo: StepInfo | null
  showProgress: boolean
  showBack: boolean
  next: () => void
  back: () => void
  retry: (error: ErrorType) => void
  resolveRetry: () => void
  /** Navigate back to the document-selection screen (used when wrong_doc is retried) */
  goToDocSelect: () => void
  /**
   * Jump directly to a named screen in the current flow.
   * No-ops if the screen is not in the current screen list (e.g. liveness
   * not required for the selected flow). Used for resume navigation.
   */
  goToScreen: (screen: FlowScreenId) => void
  selectDoc: (docType: DocType, country: string) => void
  applyScenario: (scenario: DemoScenario) => void
}

/** Builds a FlowContext from parts, deriving riskLevel if not provided */
function buildContext(
  docType: DocType,
  country: string,
  riskOverride?: RiskLevel,
): FlowContext {
  return {
    docType,
    country,
    riskLevel: riskOverride ?? deriveRiskLevel(country),
    deviceType: detectDeviceType(),
  }
}

/** The starting context — shown before the user selects a document */
const DEFAULT_CTX = buildContext('passport', 'United Kingdom')
const DEFAULT_RESOLUTION = evaluateFlow(DEFAULT_CTX, FLOW_RULES)

const INITIAL_STATE: FlowState = {
  docType: DEFAULT_CTX.docType,
  country: DEFAULT_CTX.country,
  riskLevel: DEFAULT_CTX.riskLevel,
  screens: DEFAULT_RESOLUTION.screens,
  screenIndex: 0,
  retryError: null,
  direction: 1,
}

export function useVerifyFlow(): UseVerifyFlowResult {
  const [state, setState] = useState<FlowState>(INITIAL_STATE)
  const [resolution, setResolution] = useState<FlowResolution>(DEFAULT_RESOLUTION)

  const currentScreen: FlowScreenId = state.retryError
    ? 'retry'
    : state.screens[state.screenIndex]

  const next = useCallback(() => {
    setState((prev) => ({
      ...prev,
      retryError: null,
      direction: 1,
      screenIndex: Math.min(prev.screenIndex + 1, prev.screens.length - 1),
    }))
  }, [])

  const back = useCallback(() => {
    setState((prev) => ({
      ...prev,
      retryError: null,
      direction: -1,
      screenIndex: Math.max(prev.screenIndex - 1, 0),
    }))
  }, [])

  const retry = useCallback((error: ErrorType) => {
    setState((prev) => ({ ...prev, retryError: error, direction: 1 }))
  }, [])

  const resolveRetry = useCallback(() => {
    setState((prev) => ({ ...prev, retryError: null }))
  }, [])

  /** Jump to any named screen in the current flow (for resume / retry navigation). */
  const goToScreen = useCallback((screen: FlowScreenId) => {
    setState((prev) => {
      const idx = prev.screens.indexOf(screen)
      if (idx < 0) return prev
      return { ...prev, screenIndex: idx, retryError: null, direction: 1 }
    })
  }, [])

  /** Go back to the document-selection screen, clearing any retry error. */
  const goToDocSelect = useCallback(() => {
    setState((prev) => {
      const idx = prev.screens.indexOf('country-doc')
      return {
        ...prev,
        retryError: null,
        direction: -1,
        screenIndex: idx >= 0 ? idx : 0,
      }
    })
  }, [])

  /** Called from CountryDocSelectScreen when the user confirms their selection */
  const selectDoc = useCallback((docType: DocType, country: string) => {
    const ctx = buildContext(docType, country)
    const res = evaluateFlow(ctx, FLOW_RULES)
    setResolution(res)
    setState((prev) => ({
      ...prev,
      docType,
      country,
      riskLevel: ctx.riskLevel,
      screens: res.screens,
      direction: 1,
      screenIndex: prev.screenIndex + 1,
    }))
  }, [])

  /**
   * Applies a demo scenario from the FlowInspector.
   * Resets the flow to the welcome screen with the scenario's context pre-loaded.
   */
  const applyScenario = useCallback((scenario: DemoScenario) => {
    const ctx = buildContext(scenario.docType, scenario.country)
    const res = evaluateFlow(ctx, FLOW_RULES)
    setResolution(res)
    setState({
      docType: scenario.docType,
      country: scenario.country,
      riskLevel: ctx.riskLevel,
      screens: res.screens,
      screenIndex: 0,
      retryError: null,
      direction: 1,
    })
  }, [])

  const progress = useMemo(
    () => getProgress(state.screens, currentScreen),
    [state.screens, currentScreen],
  )

  const stepInfo = useMemo(
    () => getStepInfo(state.screens, currentScreen),
    [state.screens, currentScreen],
  )

  const showProgress = !['welcome', 'success', 'retry'].includes(currentScreen)

  const showBack = useMemo(() => {
    if (state.retryError) return false
    if (state.screenIndex <= 1) return false
    if (['processing', 'success'].includes(currentScreen)) return false
    return true
  }, [state.retryError, state.screenIndex, currentScreen])

  return {
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
  }
}
