import type { ReactNode, ElementType } from 'react'
import type { NoticeVariant } from '@/lib/types'

interface NoticeBoxProps {
  variant?: NoticeVariant
  /** Lucide icon component */
  icon?: ElementType
  title?: string
  children: ReactNode
}

const STYLES: Record<NoticeVariant, { bg: string; bar: string; titleColor: string; textColor: string }> = {
  info:    { bg: 'var(--accent-muted)',   bar: 'var(--accent)',   titleColor: 'var(--accent)',   textColor: 'var(--accent)' },
  success: { bg: 'var(--success-muted)',  bar: 'var(--success)',  titleColor: 'var(--success)',  textColor: 'var(--ink-2)' },
  warning: { bg: 'var(--warning-muted)',  bar: 'var(--warning)',  titleColor: 'var(--warning)',  textColor: 'var(--ink-2)' },
  danger:  { bg: 'var(--danger-muted)',   bar: 'var(--danger)',   titleColor: 'var(--danger)',   textColor: 'var(--ink-2)' },
}

export function NoticeBox({ variant = 'info', icon: Icon, title, children }: NoticeBoxProps) {
  const s = STYLES[variant]
  return (
    <div
      role="note"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '11px 14px',
        borderRadius: 'var(--radius-md)',
        borderLeft: `3px solid ${s.bar}`,
        background: s.bg,
      }}
    >
      {Icon && (
        <Icon
          size={14}
          style={{ color: s.titleColor, marginTop: 1, flexShrink: 0 }}
          strokeWidth={2}
        />
      )}
      <div style={{ flex: 1 }}>
        {title && (
          <p
            style={{
              margin: '0 0 2px',
              fontSize: 12,
              fontWeight: 600,
              color: s.titleColor,
            }}
          >
            {title}
          </p>
        )}
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 400,
            color: s.textColor,
            lineHeight: 1.55,
          }}
        >
          {children}
        </p>
      </div>
    </div>
  )
}
