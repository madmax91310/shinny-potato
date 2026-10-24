import { BENCHMARK_OPTIONS, RANKING_ASSETS } from './data.js'
import FX from '../../data/monthly-fx.json' with { type: 'json' }
import { buildRanking, commonCoverage } from './engine.js'
import { convertAsset } from './series.js'

import {selectionDates} from './selection-windows.js'
import { isStock } from '../../lib/is-stock.js'
export { isStock }
export function selectionCurrency(ids, currency, assets = RANKING_ASSETS) {
  return currency === 'original' && new Set(ids.map(id => assets[id]?.currency)).size > 1 ? 'EUR' : currency
}
export function toggleAsset(ids, id, currency, assets = RANKING_ASSETS, fx = FX) {
  if (!assets[id]) throw new Error('Cet actif n’est plus disponible.')
  const next = ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]
  if (next.length > 6) throw new Error('Six actifs maximum : décoche une ligne pour en ajouter une autre.')
  const nextCurrency = selectionCurrency(next, currency, assets)
  if (next.length >= 2) commonCoverage(next.map(value => convertAsset(assets[value], nextCurrency, fx)))
  return { ids: next, currency: nextCurrency }
}
export function replaceBenchmark(state, nextId, assets = RANKING_ASSETS, fx = FX) {
  if (!BENCHMARK_OPTIONS.some(option => option.id === nextId)) throw new Error('ETF de référence inconnu.')
  if (state.ids.length !== 6 || state.ids.filter(id => isStock(assets[id])).length !== 5 || !state.ids.includes(state.benchmarkId)) {
    throw new Error('Choisis d’abord une sélection de cinq actions face à un ETF.')
  }
  const ids = state.ids.map(id => id === state.benchmarkId ? nextId : id)
  const currency = selectionCurrency(ids, state.currency, assets)
  const members = ids.map(id => convertAsset(assets[id], currency, fx))
  const coverage = commonCoverage(members)
  let { dates, mode } = state
  let adjusted = false
  try { buildRanking(members, { ...dates, mode }) }
  catch {
    adjusted = true
    mode = coverage.years.length ? 'years' : 'period'
    dates = selectionDates(members)
    buildRanking(members, { ...dates, mode })
  }
  return { ids, currency, dates, mode, benchmarkId: nextId, adjusted }
}
