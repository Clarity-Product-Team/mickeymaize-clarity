import type { FlowRule, DocType } from './types'
import { HIGH_RISK_COUNTRIES, MEDIUM_RISK_COUNTRIES } from './riskData'

/**
 * Flow rules — each rule has a condition and a single atomic effect.
 *
 * Rules are applied in definition order by evaluateFlow(). Because inserting
 * a screen that already exists is a no-op, multiple rules can target the same
 * screen (e.g. liveness) without producing duplicates.
 *
 * Production scaling:
 *   - Rules live in a config database with full version history
 *   - New rules go through: compliance sign-off → product review → eng review
 *   - Rules can be toggled per client/region without a code deployment
 *   - A shadow evaluator runs candidate rules in read-only mode for testing
 *   - Conversion metrics are tracked per rule to measure friction impact
 */
export const FLOW_RULES: FlowRule[] = [

  // ── Document structure ───────────────────────────────────────────────────────
  {
    id: 'two-sided-doc',
    label: 'Two-sided document',
    description:
      "Driver's licenses, national IDs, and residence permits carry data (barcode/MRZ) on both sides. Back-side capture is required for complete data extraction.",
    tags: ['document'],
    condition: (ctx) =>
      (['drivers-license', 'national-id', 'residence-permit'] as DocType[]).includes(ctx.docType),
    effect: { type: 'insert_after', screen: 'doc-capture-back', anchor: 'doc-capture-front' },
  },

  // ── Streamlining rules ───────────────────────────────────────────────────────
  {
    id: 'passport-streamlined',
    label: 'Passport + low risk → doc guidance skipped',
    description:
      'Low-risk passport holders skip the document preparation screen. Passports are single-page and familiar; inline camera guidance is sufficient. Reduces flow by ~15 s.',
    tags: ['document', 'ux'],
    condition: (ctx) => ctx.docType === 'passport' && ctx.riskLevel === 'low',
    effect: { type: 'remove', screen: 'doc-guidance' },
  },
  {
    id: 'low-risk-selfie-streamlined',
    label: 'Low risk + passport → selfie guidance skipped',
    description:
      'Minimal-friction path for verified low-risk passport users on mobile. Inline SelfieInstruction replaces the separate guidance step, cutting one screen.',
    tags: ['ux', 'risk'],
    condition: (ctx) =>
      ctx.docType === 'passport' && ctx.riskLevel === 'low' && ctx.deviceType === 'mobile',
    effect: { type: 'remove', screen: 'selfie-guidance' },
  },
  {
    id: 'desktop-skip-selfie-guidance',
    label: 'Desktop → selfie guidance skipped',
    description:
      'Desktop users receive inline instructions in the capture screen. A separate guidance step creates unnecessary page navigation for non-mobile visitors.',
    tags: ['ux', 'device'],
    condition: (ctx) => ctx.deviceType === 'desktop',
    effect: { type: 'remove', screen: 'selfie-guidance' },
  },

  // ── Risk-based liveness ──────────────────────────────────────────────────────
  {
    id: 'medium-risk-liveness',
    label: 'Medium risk → liveness required',
    description:
      'Medium-risk profiles require passive liveness to confirm physical presence and prevent photo/replay attacks at a proportionate cost to the user.',
    tags: ['risk'],
    condition: (ctx) => ctx.riskLevel === 'medium',
    effect: { type: 'insert_before', screen: 'liveness', anchor: 'processing' },
  },
  {
    id: 'high-risk-liveness',
    label: 'High risk → liveness required',
    description:
      'High-risk profiles require liveness verification as a mandatory fraud prevention control. Non-negotiable regardless of document type.',
    tags: ['risk', 'compliance'],
    condition: (ctx) => ctx.riskLevel === 'high',
    effect: { type: 'insert_before', screen: 'liveness', anchor: 'processing' },
  },

  // ── Country / Compliance ─────────────────────────────────────────────────────
  {
    id: 'high-risk-country-liveness',
    label: 'High-risk country → compliance liveness',
    description:
      "Users from FATF-monitored high-risk jurisdictions must complete liveness regardless of individual profile risk. Required by AML policy and can't be waived.",
    tags: ['compliance'],
    condition: (ctx) => HIGH_RISK_COUNTRIES.has(ctx.country),
    effect: { type: 'insert_before', screen: 'liveness', anchor: 'processing' },
  },
  {
    id: 'medium-risk-country-liveness',
    label: 'Medium-risk country → compliance liveness',
    description:
      'Users from FATF Increased Monitoring countries require liveness for additional assurance per regional compliance requirements.',
    tags: ['compliance'],
    condition: (ctx) =>
      MEDIUM_RISK_COUNTRIES.has(ctx.country) && ctx.riskLevel === 'low',
    effect: { type: 'insert_before', screen: 'liveness', anchor: 'processing' },
  },
  {
    id: 'residence-permit-eu-aml',
    label: 'Residence permit → EU 5AMLD liveness',
    description:
      "EU 5th Anti-Money Laundering Directive (5AMLD) requires biometric liveness for residence permit verification in regulated sectors. Applies when risk rules haven't already triggered liveness.",
    tags: ['compliance'],
    condition: (ctx) =>
      ctx.docType === 'residence-permit' &&
      ctx.riskLevel === 'low' &&
      !HIGH_RISK_COUNTRIES.has(ctx.country) &&
      !MEDIUM_RISK_COUNTRIES.has(ctx.country),
    effect: { type: 'insert_before', screen: 'liveness', anchor: 'processing' },
  },
]

// ── Demo scenarios ────────────────────────────────────────────────────────────

export interface DemoScenario {
  id: string
  emoji: string
  label: string
  description: string
  docType: DocType
  country: string
  /** Number of flow screens (excluding welcome/success/processing) — shown in inspector */
  hint: string
}

/**
 * Pre-built demo scenarios for the Flow Inspector.
 * These make it easy to show different flow paths during a prototype walkthrough.
 */
export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'fast-track',
    emoji: '⚡',
    label: 'Fast Track',
    description: 'Passport · UK · Low risk',
    hint: 'Shortest path',
    docType: 'passport',
    country: 'United Kingdom',
  },
  {
    id: 'standard',
    emoji: '📋',
    label: 'Standard',
    description: "Driver's license · Germany",
    hint: '+Back capture',
    docType: 'drivers-license',
    country: 'Germany',
  },
  {
    id: 'enhanced',
    emoji: '🔍',
    label: 'Enhanced',
    description: 'National ID · Nigeria · Medium risk',
    hint: '+Liveness',
    docType: 'national-id',
    country: 'Nigeria',
  },
  {
    id: 'full-compliance',
    emoji: '🛡️',
    label: 'Compliance',
    description: 'Residence permit · Iran · High risk',
    hint: '+Back +Liveness',
    docType: 'residence-permit',
    country: 'Iran',
  },
]
