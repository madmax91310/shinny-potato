import { BENCHMARK_CATEGORIES, CATEGORIES, RANKING_ASSETS } from './data.js'
import FX from '../../data/monthly-fx.json' with { type: 'json' }
import { commonCoverage } from './engine.js'
import { convertAsset } from './series.js'
import {qualifiedYearWindow} from './selection-windows.js'
import { isStock } from '../../lib/is-stock.js'

export function markBenchmark(assets, benchmarkId) {
  const valid = assets.length === 6 && assets.filter(isStock).length === 5
  return assets.map(a => valid && a.id === benchmarkId
    ? { ...a, benchmark: true, shortLabel: `ETF ${a.shortLabel} (réf.)` } : a)
}

// Curated equity universes only. No return or winning asset influences the draw.
export const EQUITY_GROUPS = new Set(['world', 'europe', 'factors', 'europe-sectors', 'world-sectors',
  'themes', 'themes-eur', 'dividends', 'small-value', 'us-stocks', 'us-semiconductors',
  'us-software', 'payments-finance', 'health-stocks', 'europe-industry', 'us-consumer',
  'fr-stocks', 'luxury-stocks', 'aerospace-defense', 'everyday-brands', 'ai-infrastructure',
  'europe-finance', 'us-equity-etfs', 'technology-etfs', 'small-cap-regions',
  ...CATEGORIES.filter(c => c.ids.every(id => isStock(RANKING_ASSETS[id]))).map(c => c.id)])

export function suggestionPool(categories = [...CATEGORIES, ...BENCHMARK_CATEGORIES], assets = RANKING_ASSETS, fx = FX) {
  return categories.flatMap(category => {
    if (!EQUITY_GROUPS.has(category.id) && !category.benchmarkId) return []
    try {
      const members = category.ids.map(id => convertAsset(assets[id], 'EUR', fx))
      if (members.some(a => a.basis !== 'adjusted')) return []
      const raw = commonCoverage(members)
      const coverage = {...raw,years:qualifiedYearWindow(raw.years,3,Infinity)}
      return coverage.years.length >= 3 ? [{ category, coverage }] : []
    } catch { return [] } // Missing prices/FX never produce a broken suggestion.
  })
}

const POOL = suggestionPool()
export function randomSuggestion(currentId, random = Math.random, pool = POOL, maximumYears = 10) {
  const candidates = pool.filter(item => item.category.id !== currentId)
  if (!candidates.length) throw new Error('Aucune autre sélection avec trois années communes disponibles.')
  const pick = items => items[Math.min(items.length - 1, Math.max(0, Math.floor(random() * items.length)))]
  const { category, coverage } = pick(candidates)
  const length = pick([3, 5, 10].filter(n => n <= coverage.years.length && n <= maximumYears))
  const startYear = coverage.years.at(-length), endYear = coverage.years.at(-1)
  return { category, currency: 'EUR', mode: 'years',
    dates: { startYear, endYear, start: `${startYear - 1}-12`, end: `${endYear}-12` } }
}

