'use client'

interface FaceOverlayProps {
  allGood?: boolean
  /** 0.0 – 1.0 progress for the liveness arc. */
  livenessProgress?: number
  showArc?: boolean
}

/**
 * Oval face cutout for selfie and liveness capture.
 * Uses SVG mask: dark overlay with oval hole.
 * Optional arc traces around the oval when showArc is true.
 */
export function FaceOverlay({
  allGood = false,
  livenessProgress = 0,
  showArc = false,
}: FaceOverlayProps) {
  const W = 220
  const H = 260
  const cx = W / 2
  const cy = H / 2
  const rx = W * 0.45
  const ry = H * 0.47

  // Arc circumference approximation for an ellipse
  const arcCircumference = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2)
  const dashOffset = arcCircumference * (1 - livenessProgress)

  const strokeColor = allGood ? 'var(--success)' : livenessProgress > 0 ? 'var(--accent)' : 'rgba(255,255,255,0.7)'

  return (
    <div
      style={{
        position: 'relative',
        width: W,
        height: H,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
        {/* Dark mask with oval cutout */}
        <defs>
          <mask id="face-mask">
            <rect width={W} height={H} fill="white" />
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="black" />
          </mask>
        </defs>
        <rect width={W} height={H} fill="rgba(0,0,0,0.35)" mask="url(#face-mask)" />

        {/* Oval border */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          stroke={strokeColor}
          strokeWidth={2.5}
          style={{ transition: 'stroke 400ms ease' }}
        />

        {/* Liveness arc */}
        {showArc && (
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            stroke="var(--accent)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={arcCircumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 40ms linear',
              transform: 'rotate(-90deg)',
              transformOrigin: `${cx}px ${cy}px`,
            }}
          />
        )}
      </svg>
    </div>
  )
}
