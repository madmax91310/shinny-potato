export const RADAR_URL = 'https://raw.githubusercontent.com/madmax91310/shinny-potato/radar-data/feed.json'
export const FAMILIES = { etf: 'ETF', indices: 'Indices', courtiers: 'Courtiers', epargne: 'Épargne', scpi: 'SCPI', assurance: 'Assurance-vie', investisseurs: 'Investisseurs', economie: 'Repères économiques', 'pouvoir-achat': 'Pouvoir d’achat' }
export { cachedSignalIds, readIds, markRead, cacheSignalGroups, READ_EVENT } from './read-state.js'
export function validateFeed(feed) {
  if (feed?.schemaVersion !== 1 || !Number.isFinite(Date.parse(feed.checkedAt)) || !Array.isArray(feed.events) || !feed.coverage || !Array.isArray(feed.errors)) throw new Error('Le radar a renvoyé un format non reconnu.')
  const ids = new Set()
  for (const event of feed.events) {
    if (!event.id || ids.has(event.id) || !FAMILIES[event.family] || !Number.isFinite(Date.parse(event.detectedAt)) || typeof event.title !== 'string' || typeof event.draft !== 'string' || !event.scope || !event.period) throw new Error('Un signal du radar est incomplet.')
    if (new URL(event.sourceUrl).protocol !== 'https:' || event.tool && (!event.tool.startsWith('/') || event.tool.startsWith('//'))) throw new Error('Un lien du radar est invalide.')
    if (event.sources && (!Array.isArray(event.sources) || event.sources.some(source=>new URL(source.url).protocol!=='https:'))) throw new Error('Les sources associées au sujet sont invalides.')
    if (event.documentUrl && new URL(event.documentUrl).protocol !== 'https:') throw new Error('Un communiqué du radar est invalide.')
    ids.add(event.id)
  }
  if (feed.calendar && (!Array.isArray(feed.calendar) || feed.calendar.some(item=>new URL(item.sourceUrl).protocol!=='https:' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || !Number.isFinite(Date.parse(item.date))))) throw new Error('Le calendrier est invalide.')
  if (feed.purchasingPower) {
    if (!Array.isArray(feed.purchasingPower.items) || feed.purchasingPower.items.length > 120 || !Array.isArray(feed.purchasingPower.sources)) throw new Error('La veille pouvoir d’achat est incomplète.')
    for (const item of [...feed.purchasingPower.items, ...feed.purchasingPower.sources]) {
      const url = new URL(item.sourceUrl ?? item.url)
      if (url.protocol !== 'https:') throw new Error('Une source de la veille est invalide.')
    }
  }
  return feed
}
export async function fetchRadar(signal) {
  const response = await fetch(RADAR_URL, { cache: 'no-store', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(response.status === 404 ? 'Le premier relevé du radar est en préparation.' : 'Le radar est momentanément indisponible.')
  const feed = validateFeed(await response.json())
  const { readableNews } = await import('./readableNews.js')
  return { ...feed, events: feed.events.map(readableNews), ...(feed.purchasingPower ? { purchasingPower: { ...feed.purchasingPower, items: feed.purchasingPower.items.map(readableNews) } } : {}) }
}
export function staleFeed(feed, now = Date.now()) { return !feed || now - Date.parse(feed.checkedAt) > 36 * 3600000 }
