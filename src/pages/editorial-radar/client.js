export const RADAR_URL = 'https://raw.githubusercontent.com/madmax91310/shinny-potato/radar-data/feed.json'
export const FAMILIES = { etf: 'ETF', indices: 'Indices', courtiers: 'Courtiers', epargne: 'Épargne', scpi: 'SCPI', assurance: 'Assurance-vie', investisseurs: 'Investisseurs', economie: 'Repères économiques' }
const READ_KEY = 'epargnantlibre-radar-read-v1'
const UPDATE_EVENT = 'editorial-radar-read'
export function readIds() {
  try { const value = JSON.parse(localStorage.getItem(READ_KEY) ?? '[]'); return Array.isArray(value) ? value.filter(id => typeof id === 'string') : [] } catch { return [] }
}
export function markRead(ids) {
  try { localStorage.setItem(READ_KEY, JSON.stringify([...new Set([...readIds(), ...ids])].slice(-2000))); window.dispatchEvent(new Event(UPDATE_EVENT)); return true } catch { return false }
}
export function validateFeed(feed) {
  if (feed?.schemaVersion !== 1 || !Number.isFinite(Date.parse(feed.checkedAt)) || !Array.isArray(feed.events) || feed.events.length > 500 || !feed.coverage || !Array.isArray(feed.errors)) throw new Error('Le radar a renvoyé un format non reconnu.')
  const ids = new Set()
  for (const event of feed.events) {
    if (!event.id || ids.has(event.id) || !FAMILIES[event.family] || !Number.isFinite(Date.parse(event.detectedAt)) || typeof event.title !== 'string' || typeof event.draft !== 'string' || !event.scope || !event.period) throw new Error('Un signal du radar est incomplet.')
    if (new URL(event.sourceUrl).protocol !== 'https:' || !event.tool?.startsWith('/') || event.tool.startsWith('//')) throw new Error('Un lien du radar est invalide.')
    ids.add(event.id)
  }
  return feed
}
export async function fetchRadar(signal) {
  const response = await fetch(RADAR_URL, { cache: 'no-store', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(response.status === 404 ? 'Le premier relevé du radar est en préparation.' : 'Le radar est momentanément indisponible.')
  return validateFeed(await response.json())
}
export const READ_EVENT = UPDATE_EVENT
export function staleFeed(feed, now = Date.now()) { return !feed || now - Date.parse(feed.checkedAt) > 36 * 3600000 }
