'use client'

import { useState, useEffect, useRef } from 'react'
import type { DocIssueType } from '@/lib/types'

// Issues resolved one at a time — simulates real camera analysis
const ISSUE_SEQUENCE: DocIssueType[] = ['too_dark', 'too_far', 'partial', 'glare', 'blur']

const ISSUE_DURATIONS: Record<DocIssueType, number> = {
  too_dark: 1600,
  too_far:  1300,
  partial:  1100,
  glare:    1000,
  blur:     900,
}

/** How long the progress ring takes to fill once all issues are resolved */
const AUTO_CAPTURE_DURATION_MS = 1400

export interface DocQualityState {
  /** The single currently-active issue, or null when all resolved */
  activeIssue: DocIssueType | null
  /** How many issues have been resolved so far (0–5) */
  resolvedCount: number
  /** True when all issues resolved */
  allClear: boolean
  /** 0–1: progress ring fill; reaches 1 to trigger auto-capture */
  autoCaptureProgress: number
  reset: () => void
}

/**
 * Simulates progressive document quality analysis.
 *
 * Issues resolve sequentially (one at a time) while `active` is true.
 * Once all resolved, a rAF-driven countdown fills `autoCaptureProgress` to 1.
 * Reset returns to the initial state and re-starts analysis.
 */
export function useDocQuality(active: boolean): DocQualityState {
  const [resolvedCount, setResolvedCount] = useState(0)
  const [autoCaptureProgress, setAutoCaptureProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  const allClear = resolvedCount >= ISSUE_SEQUENCE.length
  const activeIssue: DocIssueType | null = allClear ? null : ISSUE_SEQUENCE[resolvedCount]

  // Resolve the current issue after its duration
  useEffect(() => {
    if (!active || allClear) return
    const duration = ISSUE_DURATIONS[ISSUE_SEQUENCE[resolvedCount]]
    const t = setTimeout(() => setResolvedCount((c) => c + 1), duration)
    return () => clearTimeout(t)
  }, [active, resolvedCount, allClear])

  // Drive auto-capture progress ring with rAF
  useEffect(() => {
    if (!allClear || !active) return
    startRef.current = performance.now()

    function tick(now: number) {
      const elapsed = now - (startRef.current ?? now)
      const p = Math.min(elapsed / AUTO_CAPTURE_DURATION_MS, 1)
      setAutoCaptureProgress(p)
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
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
