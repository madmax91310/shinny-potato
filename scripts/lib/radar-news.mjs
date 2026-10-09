import { createHash } from 'node:crypto'

export const VANGUARD_NEWS_URL = 'https://www.vanguard.co.uk/professional/contact-us/press-releases'
const clean = value => value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export function parseVanguardNews(html, now = new Date()) {
  if (!html.includes('Press releases') || !html.includes('nds-base-card')) throw new Error('La page de communiqués Vanguard a changé de format.')
  const records = new Map(), cards = [...html.matchAll(/<nds-base-card\b[^>]*>([\s\S]*?)<\/nds-base-card>/gi)]
  for (const [, card] of cards) {
    const title = clean(card.match(/<h[234]\b[^>]*>([\s\S]*?)<\/h[234]>/i)?.[1] ?? '')
    if (!/\betfs?\b|exchange.traded/i.test(title)) continue
    const href = card.match(/<a\b[^>]*href="([^"]+\.pdf)"/i)?.[1]
    const date = clean(card).match(/\b(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) (20\d{2})\b/)
    if (!href || !date || title.length > 300) throw new Error('Un communiqué ETF Vanguard est incomplet.')
    const sourceUrl = new URL(href, VANGUARD_NEWS_URL)
    if (sourceUrl.protocol !== 'https:' || sourceUrl.hostname !== 'www.vanguard.co.uk' || !sourceUrl.pathname.startsWith('/content/dam/intl/europe/documents/')) throw new Error('Lien de communiqué Vanguard non officiel.')
    const period = `${date[3]}-${String(MONTHS.indexOf(date[2]) + 1).padStart(2, '0')}-${date[1].padStart(2, '0')}`
    const stamp = new Date(`${period}T00:00:00Z`)
    if (!Number.isFinite(stamp.getTime()) || stamp.toISOString().slice(0, 10) !== period || stamp > now) throw new Error('Date de communiqué invalide.')
    const entity = `vanguard-news-${createHash('sha256').update(sourceUrl.href).digest('hex').slice(0, 20)}`
    records.set(entity, { family: 'etf', entity, label: title, field: 'announcement', fieldLabel: 'Communiqué officiel', value: title, sourceUrl: sourceUrl.href, period, checkedAt: now.toISOString(), scope: 'Communiqué Vanguard Europe · titre et date publiés', tool: '/fiches-etf', discovery: true, rule: 'announcement', priority: 'high', angle: 'Lire le communiqué pour préciser les produits concernés, leur disponibilité en France et la date d’effet.', reason: 'Nouveau communiqué officiel relatif aux ETF. Aucun frais, ISIN ou lancement n’est déduit du titre seul.' })
  }
  if (!records.size) throw new Error('Aucun communiqué ETF trouvé : historique conservé.')
  return [...records.values()]
}
export async function collectRadarNews(now = new Date(), request = fetch) {
  try {
    const response = await request(VANGUARD_NEWS_URL, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'Mozilla/5.0 EpargnantLibre-Radar/1.0', Accept: 'text/html' } })
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error(`Page officielle indisponible (${response.status}).`)
    const html = await response.text()
    if (html.length > 2000000) throw new Error('Page officielle trop volumineuse.')
    return { observations: parseVanguardNews(html, now), errors: [] }
  } catch (error) { return { observations: [], errors: [{ family: 'etf', entity: 'Communiqués Vanguard', reason: error.message }] } }
}
