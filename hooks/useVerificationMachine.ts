'use client'

import { useReducer, useCallback } from 'react'
import { INITIAL_CONTEXT, type VerificationContext } from '@/features/verification/machine/context'
import { transition } from '@/features/verification/machine/transitions'
import { type VerificationStateName } from '@/features/verification/machine/states'
import { type VerificationEvent } from '@/features/verification/machine/events'
import type { VerificationFlowConfig } from '@/features/verification/config/types'
import type { WelcomeMode } from '@/lib/types'

// ─── Machine state shape ───────────────────────────────────────────────────────

interface MachineSnapshot {
  state:   VerificationStateName
  context: VerificationContext
}

const INITIAL_SNAPSHOT: MachineSnapshot = {
  state:   'idle',
  context: INITIAL_CONTEXT,
}

// ─── Welcome mode derivation ───────────────────────────────────────────────────

/**
 * Derives the WelcomeScreen `mode` prop from the current machine state.
 *
 * Today: always 'fresh' — the machine always starts in `idle` and there is no
 * session-resume detection yet. The derivation hook-up is intentional; once
 * session persistence is added, this function will return 'resume' or 'restart'
 * based on machine state or context without any changes to WelcomeScreen.
 */
function deriveWelcomeMode(state: VerificationStateName): WelcomeMode {
  // Future: 'idle' with a persisted sessionId → 'resume'
  // Future: 'idle' reached via RESTART event → 'restart'
  switch (state) {
    case 'idle':
    case 'intro':
      return 'fresh'
    default:
      return 'fresh'
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseVerificationMachineResult {
  /** Current machine state name. */
  machineState:   VerificationStateName
  /** Current machine context (session data, captures, outcomes, etc.). */
  machineContext: VerificationContext
  /** Dispatch an event to the machine. No-ops for invalid transitions. */
  dispatch:       (event: VerificationEvent) => void
  /**
   * Derived welcome screen mode.
   * Kept here so callers don't have to duplicate the derivation.
   */
  welcomeMode:    WelcomeMode
}

export function useVerificationMachine(config: VerificationFlowConfig): UseVerificationMachineResult {
  const [snapshot, dispatch] = useReducer(
    (snapshot: MachineSnapshot, event: VerificationEvent): MachineSnapshot => {
      const result = transition(snapshot.state, event, snapshot.context, config)
      if (!result) return snapshot
      return {
        state:   result.state,
        context: result.contextPatch
          ? { ...snapshot.context, ...result.contextPatch }
          : snapshot.context,
      }
    },
    INITIAL_SNAPSHOT,
  )

  const stableDispatch = useCallback(
    (event: VerificationEvent) => dispatch(event),
    [],
  )

  return {
    machineState:   snapshot.state,
    machineContext: snapshot.context,
    dispatch:       stableDispatch,
    welcomeMode:    deriveWelcomeMode(snapshot.state),
  }
}
