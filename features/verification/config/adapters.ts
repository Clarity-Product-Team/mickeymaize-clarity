import { DOC_TYPES } from '@/lib/constants'
import type { DocTypeConfig } from '@/lib/constants'
import type { DocSelectConfig } from '@/lib/docSelectConfig'
import type { VerificationFlowConfig } from './types'

// ─── Description fallback ──────────────────────────────────────────────────────
//
// DocumentTypeConfig (the new type) does not carry a UI description string —
// that responsibility belongs to the display layer. We fall back to the
// existing descriptions in DOC_TYPES rather than duplicating them.

const DOC_DESCRIPTIONS: Partial<Record<string, string>> = Object.fromEntries(
  DOC_TYPES.map((d) => [d.id, d.description]),
)

// ─── Adapter ───────────────────────────────────────────────────────────────────

/**
 * Converts a `VerificationFlowConfig` into the `DocSelectConfig` interface
 * consumed by `CountryDocSelectScreen`.
 *
 * This bridges the new session-config layer to the screen's existing prop
 * contract without rewriting the screen. The adapter is the only place that
 * knows about both shapes.
 *
 * Country-scoped document filtering:
 *   A document is available for a given country if its `supportedCountries`
 *   list is absent/empty (accepted everywhere) OR explicitly includes the
 *   selected country name or ISO code.
 *
 * Description strings fall back to the existing DOC_TYPES entries so that
 * UI copy stays in one place.
 */
export function docSelectConfigFromFlowConfig(
  flowConfig: VerificationFlowConfig,
): DocSelectConfig {
  const countries = flowConfig.supportedCountries.map((c) => c.name)

  function getDocTypes(country: string): DocTypeConfig[] {
    // Find the SupportedCountry entry so we can also match by ISO code.
    const countryEntry = flowConfig.supportedCountries.find((c) => c.name === country)
    const isoCode = countryEntry?.isoCode

    return flowConfig.supportedDocuments
      .filter((doc) => {
        // No country restriction → available everywhere in this flow.
        if (!doc.supportedCountries || doc.supportedCountries.length === 0) return true
        // Match by display name or ISO code.
        return (
          doc.supportedCountries.includes(country) ||
          (isoCode !== undefined && doc.supportedCountries.includes(isoCode))
        )
      })
      .map((doc): DocTypeConfig => ({
        id:                 doc.docType,
        label:              doc.label,
        description:        DOC_DESCRIPTIONS[doc.docType] ?? '',
        sides:              doc.capture.backSideRequired ? 2 : 1,
        requiresBackCapture: doc.capture.backSideRequired,
      }))
  }

  return { countries, getDocTypes }
}
