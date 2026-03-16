/**
 * lib/theme.ts — Clarity Verify white-label theme system
 *
 * A theme is a plain serialisable object.  Drop one into <ThemeProvider> and
 * every CSS custom property, typography rule, progress style, logo mark, and
 * illustration flag adapts automatically — no component code changes needed.
 *
 * Usage:
 *   import { fintechTheme } from '@/lib/theme'
 *   <ThemeProvider theme={fintechTheme}>…</ThemeProvider>
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ThemeColors {
  /** Primary interactive / brand colour */
  accent:        string
  /** Low-saturation tint of accent (backgrounds, chips) */
  accentMuted:   string
  accentHover:   string
  accentPressed: string
  /** Text/icon colour rendered on an accent-filled surface */
  accentOn:      string

  /** Primary text */
  ink1: string
  /** Secondary text */
  ink2: string
  /**
   * Tertiary / hint text.
   * MUST achieve ≥4.5:1 contrast against surface1 (WCAG AA normal text).
   */
  ink3: string

  /** App shell / page background */
  surface0: string
  /** Card / panel / widget background */
  surface1: string
  /** Camera / media viewport background */
  surfaceDark: string

  border1: string
  border2: string

  success:      string
  successMuted: string
  warning:      string
  warningMuted: string
  danger:       string
  dangerMuted:  string
}

export interface ThemeTypography {
  /**
   * CSS font-family stack.
   * The host app is responsible for loading any custom typefaces;
   * this value is applied verbatim to .verify-card.
   */
  fontFamily: string
  /** h1/h2 font-weight (600–900) */
  headingWeight: number
  /** h1/h2 letter-spacing — e.g. '-0.3px' */
  headingLetterSpacing: string
  /** Primary button font-weight */
  buttonWeight: number
  /** Primary button letter-spacing */
  buttonLetterSpacing: string
  /** 'none' | 'uppercase' — primary button text transform */
  buttonTextTransform: 'none' | 'uppercase'
  /** Whether LABEL-style caps text (e.g. section headings) should be uppercase */
  labelUppercase: boolean
  /** Letter-spacing for label / eyebrow text */
  labelLetterSpacing: string
}

export interface ThemeShape {
  radiusSm:   string
  radiusMd:   string
  radiusLg:   string
  radiusXl:   string
  radius2xl:  string
  radiusFull: string
  /** Border-radius applied to the desktop phone-preview card */
  cardRadius: string
  /** Border-radius applied to primary CTA buttons */
  buttonRadius: string
}

export interface ThemeProgress {
  /**
   * 'bar'  — classic horizontal fill bar (default)
   * 'dots' — one dot per flow step; active dot stretches into a pill
   */
  style: 'bar' | 'dots'
  /**
   * For bar: stroke thickness (e.g. '2px', '3px').
   * For dots: dot diameter.
   */
  height: string
  /** Defaults to accent if omitted */
  activeColor?: string
  /** Defaults to border-1 if omitted */
  trackColor?: string
}

export type LogoMark =
  | 'clarity'                       // built-in Clarity SVG logo
  | { initials: string }            // monogram in a rounded square

export interface ThemeBrand {
  /** Company name shown next to the logo mark */
  name: string
  /** Which logo mark to render in the header */
  logoMark: LogoMark
}

export interface ClarityTheme {
  /** Unique key for the demo switcher */
  key: string
  /** Human-readable label shown in the demo switcher */
  displayName: string
  brand: ThemeBrand
  colors: ThemeColors
  typography: ThemeTypography
  shape: ThemeShape
  progress: ThemeProgress
  /**
   * Controls decorative illustration elements (e.g. the animated face preview
   * on the selfie guidance screen).
   *
   * 'full'    — all illustrations shown (default)
   * 'minimal' — illustrations shown but de-emphasised via color tokens
   * 'none'    — decorative illustrations hidden; functional UI only
   */
  illustrations: 'full' | 'minimal' | 'none'
}

// ─── Token → CSS custom property map ─────────────────────────────────────────

/**
 * Convert a ClarityTheme into a flat `{ '--property': 'value' }` map.
 * Apply to any DOM node — all descendant components inherit via the cascade.
 *
 * Existing component tokens (--accent, --ink-1, --radius-md …) are set here
 * so no component code needs to change when a theme is applied.
 * Brand-new tokens (--cv-*) are added for capabilities not yet in the system.
 */
