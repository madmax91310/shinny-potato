import { getInstrumentName } from './instruments.js'
import { getPreferredInstrumentListing } from './instrument-listings.js'

// The same exact-share identities remain searchable through editorial selections.
export function selectionSearch(isins = []) {
  return isins.map(isin => [isin, getInstrumentName(isin), getPreferredInstrumentListing(isin)?.ticker].filter(Boolean).join(' ')).join(' ')
}
