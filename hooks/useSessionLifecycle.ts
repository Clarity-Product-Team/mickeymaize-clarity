'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { MutableRefObject } from 'react'
import type { VerificationService } from '@/features/verification/services/service'
import type { BackendRequiredStep } from '@/features/verification/services/types'
import type { VerificationEvent } from '@/features/verification/machine/events'
import { mapFetchStatusToEvent, shouldContinuePolling } from '@/features/verification/services/mapping'

// ─── Session persistence ──────────────────────────────────────────────────────
//
// sessionStorage (not localStorage): session IDs survive browser refresh but
// not tab close. Cleared when a terminal result is received so that the next
// visit starts fresh. Errors are swallowed — private browsing may block storage.

const SESSION_KEY = 'cv_session_id'

export function persistSessionId(sessionId: string): void {
  if (typeof window === 'undefined') return
  try { sessionStorage.setItem(SESSION_KEY, sessionId) } catch { /* blocked */ }
}

export function clearPersistedSession(): void {
  if (typeof window === 'undefined') return
  try { sessionStorage.removeItem(SESSION_KEY) } catch { /* blocked */ }
}

function readPersistedSessionId(): string | null {
  if (typeof window === 'undefined') return null
  try { return sessionStorage.getItem(SESSION_KEY) } catch { return null }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseSessionLifecycleOptions {
  service: VerificationService
  /**
   * Ref that holds the live session ID. The hook reads from it when starting
   * the poll loop and writes to it on a successful resume.
   */
  sessionIdRef: MutableRefObject<string | null>
  /** Dispatch a machine event. */
  machineDispatch: (event: VerificationEvent) => void
  /**
   * Called after a successful resumeSession() resolves.
   * Receives the next required step (null if all steps already submitted).
   * The caller should navigate the UI to the appropriate capture screen.
   */
  onResumed: (nextStep: BackendRequiredStep | null) => void
  /**
   * Called when the poll loop receives a terminal backend result.
   * The caller should advance the UI to the outcome screen.
   */
  onOutcomeReady: () => void
}

export interface UseSessionLifecycleResult {
  /** True while the in-flight resumeSession() call on mount is pending. */
  isResuming: boolean
  /**
   * Begin polling fetchStatus() for the final verification result.
   *
   * This should be called when the processing-screen animation completes.
   * It dispatches CONTINUE to advance the machine to awaiting_backend_result,
   * then polls the backend until a terminal result is received, dispatches
   * the appropriate machine event, and calls onOutcomeReady().
   */
  beginPolling: () => void
}

// ─── Poll timing ──────────────────────────────────────────────────────────────
//
// First poll fires immediately after beginPolling() so the result arrives as
// soon as the backend is ready. Subsequent polls use a longer interval to
// avoid hammering the API while the async pipeline runs.

const FIRST_POLL_DELAY_MS  = 0
const RETRY_POLL_DELAY_MS  = 2_500

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSessionLifecycle({
  service,
  sessionIdRef,
  machineDispatch,
  onResumed,
  onOutcomeReady,
}: UseSessionLifecycleOptions): UseSessionLifecycleResult {

  const [isResuming, setIsResuming] = useState(false)

  // Tracks whether the poll loop is active. Used to prevent double-start and
  // to cleanly abort when the component unmounts.
  const pollingActiveRef = useRef(false)
  const pollTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      pollingActiveRef.current = false
      if (pollTimerRef.current !== null) clearTimeout(pollTimerRef.current)
    }
  }, [])

  // ── Resume: check sessionStorage on mount ────────────────────────────────
  useEffect(() => {
    const storedId = readPersistedSessionId()
    if (!storedId) return

    setIsResuming(true)

    service.resumeSession({ sessionId: storedId }).then((res) => {
      setIsResuming(false)

      if (!res.ok) {
        // Session expired or not found (e.g. page reload clears in-memory mock).
        // Clear storage so the next visit starts fresh.
        clearPersistedSession()
        return
      }

      sessionIdRef.current = res.data.session.sessionId
      persistSessionId(res.data.session.sessionId)
      machineDispatch({ type: 'RESUME', sessionId: res.data.session.sessionId })
      onResumed(res.data.nextStep ?? null)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally runs only on mount

  // ── Poll loop ─────────────────────────────────────────────────────────────
  const beginPolling = useCallback(() => {
    const sessionId = sessionIdRef.current
    if (!sessionId)               return
    if (pollingActiveRef.current) return // guard against double-start

    // Advance the machine: processing → awaiting_backend_result
    machineDispatch({ type: 'CONTINUE' })
    pollingActiveRef.current = true

    async function poll() {
      if (!pollingActiveRef.current) return

      const currentId = sessionIdRef.current
      if (!currentId) return

      const res = await service.fetchStatus({ sessionId: currentId })

      // Abort if the hook was cleaned up while the request was in flight.
      if (!pollingActiveRef.current) return

      if (!res.ok) {
        // Transient error — retry after the normal interval.
        pollTimerRef.current = setTimeout(poll, RETRY_POLL_DELAY_MS)
        return
      }

      const event = mapFetchStatusToEvent(res.data)

      if (event !== null) {
        // Terminal or actionable result: dispatch to machine and stop polling.
        machineDispatch(event)
        pollingActiveRef.current = false
        clearPersistedSession()
        onOutcomeReady()
        return
      }

      // Still processing or validating — schedule next poll.
      if (shouldContinuePolling(res.data.status)) {
        pollTimerRef.current = setTimeout(poll, RETRY_POLL_DELAY_MS)
      }
    }

    pollTimerRef.current = setTimeout(poll, FIRST_POLL_DELAY_MS)
  }, [service, sessionIdRef, machineDispatch, onOutcomeReady])

  return { isResuming, beginPolling }
}
