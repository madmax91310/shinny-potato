// Canonical Node fallback; Vite projects metadata and selected histories.
export * from './marketHistory.js'
export { ASSETS, MONTHS_FULL } from '../../../data/market-history.js'
export const anniversaryRecords = { isReady:() => true, load:async () => {} }
