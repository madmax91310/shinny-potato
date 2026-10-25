const READ_KEY = 'epargnantlibre-radar-read-v1'
const SIGNALS_KEY = 'epargnantlibre-radar-signals-v1'
const UPDATE_EVENT = 'editorial-radar-read'
export function cachedSignalIds() {
  try {
    const value = JSON.parse(localStorage.getItem(SIGNALS_KEY) ?? '[]'), read = new Set(readIds())
    return Array.isArray(value) ? value.map(group => Array.isArray(group) ? group.find(id => typeof id === 'string' && !read.has(id)) ?? group[0] : group).filter(id => typeof id === 'string') : []
  } catch { return [] }
}
export function readIds() {
  try { const value = JSON.parse(localStorage.getItem(READ_KEY) ?? '[]'); return Array.isArray(value) ? value.filter(id => typeof id === 'string') : [] } catch { return [] }
}
export function markRead(ids) {
  try { localStorage.setItem(READ_KEY, JSON.stringify([...new Set([...readIds(), ...ids])].slice(-2000))); window.dispatchEvent(new Event(UPDATE_EVENT)); return true } catch { return false }
}
export function cacheSignalGroups(groups) {
  try { localStorage.setItem(SIGNALS_KEY, JSON.stringify(groups)); window.dispatchEvent(new Event(UPDATE_EVENT)) } catch { /* Storage is optional. */ }
}
export const READ_EVENT = UPDATE_EVENT
