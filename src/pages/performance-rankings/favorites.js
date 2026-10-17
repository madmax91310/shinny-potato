import { ALL_CATEGORIES, ANNUAL_ASSETS, BENCHMARK_OPTIONS, RANKING_ASSETS } from './data.js'
import { markBenchmark } from './suggestions.js'
import FX from '../../data/monthly-fx.json' with { type: 'json' }
import { buildRanking } from './engine.js'
import { convertAsset } from './series.js'
import { isStock } from './selection.js'

export const FAVORITES_KEY = 'el-ranking-favorites-v1'
const SOURCES = { ...RANKING_ASSETS, ...ANNUAL_ASSETS }
export function validateFavoriteSelection(input, sources = SOURCES) {
  if (!input || !Array.isArray(input.ids) || input.ids.length < 2 || input.ids.length > 6 ||
    new Set(input.ids).size !== input.ids.length || input.ids.some(id => typeof id !== 'string' || !Object.hasOwn(sources, id)) ||
    !['original', 'EUR', 'USD'].includes(input.currency) || !['monthly', 'annual'].includes(input.bank) ||
    !['year', 'years', 'period'].includes(input.mode) || typeof input.title !== 'string' || !input.title.trim() || input.title.length > 85 ||
    !input.dates || typeof input.dates !== 'object') throw new Error('Ce favori contient une sélection invalide ou des actifs indisponibles.')
  const dates = { start: input.dates.start, end: input.dates.end, startYear: input.dates.startYear, endYear: input.dates.endYear }
  const benchmarkId = input.benchmarkId || ''
  if (benchmarkId && (!BENCHMARK_OPTIONS.some(option => option.id === benchmarkId) || !input.ids.includes(benchmarkId) ||
    input.ids.filter(id => isStock(sources[id])).length !== 5 || input.ids.length !== 6)) throw new Error('La référence ETF de ce favori n’est plus valide.')
  const members = input.ids.map(id => convertAsset(sources[id], input.currency, FX))
  if (members.some(a => (a.frequency === 'annual') !== (input.bank === 'annual'))) throw new Error('Le type d’historique de ce favori est invalide.')
  buildRanking(markBenchmark(members, benchmarkId), { ...dates, mode: input.mode })
  return { ids: [...input.ids], title: input.title, currency: input.currency, bank: input.bank, mode: input.mode, dates, benchmarkId,
    categoryId: ALL_CATEGORIES.some(c => c.id === input.categoryId) ? input.categoryId : 'world' }
}
export function readFavorites(storage) {
  const raw = storage.getItem(FAVORITES_KEY)
  if (!raw) return []
  const data = JSON.parse(raw)
  if (data?.version !== 1 || !Array.isArray(data.items) || data.items.length > 50 || data.items.some(item =>
    !item || typeof item.id !== 'string' || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 80 || !item.selection) ||
    new Set(data.items.map(item => item.id)).size !== data.items.length) throw new Error('Les favoris enregistrés sont illisibles. Leur contenu a été conservé.')
  return data.items
}
export function saveFavorite(storage, name, selection, makeId = () => crypto.randomUUID()) {
  const validated = validateFavoriteSelection(selection)
  const label = name.trim() || validated.title.slice(0, 80)
  if (label.length > 80) throw new Error('Le nom du favori est limité à 80 caractères.')
  const items = readFavorites(storage)
  const previous = items.find(item => item.name === label)
  if (!previous && items.length >= 50) throw new Error('Cinquante favoris maximum : supprime une ancienne sélection.')
  const item = { id: previous?.id ?? makeId(), name: label, selection: validated }
  const next = previous ? items.map(entry => entry.id === previous.id ? item : entry) : [...items, item]
  storage.setItem(FAVORITES_KEY, JSON.stringify({ version: 1, items: next }))
  return next
}
export function deleteFavorite(storage, id) {
  const next = readFavorites(storage).filter(item => item.id !== id)
  storage.setItem(FAVORITES_KEY, JSON.stringify({ version: 1, items: next }))
  return next
}
