/**
 * lib/docSelectConfig.ts
 *
 * Config interface for the country + document selection screen.
 *
 * Today: backed by static constants — identical to previous hardcoded behaviour.
 *
 * Production path:
 *   The session config API returns a `DocSelectConfig`-shaped payload scoped
 *   to the client and the user's jurisdiction. The screen receives it as a prop
 *   and never needs to change when the data source moves to the backend.
 */

import { DOC_TYPES, COUNTRIES } from './constants'
import type { DocTypeConfig } from './constants'

export interface DocSelectConfig {
  /** Ordered list of countries for the dropdown. */
  countries: readonly string[]

  /**
   * Returns the document types available for a given issuing country.
   *
   * Production: filtered per jurisdiction — some countries prohibit non-passport
   * docs for foreign nationals; some restrict residence permits to certain origins.
   * Today: returns the full list for every country (existing behaviour).
   */
  getDocTypes(country: string): DocTypeConfig[]
}

/**
 * Static fallback — mirrors current hardcoded behaviour exactly.
 *
 * Swap this for the API response payload once the backend service layer exists.
 * The screen only depends on the `DocSelectConfig` interface, not this object.
 */
export const defaultDocSelectConfig: DocSelectConfig = {
  countries: COUNTRIES,

  getDocTypes(_country: string): DocTypeConfig[] {
    // TODO: filter by country when real per-jurisdiction config is available
    return DOC_TYPES
  },
}
