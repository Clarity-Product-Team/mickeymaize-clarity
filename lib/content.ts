/**
 * lib/content.ts — All user-facing copy for Clarity Verify
 *
 * Edit this file to update tone, language, or translations.
 * No copy lives in screen components directly.
 *
 * Principles: calm · specific · human · never legalistic
 */

import type { DocType, DocIssueType, ErrorType, FaceIssueType } from './types'

// ─── Welcome ──────────────────────────────────────────────────────────────────

export const welcome = {
  badge: 'Secure check',
  heading: 'Verify your\nidentity',
  subheading: "Quick, guided, and done in about two minutes.",
  steps: [
    { label: 'Scan your document', hint: 'Passport or ID card' },
    { label: 'Quick selfie', hint: 'Takes about 10 seconds' },
    { label: "You're verified", hint: 'Safe and instant' },
  ],
  trust: [
    'End-to-end encrypted',
    'GDPR compliant',
  ],
  cta: 'Get started',
  privacyNote: "Your information is encrypted and never sold or shared.",
} as const

// ─── Country & doc select ─────────────────────────────────────────────────────

export const countryDoc = {
  heading: 'Your document',
  subheading: "We'll guide you through scanning it.",
  countryLabel: 'Issuing country',
  journeyHeading: 'Your journey',
  livenessNote: {
    high: '🔴 Presence check required — high-risk jurisdiction',
    medium: '🟡 Presence check required — enhanced verification',
    low: '🔵 Presence check required — compliance rule applies',
  },
  cta: 'Continue',
} as const

// ─── Doc guidance ─────────────────────────────────────────────────────────────

export const docGuidance = {
  heading: 'Before you scan',
  subheading: 'A few seconds of prep makes a big difference.',
  checks: [
    {
      title: 'Good lighting',
      body: 'Lay it on a flat surface with no harsh shadows or glare.',
    },
    {
      title: 'Take it out',
      body: 'Remove it from your wallet, card holder, or sleeve.',
    },
    {
      title: 'All four corners visible',
      body: 'Move back until the whole document fits the frame.',
    },
  ],
  cameraNote: {
    bold: 'Camera access needed.',
    body: "Your browser will ask once. We never record or store your camera feed.",
  },
  ctaDynamic: (label: string) => `Scan my ${label}`,
  ctaDefault: 'Continue',
}

// ─── Doc capture ──────────────────────────────────────────────────────────────

export const docCapture = {
  front: {
    heading: 'Scan the front',
    subheading: (label: string) => `Hold your ${label} flat and inside the frame.`,
  },
  back: {
    heading: 'Now the back',
    subheading: (label: string) => `Flip your ${label} over and hold it steady.`,
  },
  qualityChips: ['Corners visible', 'Text sharp', 'No glare'] as string[],
  stuckNudge: 'Still having trouble? More light and a flatter surface usually help.',
  uploadLabel: 'Upload a photo instead',
  review: {
    heading: 'Looks good — use this?',
    retake: 'Retake',
    confirm: 'Use this photo',
  },
}

// ─── Doc capture instructions (in-camera overlay) ────────────────────────────

export const docInstruction: Record<
  DocIssueType | 'allClear',
  { title: string; sub: string }
> = {
  allClear: {
    title: 'Perfect — capturing now…',
    sub: 'Hold still for just a moment',
  },
  too_dark: {
    title: 'More light needed',
    sub: 'Move to a brighter spot or switch on a nearby light',
  },
  too_far: {
    title: 'Move closer',
    sub: 'Fill the frame — bring the document a bit nearer',
  },
  partial: {
    title: 'Corner out of frame',
    sub: 'Step back until all four edges are visible',
  },
  glare: {
    title: 'Glare on the document',
    sub: 'Tilt it slightly away from the light source',
  },
  blur: {
    title: 'Hold still',
    sub: 'Brace your elbow or rest your hand for a sharper image',
  },
}

// ─── Selfie guidance ──────────────────────────────────────────────────────────

export const selfieGuidance = {
  heading: 'Your selfie',
  subheading: "We'll capture it automatically when everything looks right.",
  tips: [
    { emoji: '☀️', label: 'Face a light source' },
    { emoji: '😌', label: 'Look naturally' },
    { emoji: '👓', label: 'Remove glasses if you can' },
  ],
  privacyNote:
    "Your selfie is only used to match the photo on your document — nothing else.",
  cta: 'Continue',
} as const

// ─── Selfie capture header states ─────────────────────────────────────────────

