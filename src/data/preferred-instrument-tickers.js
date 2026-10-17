import {INSTRUMENT_LISTINGS_BY_ISIN,getPreferredInstrumentListing} from './instrument-listings.js'
// Picker search needs the selected ticker; full listing proofs stay in the detail registry.
export const PREFERRED_INSTRUMENT_TICKERS=Object.fromEntries(Object.keys(INSTRUMENT_LISTINGS_BY_ISIN).map(isin=>[isin,getPreferredInstrumentListing(isin)?.ticker??null]))
export function getPreferredInstrumentTicker(isin) {
 return PREFERRED_INSTRUMENT_TICKERS[isin]??null
}