export function themeToVars(t: ClarityTheme): Record<string, string> {
  const c  = t.colors
  const ty = t.typography
  const s  = t.shape
  const p  = t.progress

  return {
    // ── Colors (match existing component token names exactly) ──────────────
    '--accent':          c.accent,
    '--accent-muted':    c.accentMuted,
    '--accent-hover':    c.accentHover,
    '--accent-pressed':  c.accentPressed,
    '--accent-on':       c.accentOn,

    '--ink-1':           c.ink1,
    '--ink-2':           c.ink2,
    '--ink-3':           c.ink3,

    '--surface-0':       c.surface0,
    '--surface-1':       c.surface1,
    '--surface-dark':    c.surfaceDark,

    '--border-1':        c.border1,
    '--border-2':        c.border2,

    '--success':         c.success,
    '--success-muted':   c.successMuted,
    '--warning':         c.warning,
    '--warning-muted':   c.warningMuted,
    '--danger':          c.danger,
    '--danger-muted':    c.dangerMuted,

    // ── Shape (override the existing radius scale) ─────────────────────────
    '--radius-sm':       s.radiusSm,
    '--radius-md':       s.radiusMd,
    '--radius-lg':       s.radiusLg,
    '--radius-xl':       s.radiusXl,
    '--radius-2xl':      s.radius2xl,
    '--radius-full':     s.radiusFull,

    '--cv-card-radius':   s.cardRadius,
    '--cv-btn-radius':    s.buttonRadius,

    // ── Typography ────────────────────────────────────────────────────────
    '--cv-font':              ty.fontFamily,
    '--cv-heading-weight':    String(ty.headingWeight),
    '--cv-heading-ls':        ty.headingLetterSpacing,
    '--cv-btn-weight':        String(ty.buttonWeight),
    '--cv-btn-ls':            ty.buttonLetterSpacing,
    '--cv-btn-transform':     ty.buttonTextTransform,
    '--cv-label-ls':          ty.labelLetterSpacing,
    '--cv-label-transform':   ty.labelUppercase ? 'uppercase' : 'none',

    // ── Progress indicator ────────────────────────────────────────────────
    '--cv-progress-height':   p.height,
    '--cv-progress-active':   p.activeColor  ?? c.accent,
    '--cv-progress-track':    p.trackColor   ?? c.border1,
  }
}

// ─── Theme presets ────────────────────────────────────────────────────────────

/**
 * THEME 1 — Clarity (default)
 *
 * Clean, trustworthy, modern.  Deep indigo + rounded geometry + Inter.
 * The out-of-box Clarity Verify experience.
 */
export const clarityTheme: ClarityTheme = {
  key: 'clarity',
  displayName: 'Clarity',
  brand: {
    name:     'Clarity',
    logoMark: 'clarity',
  },
  colors: {
    accent:        '#4F5BD5',
    accentMuted:   '#ECEFFE',
    accentHover:   '#3D49C8',
    accentPressed: '#2E3AB8',
    accentOn:      '#FFFFFF',
    ink1:          '#080D1A',
    ink2:          '#4A5568',
    ink3:          '#5E6E82',   // 5.2:1 vs white ✓
    surface0:      '#F4F6FA',
    surface1:      '#FFFFFF',
    surfaceDark:   '#070C1A',
    border1:       '#E6EAF2',
    border2:       '#CDD5E0',
    success:       '#00B37D',
    successMuted:  '#E4F8F2',
    warning:       '#E8A020',
    warningMuted:  '#FEF4E2',
    danger:        '#E5343D',
    dangerMuted:   '#FEE6E7',
  },
  typography: {
    fontFamily:           "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    headingWeight:        700,
    headingLetterSpacing: '-0.2px',
    buttonWeight:         600,
    buttonLetterSpacing:  '-0.1px',
    buttonTextTransform:  'none',
    labelUppercase:       true,
    labelLetterSpacing:   '0.5px',
  },
  shape: {
    radiusSm:     '8px',
    radiusMd:     '12px',
    radiusLg:     '16px',
    radiusXl:     '20px',
    radius2xl:    '24px',
    radiusFull:   '9999px',
    cardRadius:   '44px',
    buttonRadius: '12px',
  },
  progress: {
    style:  'bar',
    height: '3px',
  },
  illustrations: 'full',
}

/**
 * THEME 2 — Apex Capital (premium fintech)
 *
 * Institutional, precise, confident.
 * Cobalt blue + sharp geometry + tight system-ui typography.
 * Think Stripe, Bloomberg, Revolut — high-trust, no fluff.
 *
 * Differentiators:
 *   • Sharper corners across the board (buttonRadius: 6px)
 *   • Uppercase CTA labels (buttonTextTransform: 'uppercase')
 *   • Thinner progress bar (2px) — understated premium feel
 *   • Minimal illustrations — interface over decoration
 *   • All-caps label text
 */