export const selfieCapture = {
  states: {
    allDone:      { title: 'All done', sub: 'Moving on…' },
    allClear:     { title: 'Hold still…', sub: 'Capturing now' },
    nearClear:    { title: 'Almost there', sub: 'Nearly ready' },
    lookingGood:  { title: 'Looking good', sub: 'Just a couple more adjustments' },
    default:      { title: 'Your selfie', sub: "We'll capture automatically once everything looks good" },
  },
  privacyNote: "Your selfie is only used to match the photo on your document.",
} as const

// ─── Selfie instructions (in-camera overlay) ──────────────────────────────────

export const selfieInstruction: Record<
  FaceIssueType | 'allClear',
  { title: string; sub: string }
> = {
  allClear: {
    title: 'Looks great',
    sub: 'Capturing in just a moment — stay still',
  },
  not_centered: {
    title: 'Center your face',
    sub: 'Look directly at the camera and fill the oval',
  },
  too_far: {
    title: 'Move a bit closer',
    sub: 'Your face should fill most of the oval',
  },
  low_light: {
    title: 'Brighter light needed',
    sub: 'Face a window or light source — avoid backlighting',
  },
  glasses_glare: {
    title: 'Glare on glasses',
    sub: 'Remove them or tilt the frames slightly downward',
  },
  too_close: {
    title: 'A little further back',
    sub: 'Hold your phone a bit further away',
  },
}

// ─── Liveness ─────────────────────────────────────────────────────────────────

export const liveness = {
  heading: 'One quick look',
  subheading: "Confirms it's really you — just look naturally at the camera.",
  status: {
    start:  'Look naturally at the camera',
    steady: 'Hold still…',
    almost: 'Almost done…',
    done:   'All done ✓',
  },
  privacy: {
    short: 'No video is recorded or stored.',
    long:  "This quick check confirms a real person is completing the verification — not a photo.",
  },
  trustBadge: 'Encrypted · GDPR compliant · ISO 27001-certified',
} as const

// ─── Processing ───────────────────────────────────────────────────────────────

export const processing = {
  heading: 'Verifying your identity',
  subheading: 'This usually takes about 10 seconds. Keep this page open.',
  steps: [
    { id: 'read',      label: 'Reading your document',  durationMs: 1400 },
    { id: 'face',      label: 'Comparing your face',    durationMs: 1600 },
    { id: 'authentic', label: 'Verifying authenticity', durationMs: 1500 },
    { id: 'confirm',   label: 'Confirming identity',    durationMs: 1200 },
  ],
  activeLabel: 'In progress',
  trustNote: 'Secured end-to-end · Your data never leaves this device until verified',
} as const

// ─── Success ──────────────────────────────────────────────────────────────────

export const success = {
  heading: "You're verified",
  subheading: "All done. You're all set.",
  metrics: [
    { label: 'Document', status: 'Verified' },
    { label: 'Face match', status: 'Confirmed' },
  ],
  privacyNote:
    "Your information is encrypted and stored securely. It's only used for this verification.",
  cta: 'Continue to app',
} as const

// ─── Retry ────────────────────────────────────────────────────────────────────

export const retryCopy: Record<ErrorType, { title: string; description: string; tip: string }> = {
  blur: {
    title: 'Photo came out blurry',
    description: "The image wasn't sharp enough. Holding your arm steady makes a big difference.",
    tip: 'Brace your elbow against your side or rest it on a surface.',
  },
  glare: {
    title: 'Light reflecting on the document',
    description: 'A reflection is covering part of the text. A slightly different angle should clear it.',
    tip: 'Tilt the document gently or step away from the nearest light source.',
  },
  partial: {
    title: 'Part of the document is cut off',
    description: 'All four corners need to be inside the frame at the same time.',
    tip: 'Move back a little until you can see all edges clearly.',
  },
  wrong_doc: {
    title: "We couldn't read this document",
    description: "The document type doesn't match what you selected earlier.",
    tip: "Tap \"Change document\" below to go back and pick the right type.",
  },
  expired: {
    title: 'Document looks expired',
    description: "We spotted an expiry date that's in the past.",
    tip: "Use a document that's currently valid.",
  },
  face_mismatch: {
    title: "Let's try the selfie again",
    description: "We couldn't confidently match your face to the document. Better lighting usually does the trick.",
    tip: 'Look directly at the camera in a well-lit spot — glasses off if possible.',
  },
}

export const retryActions = {
  tryAgain: 'Try again',
  getHelp: 'Get help instead',
} as const

// ─── Doc type labels ──────────────────────────────────────────────────────────

export const DOC_LABEL: Record<DocType, string> = {
  passport: 'Passport',
  'drivers-license': "Driver's License",
  'national-id': 'National ID',
  'residence-permit': 'Residence Permit',
}

export const DOC_LABEL_LOWER: Record<DocType, string> = {
  passport: 'passport',
  'drivers-license': "driver's license",
  'national-id': 'national ID',
  'residence-permit': 'residence permit',
}
