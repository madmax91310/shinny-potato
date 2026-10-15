import { COMPANIES } from './companies.js'

// This projection is also used for the browser's comparable-company inputs.
export function peerRecord({ id, name, symbol, currency, annual, quote, targetForecast }) {
  return { id, name, symbol, currency, annual: { end: annual?.end },
    quote: { price: quote?.price, asOf: quote?.asOf, splits: quote?.splits }, targetForecast }
}
export const COMPANY_PEERS = COMPANIES.map(peerRecord)
