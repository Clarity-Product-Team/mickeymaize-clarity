'use client'

import { useState, useEffect } from 'react'
import type { QualityCheck } from '@/lib/types'

interface CheckDef {
  label: string
  okLabel: string
  delayMs: number
}

interface UseQualitySimulationResult {
  checks: QualityCheck[]
  quality: number   // 0–n checks passing
  allGood: boolean
  reset: () => void
}

/**
 * Simulates progressive camera quality analysis.
 * Each check resolves after its `delayMs` when `active` is true.
 * Resets automatically when `active` flips from false → true.
 */
export function useQualitySimulation(
  checkDefs: CheckDef[],
  active: boolean,
): UseQualitySimulationResult {
  const [checks, setChecks] = useState<QualityCheck[]>(() =>
    checkDefs.map(({ label }) => ({ label, ok: false })),
  )

  function reset() {
    setChecks(checkDefs.map(({ label }) => ({ label, ok: false })))
  }

  useEffect(() => {
    if (!active) return

    // Reset on re-activation
    setChecks(checkDefs.map(({ label }) => ({ label, ok: false })))

    const timers = checkDefs.map(({ okLabel, delayMs }, i) =>
      setTimeout(() => {
        setChecks((prev) =>
          prev.map((c, idx) =>
            idx === i ? { label: okLabel, ok: true } : c,
          ),
        )
      }, delayMs),
    )

    return () => timers.forEach(clearTimeout)
    // checkDefs is stable (defined outside the component), so this is safe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const quality = checks.filter((c) => c.ok).length
  const allGood = quality === checks.length

  return { checks, quality, allGood, reset }
}