export const fintechTheme: ClarityTheme = {
  key: 'fintech',
  displayName: 'Apex — Fintech',
  brand: {
    name:     'Apex Capital',
    logoMark: { initials: 'AC' },
  },
  colors: {
    accent:        '#0052CC',
    accentMuted:   '#DEEBFF',
    accentHover:   '#0747A6',
    accentPressed: '#0035A3',
    accentOn:      '#FFFFFF',
    ink1:          '#091E42',
    ink2:          '#344563',
    ink3:          '#5A6882',   // 5.6:1 vs white ✓
    surface0:      '#F4F5F7',
    surface1:      '#FFFFFF',
    surfaceDark:   '#060E1E',
    border1:       '#DFE1E6',
    border2:       '#C1C7D0',
    success:       '#00875A',
    successMuted:  '#E3FCEF',
    warning:       '#FF8B00',
    warningMuted:  '#FFFAE6',
    danger:        '#DE350B',
    dangerMuted:   '#FFEBE6',
  },
  typography: {
    fontFamily:           "system-ui, -apple-system, 'Segoe UI', Helvetica, sans-serif",
    headingWeight:        700,
    headingLetterSpacing: '-0.3px',
    buttonWeight:         600,
    buttonLetterSpacing:  '0.4px',
    buttonTextTransform:  'uppercase',
    labelUppercase:       true,
    labelLetterSpacing:   '0.7px',
  },
  shape: {
    radiusSm:     '4px',
    radiusMd:     '6px',
    radiusLg:     '8px',
    radiusXl:     '10px',
    radius2xl:    '12px',
    radiusFull:   '9999px',
    cardRadius:   '20px',
    buttonRadius: '6px',
  },
  progress: {
    style:  'bar',
    height: '2px',
  },
  illustrations: 'minimal',
}

/**
 * THEME 3 — TrustBazaar (consumer marketplace)
 *
 * Warm, approachable, joyful.
 * Sunrise orange + very rounded geometry + bold Inter.
 * Think Airbnb, Etsy, Monzo — human, friendly, inviting.
 *
 * Differentiators:
 *   • Pill-shaped CTA buttons (buttonRadius: 9999px)
 *   • Extra-rounded overall shape (radiusMd: 16px)
 *   • Dot-style step indicator (progress.style: 'dots')
 *   • Heavier heading weight (800) — punchy and warm
 *   • Warm off-white surface colours
 *   • Full illustrations — visual warmth throughout
 */
export const marketplaceTheme: ClarityTheme = {
  key: 'marketplace',
  displayName: 'TrustBazaar — Marketplace',
  brand: {
    name:     'TrustBazaar',
    logoMark: { initials: 'TB' },
  },
  colors: {
    accent:        '#E85D29',
    accentMuted:   '#FFF0EA',
    accentHover:   '#C84F22',
    accentPressed: '#A8411B',
    accentOn:      '#FFFFFF',
    ink1:          '#1A0F0A',
    ink2:          '#593D2B',
    ink3:          '#7A5C48',   // 6.1:1 vs white ✓
    surface0:      '#FFFAF5',
    surface1:      '#FFFFFF',
    surfaceDark:   '#0F0A07',
    border1:       '#F0E4D7',
    border2:       '#DCC4B2',
    success:       '#2D9B6E',
    successMuted:  '#E6F5F0',
    warning:       '#D97706',
    warningMuted:  '#FEF3C7',
    danger:        '#DC2626',
    dangerMuted:   '#FEE2E2',
  },
  typography: {
    fontFamily:           "'Inter', -apple-system, 'Segoe UI', sans-serif",
    headingWeight:        800,
    headingLetterSpacing: '-0.3px',
    buttonWeight:         700,
    buttonLetterSpacing:  '0px',
    buttonTextTransform:  'none',
    labelUppercase:       false,
    labelLetterSpacing:   '0.2px',
  },
  shape: {
    radiusSm:     '10px',
    radiusMd:     '16px',
    radiusLg:     '20px',
    radiusXl:     '24px',
    radius2xl:    '28px',
    radiusFull:   '9999px',
    cardRadius:   '36px',
    buttonRadius: '9999px',  // pill CTA
  },
  progress: {
    style:  'dots',
    height: '8px',
  },
  illustrations: 'full',
}

/** All presets indexed by key — used by the demo switcher */
export const THEMES: Record<string, ClarityTheme> = {
  clarity:     clarityTheme,
  fintech:     fintechTheme,
  marketplace: marketplaceTheme,
}
