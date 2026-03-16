'use client'

import { useState, useCallback, useMemo } from 'react'
import { buildFlow, getProgress, PROGRESS_EXCLUDED } from '@/lib/flow'
import type { DocType, ErrorType, FlowScreenId, FlowState } from '@/lib/types'

interface UseVerifyFlowResult {
  state: FlowState
  currentScreen: FlowScreenId
  progress: number
  showProgress: boolean
  showBack: boolean
  // Navigation
  next: () => void
  back: () => void
  retry: (error: ErrorType) => void
  resolveRetry: () => void
  selectDoc: (docType: DocType) => void
}

const INITIAL_STATE: FlowState = {
  docType: 'passport',
  screens: buildFlow({ docType: 'passport' }),
  screenIndex: 0,
  retryError: null,
  direction: 1,
}

/**
 * Core flow state machine for the verification journey.
 * All navigation logic lives here; screens only call the provided callbacks.
 */
export function useVerifyFlow(): UseVerifyFlowResult {
  const [state, setState] = useState<FlowState>(INITIAL_STATE)

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

  const selectDoc = useCallback((docType: DocType) => {
    const newScreens = buildFlow({ docType })
    setState((prev) => ({
      ...prev,
      docType,
      screens: newScreens,
      direction: 1,
      screenIndex: prev.screenIndex + 1,
    }))
  }, [])

  const progress = useMemo(
    () => getProgress(state.screens, currentScreen),
    [state.screens, currentScreen],
  )

  const showProgress = !['welcome', 'success'].includes(currentScreen)

  const showBack = useMemo(() => {
    if (state.retryError) return false
    if (state.screenIndex <= 1) return false
    if (['processing', 'success'].includes(currentScreen)) return false
    return true
  }, [state.retryError, state.screenIndex, currentScreen])

  return {
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
  }
}
