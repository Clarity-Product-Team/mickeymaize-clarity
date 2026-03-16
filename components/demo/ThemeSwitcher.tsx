'use client'

import { motion } from 'framer-motion'
import { Palette } from 'lucide-react'
import { THEMES } from '@/lib/theme'
import type { ClarityTheme } from '@/lib/theme'

interface ThemeSwitcherProps {
  activeKey: string
  onChange: (theme: ClarityTheme) => void
}

/**
 * Demo-only floating pill that lets you switch between theme presets.
 * Positioned above the FlowInspector (bottom-left on desktop, top-left on mobile).
 */
export function ThemeSwitcher({ activeKey, onChange }: ThemeSwitcherProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 8px 6px 10px',
        background: 'rgba(8, 13, 26, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 9999,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <Palette size={13} style={{ color: 'rgba(255,255,255,0.5)', flexShrink: 0 }} />

      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500, marginRight: 2 }}>
        Theme
      </span>

      {Object.values(THEMES).map((theme) => {
        const isActive = theme.key === activeKey
        return (
          <motion.button
            key={theme.key}
            onClick={() => onChange(theme)}
            whileTap={{ scale: 0.93 }}
            aria-pressed={isActive}
            aria-label={`Switch to ${theme.displayName} theme`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 9999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
              background: isActive ? 'rgba(255,255,255,0.14)' : 'transparent',
              transition: 'background 0.15s ease, color 0.15s ease',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Accent swatch */}
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: theme.colors.accent,
                flexShrink: 0,
                boxShadow: isActive ? `0 0 0 2px rgba(255,255,255,0.25)` : 'none',
                transition: 'box-shadow 0.15s ease',
              }}
            />
            {theme.displayName}
          </motion.button>
        )
      })}
    </motion.div>
  )
}
