import type { FlowContext, FlowResolution, FlowRule, FlowScreenId, DeviceType } from './types'

/**
 * Base flow — the minimal set of screens present in every verification journey.
 *
 * Rules insert or remove screens from this list. The base flow intentionally
 * contains both guidance screens (doc-guidance, selfie-guidance) so that
 * streamlining rules remove them rather than other rules needing to add them.
 *
 * Production: this list would live in a versioned server-side config, varying
 * per client/product line. Changes go through review and are rolled out with
 * feature flags.
 */
const BASE_FLOW: FlowScreenId[] = [
  'welcome',
  'country-doc',
  'doc-guidance',
  'doc-capture-front',
  'selfie-guidance',
  'selfie-capture',
  'processing',
  'success',
]

/**
 * Evaluates all flow rules against the given context and returns a resolved
 * screen list plus a record of which rules applied.
 *
 * Rules are applied in definition order. The engine is idempotent:
 *   - Inserting a screen that is already present → no-op
 *   - Removing a screen that is already absent  → no-op
 *
 * Production scaling:
 *   - Rules are fetched from a config service, cached per session
 *   - Rule sets are versioned; old sessions keep their evaluated flow
 *   - A/B test variants inject alternate rule sets at evaluation time
 *   - Every AppliedRule is written to an audit log per verification session
 *   - A shadow evaluator runs new rules in read-only mode before activation
 */
export function evaluateFlow(ctx: FlowContext, rules: FlowRule[]): FlowResolution {
  let screens = [...BASE_FLOW]
  const appliedRules = []

  for (const rule of rules) {
    if (!rule.condition(ctx)) continue

    appliedRules.push({
      id: rule.id,
      label: rule.label,
      description: rule.description,
      tags: rule.tags,
    })

    const { type, screen, anchor } = rule.effect

    if (type === 'remove') {
      screens = screens.filter((s) => s !== screen)
    } else if ((type === 'insert_after' || type === 'insert_before') && anchor) {
      if (!screens.includes(screen)) {
        const idx = screens.indexOf(anchor)
        if (idx !== -1) {
          const insertAt = type === 'insert_after' ? idx + 1 : idx
          screens.splice(insertAt, 0, screen)
        }
      }
    }
  }

  return {
    screens,
    appliedRules,
    context: ctx,
    flags: {
      requiresBackCapture: screens.includes('doc-capture-back'),
      requiresLiveness: screens.includes('liveness'),
      isStreamlined:
        !screens.includes('doc-guidance') && !screens.includes('selfie-guidance'),
    },
  }
}

/**
 * Detects device type from viewport width.
 * Returns 'mobile' during SSR (safe default — the camera flow works on mobile).
 */
export function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'mobile'
  return window.innerWidth < 768 ? 'mobile' : 'desktop'
}
