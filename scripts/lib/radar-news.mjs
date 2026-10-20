import { createHash } from 'node:crypto'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { etfAnnouncement } from '../../src/lib/radar-editorial.js'

export const GLOBALX_NEWS_URL = 'https://globalxetfs.eu/news'
export const VANGUARD_NEWS_URL = 'https://www.vanguard.co.uk/professional/contact-us/press-releases'
const clean = value => value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export function parseVanguardNews(html, now = new Date()) {
  // Vanguard's new server render embeds the official page model even when
  // the legacy card component no longer renders. Read that exact page only;
  // unrelated navigation/search cards are never press-release evidence.
  if (!html.includes('nds-base-card')) {
    const raw = html.match(/<script\b[^>]*id="serverApp-state"[^>]*>([\s\S]*?)<\/script>/i)?.[1]
    let model
    try { model = JSON.parse(raw ?? '{}')._angular_initial_state } catch { /* Fail closed below. */ }
    if (model?.[':path'] !== '/content/uk-aem/gb/en/professional/contact-us/press-releases' || model.title !== 'Press releases') throw new Error('La page de communiqués Vanguard a changé de format.')
    const cards = []
    const visit = value => {
      if (!value || typeof value !== 'object') return
      if (value[':type'] === 'eds-aem-app/components/card' && typeof value.heading === 'string' && typeof value.subtitle === 'string' && typeof value.link?.href === 'string') cards.push(value)
      for (const child of Object.values(value)) if (child && typeof child === 'object') visit(child)
    }
    visit(model[':items'])
    const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    html = '<h1>Press releases</h1>' + cards.map(card => `<nds-base-card><span>${escape(card.subtitle)}</span><h3>${escape(card.heading)}</h3><a href="${escape(card.link.href)}">PDF</a></nds-base-card>`).join('')
  }
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
  for (const [anchor, card] of html.matchAll(/<a\b[^>]*>([\s\S]*?<li\b[\s\S]*?<\/li>)<\/a>/gi)) {
    const title = clean(card.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1] ?? '')
    if (!/\betfs?\b|\bucits\b|Dividend Announcement/i.test(title)) continue
    const date = clean(card.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? '').match(/^(\d{1,2}) ([A-Z][a-z]{2}) (20\d{2})$/)
    if (!date || title.length > 300) throw new Error('Un communiqué Global X Europe est incomplet.')
    const month = MONTHS.findIndex(name => name.slice(0, 3) === date[2])
    const period = `${date[3]}-${String(month + 1).padStart(2, '0')}-${date[1].padStart(2, '0')}`
    const stamp = new Date(`${period}T00:00:00Z`)
    if (month < 0 || !Number.isFinite(stamp.getTime()) || stamp.toISOString().slice(0, 10) !== period || stamp > now) throw new Error('Date de communiqué Global X Europe invalide.')
    const entity = `globalx-news-${createHash('sha256').update(`${period}:${title}`).digest('hex').slice(0, 20)}`
    const href = anchor.match(/href="([^"]+)"/i)?.[1]
    const documentUrl = href ? new URL(clean(href), GLOBALX_NEWS_URL) : null
    const officialDocument = documentUrl && officialNewsDocument(documentUrl.href)
    records.set(entity, { family: 'etf', entity, label: title, field: 'announcement', fieldLabel: 'Communiqué officiel', value: title, sourceUrl: GLOBALX_NEWS_URL, ...(officialDocument ? { documentUrl: documentUrl.href } : {}), period, checkedAt: now.toISOString(), scope: 'Communiqué Global X Europe · titre et date publiés', tool: '/fiches-etf', discovery: true, rule: 'announcement', priority: 'high', angle: 'Qualifier le document, la part exacte, sa disponibilité en France et la date d’effet avant intégration.', reason: 'Annonce publiée sur le site officiel européen. Aucun ISIN, rendement ou lancement n’est déduit du titre seul.' })
  }
  if (!records.size) throw new Error('Aucun communiqué ETF Global X Europe trouvé : historique conservé.')
  return [...records.values()]
}

export function officialNewsDocument(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && (
      url.hostname === 'www.vanguard.co.uk' && url.pathname.startsWith('/content/dam/intl/europe/documents/') ||
      url.hostname === 'gxeustrapi.blob.core.windows.net' && url.pathname.startsWith('/webpublic/uploads/') ||
      url.hostname === 'globalxetfs.eu' && url.pathname !== '/news'
    )
  } catch { return false }
}

