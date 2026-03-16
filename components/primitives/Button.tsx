'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type React from 'react'
import type { ButtonVariant, ButtonSize } from '@/lib/types'
import { Spinner } from './Spinner'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
  /** Trailing icon — shown after label */
  icon?: ReactNode
  /** Leading icon — shown before label */
  iconLeading?: ReactNode
  type?: 'button' | 'submit' | 'reset'
  ariaLabel?: string
}

const HEIGHT: Record<ButtonSize, number> = { lg: 52, md: 44, sm: 36 }
const FONT_SIZE: Record<ButtonSize, number> = { lg: 15, md: 14, sm: 13 }
const PADDING: Record<ButtonSize, number> = { lg: 24, md: 20, sm: 16 }
const ICON_SIZE: Record<ButtonSize, number> = { lg: 16, md: 15, sm: 13 }

type VariantStyle = {
  default: React.CSSProperties
  hover?: React.CSSProperties
  disabled: React.CSSProperties
}

const VARIANTS: Record<ButtonVariant, VariantStyle> = {
  primary: {
    default: {
      background: 'linear-gradient(160deg, var(--accent) 0%, var(--accent-hover) 100%)',
      color: 'var(--accent-on)',
      border: 'none',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)',
    },
    disabled: { background: 'var(--border-1)', color: 'var(--ink-3)', border: 'none' },
  },
  secondary: {
    default: {
      background: 'var(--surface-1)',
      color: 'var(--accent)',
      border: '1.5px solid var(--border-2)',
    },
    disabled: {
      background: 'var(--surface-1)',
      color: 'var(--ink-3)',
      border: '1.5px solid var(--border-1)',
    },
  },
  ghost: {
    default: { background: 'transparent', color: 'var(--ink-2)', border: 'none' },
    disabled: { background: 'transparent', color: 'var(--ink-3)', border: 'none' },
  },
  danger: {
    default: { background: 'var(--danger)', color: '#ffffff', border: 'none' },
    disabled: { background: 'var(--border-1)', color: 'var(--ink-3)', border: 'none' },
  },
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'lg',
  fullWidth = true,
  loading = false,
  disabled = false,
  icon,
  iconLeading,
  type = 'button',
  ariaLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading
  const v = VARIANTS[variant]
  const baseStyle = isDisabled ? v.disabled : v.default
  const spinnerColor = variant === 'primary' ? '#ffffff' : 'var(--accent)'

  return (
    <motion.button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      whileHover={
        isDisabled ? {} : variant === 'primary'
          ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), var(--shadow-md)' }
          : {}
      }
      transition={{ duration: 0.12 }}
      aria-label={ariaLabel}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: fullWidth ? '100%' : 'auto',
        height: HEIGHT[size],
        padding: `0 ${PADDING[size]}px`,
        fontSize: FONT_SIZE[size],
        fontWeight: 'var(--cv-btn-weight, 600)' as unknown as number,
        letterSpacing: 'var(--cv-btn-ls, -0.1px)',
        textTransform: 'var(--cv-btn-transform, none)' as React.CSSProperties['textTransform'],
        lineHeight: 1,
        whiteSpace: 'nowrap',
        borderRadius: 'var(--cv-btn-radius, var(--radius-md))',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'box-shadow 150ms ease',
        flexShrink: 0,
        ...baseStyle,
      }}
    >
      {iconLeading && !loading && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{iconLeading}</span>
      )}

      {loading && <Spinner size={ICON_SIZE[size]} color={spinnerColor} />}

      <span>{loading ? 'Please wait…' : children}</span>

      {icon && !loading && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      )}
    </motion.button>
  )
}
