import { createHash } from 'node:crypto'

export const GLOBALX_NEWS_URL = 'https://globalxetfs.eu/news'
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
// Observe the issuer's visible recent-news list, not unrelated US QYLD pages.
// The official listing qualifies only a title and publication date; product
// identity, France availability and full calendars still require documents.
export function parseGlobalXNews(html, now = new Date()) {
  if (!html.includes('Recent News')) throw new Error('La page de communiqués Global X Europe a changé de format.')
  const records = new Map()
  for (const [, card] of html.matchAll(/<a\b[^>]*>([\s\S]*?<li\b[\s\S]*?<\/li>)<\/a>/gi)) {
    const title = clean(card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? '')
    if (!/\betfs?\b|\bucits\b|Dividend Announcement/i.test(title)) continue
    const date = clean(card.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '').match(/^(\d{1,2}) ([A-Z][a-z]{2}) (20\d{2})$/)
    if (!date || title.length > 300) throw new Error('Un communiqué Global X Europe est incomplet.')
    const month = MONTHS.findIndex(name => name.slice(0, 3) === date[2])
    const period = `${date[3]}-${String(month + 1).padStart(2, '0')}-${date[1].padStart(2, '0')}`
    const stamp = new Date(`${period}T00:00:00Z`)
    if (month < 0 || !Number.isFinite(stamp.getTime()) || stamp.toISOString().slice(0, 10) !== period || stamp > now) throw new Error('Date de communiqué Global X Europe invalide.')
    const entity = `globalx-news-${createHash('sha256').update(`${period}:${title}`).digest('hex').slice(0, 20)}`
    records.set(entity, { family: 'etf', entity, label: title, field: 'announcement', fieldLabel: 'Communiqué officiel', value: title, sourceUrl: GLOBALX_NEWS_URL, period, checkedAt: now.toISOString(), scope: 'Communiqué Global X Europe · titre et date publiés', tool: '/fiches-etf', discovery: true, rule: 'announcement', priority: 'high', angle: 'Qualifier le document, la part exacte, sa disponibilité en France et la date d’effet avant intégration.', reason: 'Annonce publiée sur le site officiel européen. Aucun ISIN, rendement ou lancement n’est déduit du titre seul.' })
  }
  if (!records.size) throw new Error('Aucun communiqué ETF Global X Europe trouvé : historique conservé.')
  return [...records.values()]
}
export async function collectRadarNews(now = new Date(), request = fetch) {
  const results = await Promise.all([[VANGUARD_NEWS_URL, parseVanguardNews, 'Communiqués Vanguard'], [GLOBALX_NEWS_URL, parseGlobalXNews, 'Communiqués Global X Europe']].map(async ([url, parse, entity]) => {
    try {
      const response = await request(url, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'Mozilla/5.0 EpargnantLibre-Radar/1.0', Accept: 'text/html' } })
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error(`Page officielle indisponible (${response.status}).`)
      const html = await response.text()
      if (html.length > 2000000) throw new Error('Page officielle trop volumineuse.')
      return { observations: parse(html, now), errors: [] }
    } catch (error) { return { observations: [], errors: [{ family: 'etf', entity, reason: error.message }] } }
  }))
  return { observations: results.flatMap(r => r.observations), errors: results.flatMap(r => r.errors) }
}
