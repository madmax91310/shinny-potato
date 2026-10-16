import { ASSETS } from './market-history.js'
export * from './market-history.js'
export async function ensureCalculatorAsset(id) { return ASSETS[id] }