// Do not attach one fund's characteristics to another fund in a group launch.
// Only unambiguous, explicitly labelled fields in a single-ISIN document qualify.
export function parseLaunchDetails(text) {
  const isins = [...new Set(text.match(/\b[A-Z]{2}[A-Z0-9]{9}\d\b/g) ?? [])]
  if (isins.length !== 1) return {}
  const details = { isin: isins[0] }
  const flat = text.replace(/\s+/g, ' ')
  const fees = [...flat.matchAll(/(?:total expense ratio|ongoing charges|TER|frais (?:courants|annuels))\s*(?:of|de|:|=)?\s*(\d[\d.,]*\s*%)/gi)].map(match => match[1])
  if (new Set(fees).size === 1) details.fees = fees[0]
  const index = text.match(/(?:benchmark(?: index)?|indice (?:suivi|de reference|de référence))\s*:\s*([^\r\n]{3,150})/i)
  if (index) details.index = index[1].trim()
  const pea = flat.match(/(?:not eligible (?:for|to)|non [ée]ligible (?:au|à un))\s*(?:the )?PEA\b/i) ? 'Non éligible, selon le communiqué' : flat.match(/(?:eligible (?:for|to)|[ée]ligible au)\s*(?:the )?PEA\b/i) ? 'Éligible, selon le communiqué' : null
  if (pea) details.pea = pea
  const distribution = flat.match(/(?:distribution policy|politique de (?:distribution|revenus))\s*:\s*(accumulating|distributing|capitalisation|distribution)\b/i)
  if (distribution) details.distribution = /accumulating|capitalisation/i.test(distribution[1]) ? 'Capitalisation' : 'Distribution'
  const date = text.match(/(?:first trading date|date de premi[eè]re cotation|date de n[ée]gociation)\s*:\s*([^\r\n]{4,60})/i)
  if (date) details.tradingDate = date[1].trim()
  return details
}

async function documentText(response) {
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length > 5000000) throw new Error('Communiqué trop volumineux.')
  if (bytes.subarray(0, 5).toString() !== '%PDF-') throw new Error('Le communiqué n’est pas un PDF reconnu.')
  const directory = await mkdtemp(join(tmpdir(), 'radar-launch-'))
  try {
    const path = join(directory, 'issuer.pdf')
    await writeFile(path, bytes)
    return (await promisify(execFile)('pdftotext', ['-layout', path, '-'], { timeout: 15000, maxBuffer: 2000000 })).stdout
  } finally { await rm(directory, { recursive: true, force: true }) }
}

export async function enrichEtfLaunches(observations, now = new Date(), request = fetch, extract = documentText) {
  const errors = []
  const launches = observations.filter(row => etfAnnouncement(row.label) && now - Date.parse(row.period) <= 7 * 86400000)
    .sort((a, b) => b.period.localeCompare(a.period)).slice(0, 8)
  for (const row of launches) {
    const announcement = etfAnnouncement(row.label)
    row.fieldLabel = 'Lancement ETF'
    row.angle = 'Quelle exposition propose cet ETF et qu’apporte-t-il face aux produits comparables ? Vérifier les frais, le PEA et la disponibilité en France dans la source.'
    row.reason = `${announcement.label}. Cette formulation ne prouve ni une disponibilité en France ni une éligibilité au PEA.`
    const url = row.documentUrl ?? row.sourceUrl
    if (!officialNewsDocument(url)) continue
    try {
      const response = await request(url, { redirect: 'error', signal: AbortSignal.timeout(20000), headers: { Accept: 'application/pdf' } })
      if (!response.ok || response.url && !officialNewsDocument(response.url)) throw new Error(`Document de lancement indisponible (${response.status}).`)
      const text = await extract(response)
      row.launchDetails = parseLaunchDetails(text)
      row.documentUrl = url
      row.documentCheckedAt = now.toISOString()
      row.documentHash = createHash('sha256').update(text).digest('hex')
    } catch (error) { errors.push({ family: 'etf', entity: row.entity, reason: error.message }) }
  }
  return { observations, errors }
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
