import type { ReactNode, CSSProperties } from 'react'

interface CameraFrameProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  minHeight?: number
}

/**
 * Simulated camera viewport.
 * Uses --surface-dark: independently re-skinnable from light UI surfaces.
 * Vignette overlay focuses attention on the capture area centre.
 */
export function CameraFrame({
  children,
  className = '',
  style,
  minHeight = 280,
}: CameraFrameProps) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--surface-dark)',
        minHeight,
        ...style,
      }}
    >
      {/* Radial vignette */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)',
          zIndex: 1,
        }}
      />
      {/* Content above vignette */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </div>
    </div>
  )
}
