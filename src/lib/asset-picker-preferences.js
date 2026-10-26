import { readPreference, writePreference } from './publication-preferences.js'

export const ASSET_FAVORITES_KEY = 'asset-picker:favorites'
export const ASSET_RECENTS_KEY = 'asset-picker:recents'
export const validAssetKeys = value => Array.isArray(value) && value.length <= 200 && value.every(key => typeof key === 'string' && key.length <= 200)
// A share class follows its ISIN across routes, labels and local option IDs.
export const assetPreferenceKey = item => item.isin ? `isin:${item.isin}` : `asset:${item.preferenceId ?? item.id}`
export function updateAssetKeys(key, update, limit = 200) {
  const next = [...new Set(update(readPreference(key, [], validAssetKeys)))].slice(0, limit)
  if (!writePreference(key, next, validAssetKeys)) return null
  globalThis.dispatchEvent?.(new Event('asset-picker-preferences'))
  return next
}
export function filterAssetOptions(items, { query = '', group = 'Tous', peaOnly = false } = {}) {
  const clean = text => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const terms = clean(query).trim().split(/\s+/).filter(Boolean)
  return items.filter(item => (!peaOnly || item.badges?.includes('PEA')) && (group === 'Tous' || (item.group ?? 'Autres actifs') === group) &&
    terms.every(term => clean(`${item.name ?? ''} ${item.label} ${item.search ?? ''} ${item.detail ?? ''} ${item.isin ?? ''}`).includes(term)))
}
