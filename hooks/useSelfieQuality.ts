'use client'

import { useState, useEffect, useRef } from 'react'
import type { FaceIssueType } from '@/lib/types'

// Issues resolved one at a time — simulates real-time face analysis
const ISSUE_SEQUENCE: FaceIssueType[] = [
  'not_centered',
  'too_far',
  'low_light',
  'glasses_glare',
  'too_close',
]

const ISSUE_DURATIONS: Record<FaceIssueType, number> = {
  not_centered:  1400,
  too_far:       1200,
  low_light:     1000,
  glasses_glare: 900,
  too_close:     800,
}

/** How long the auto-capture countdown lasts once all issues resolve */
const AUTO_CAPTURE_DURATION_MS = 1200

export interface SelfieQualityState {
  activeIssue: FaceIssueType | null
  resolvedCount: number
  allClear: boolean
  /** 0–1 progress ring; reaches 1 to trigger auto-capture */
  autoCaptureProgress: number
  reset: () => void
}

export function useSelfieQuality(active: boolean): SelfieQualityState {
  const [resolvedCount, setResolvedCount] = useState(0)
  const [autoCaptureProgress, setAutoCaptureProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  const allClear = resolvedCount >= ISSUE_SEQUENCE.length
  const activeIssue: FaceIssueType | null = allClear ? null : ISSUE_SEQUENCE[resolvedCount]

  // Resolve the current issue after its duration
  useEffect(() => {
    if (!active || allClear) return
    const duration = ISSUE_DURATIONS[ISSUE_SEQUENCE[resolvedCount]]
    const t = setTimeout(() => setResolvedCount((c) => c + 1), duration)
    return () => clearTimeout(t)
  }, [active, resolvedCount, allClear])

  // rAF-driven auto-capture countdown
  useEffect(() => {
    if (!allClear || !active) return
    startRef.current = performance.now()

    function tick(now: number) {
      const elapsed = now - (startRef.current ?? now)
      const p = Math.min(elapsed / AUTO_CAPTURE_DURATION_MS, 1)
      setAutoCaptureProgress(p)
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [allClear, active])

  function reset() {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    setResolvedCount(0)
    setAutoCaptureProgress(0)
    startRef.current = null
  }

  return { activeIssue, resolvedCount, allClear, autoCaptureProgress, reset }
}
