import type { ReactNode } from 'react'
import type { BadgeVariant, BadgeSize } from '@/lib/types'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
}

const BG: Record<BadgeVariant, string> = {
  default: 'var(--surface-0)',
  accent:  'var(--accent-muted)',
  success: 'var(--success-muted)',
  warning: 'var(--warning-muted)',
  danger:  'var(--danger-muted)',
}

const COLOR: Record<BadgeVariant, string> = {
  default: 'var(--ink-2)',
  accent:  'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger:  'var(--danger)',
}

const BORDER: Record<BadgeVariant, string> = {
  default: '1px solid var(--border-2)',
  accent:  'none',
  success: 'none',
  warning: 'none',
  danger:  'none',
}

const PADDING: Record<BadgeSize, string> = {
  sm: '2px 7px',
  md: '3px 9px',
}

const FONT_SIZE: Record<BadgeSize, number> = { sm: 10, md: 11 }

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: PADDING[size],
        borderRadius: 'var(--radius-full)',
        fontSize: FONT_SIZE[size],
        fontWeight: 600,
        letterSpacing: '0.2px',
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
        background: BG[variant],
        color: COLOR[variant],
        border: BORDER[variant],
      }}
    >
      {children}
    </span>
  )
}
