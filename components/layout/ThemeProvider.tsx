'use client'

import { createContext, useContext, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { themeToVars, clarityTheme } from '@/lib/theme'
import type { ClarityTheme } from '@/lib/theme'

// ─── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ClarityTheme>(clarityTheme)

export function useTheme(): ClarityTheme {
  return useContext(ThemeContext)
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  theme: ClarityTheme
  children: ReactNode
}

/**
 * Injects a ClarityTheme as CSS custom properties onto a wrapper div,
 * then makes the theme object available to any descendant via useTheme().
 *
 * Uses `display: contents` so the wrapper div is invisible to layout —
 * flex/grid parents see the children directly, just as if the wrapper
 * weren't there.  CSS cascade still flows through it normally.
 */
export function ThemeProvider({ theme, children }: ThemeProviderProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Apply / update CSS custom properties whenever the theme changes
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const vars = themeToVars(theme)
    for (const [prop, value] of Object.entries(vars)) {
      el.style.setProperty(prop, value)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={theme}>
      {/* display:contents makes this wrapper layout-transparent */}
      <div ref={ref} style={{ display: 'contents' }}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}
