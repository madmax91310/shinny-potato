import { createHash } from 'node:crypto'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { cleanText } from './purchasing-power-news.mjs'
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
    records.set(entity, { family: 'etf', entity, label: title, field: 'announcement', fieldLabel: 'Communiqué officiel', value: title, sourceUrl: sourceUrl.href, publishedAt: period, publicationId: sourceUrl.href, period, checkedAt: now.toISOString(), scope: 'Communiqué Vanguard Europe · titre et date publiés', tool: '/fiches-etf', discovery: true, rule: 'announcement', priority: 'high', angle: 'Lire le communiqué pour préciser les produits concernés, leur disponibilité en France et la date d’effet.', reason: 'Nouveau communiqué officiel relatif aux ETF. Aucun frais, ISIN ou lancement n’est déduit du titre seul.' })
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
    records.set(entity, { family: 'etf', entity, label: title, field: 'announcement', fieldLabel: 'Communiqué officiel', value: title, sourceUrl: GLOBALX_NEWS_URL, ...(officialDocument ? { documentUrl: documentUrl.href } : {}), publishedAt: period, publicationId: officialDocument ? documentUrl.href : entity, period, checkedAt: now.toISOString(), scope: 'Communiqué Global X Europe · titre et date publiés', tool: '/fiches-etf', discovery: true, rule: 'announcement', priority: 'high', angle: 'Qualifier le document, la part exacte, sa disponibilité en France et la date d’effet avant intégration.', reason: 'Annonce publiée sur le site officiel européen. Aucun ISIN, rendement ou lancement n’est déduit du titre seul.' })
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
      url.hostname === 'globalxetfs.eu' && url.pathname !== '/news' ||
      url.hostname === 'www.amundietf.fr' && url.pathname.startsWith('/fr/professionnels/a-propos/news/')
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

export function extractProducts(text) {
  const products = []
  // A cell row or paragraph is a proof boundary. Global fees never fill products.
  const blocks = /<\w/.test(text) ? [...text.matchAll(/<(tr|p)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map(m => cleanText(m[2])) : text.split(/\n\s*\n/)
  for (const block of blocks) {
    const names = [...new Set(block.replace(/\s+/g, ' ').match(/\b(?:Amundi|Vanguard|iShares|Global X|Xtrackers|SPDR|Invesco|WisdomTree|VanEck|UBS|JPMorgan) [A-Z][A-Za-z0-9 &’'()–-]{2,140}?\bUCITS ETF\b/g) ?? [])]
    const isins = [...new Set(block.replace(/\s+/g, ' ').match(/\b[A-Z]{2}[A-Z0-9]{9}\d\b/g) ?? [])]
    if (names.length === 1) {
      const local = isins.length === 1 ? parseLaunchDetails(block.replace(/\s+(TER|Benchmark|Indice|Frais|Distribution policy|Politique de distribution|First trading date|Date de premi[eè]re cotation)\s*:/gi, '\n$1:')) : {}
      products.push({ name: names[0], isin: local.isin ?? null, fees: local.fees ?? null, index: local.index ?? null, management: /gestion active|actively managed/i.test(block) ? 'Active' : /gestion passive|passively managed/i.test(block) ? 'Passive' : null, distribution: local.distribution ?? null, pea: local.pea ?? null, tradingDate: local.tradingDate ?? null, availability: null, evidence: block })
    } else for (const name of names) products.push({ name, isin: null, fees: null, index: null, management: null, distribution: null, pea: null, tradingDate: null, availability: null, evidence: block })
  }
  // Table headers establish column semantics; never guess by numeric proximity.
  for (const [, table] of text.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)) {
    const rows = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m => m[1])
    const headers = [...(rows[0] ?? '').matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(m => cleanText(m[1]))
    if (!headers.some(h => /^ISIN$/i.test(h))) continue
    for (const row of rows.slice(1)) {
      if (/rowspan=|colspan=/i.test(row)) continue
      const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m => cleanText(m[1]))
      if (cells.length !== headers.length) continue
      const fields = Object.fromEntries(headers.map((h,i) => [h,cells[i]]))
      const isin = fields.ISIN?.trim()
      const names = cells.join(' ').match(/\b(?:Amundi|Vanguard|iShares|Global X|Xtrackers|SPDR|Invesco|WisdomTree|VanEck|UBS|JPMorgan) [A-Z][A-Za-z0-9 &’'()–-]{2,140}?\bUCITS ETF\b/g) ?? []
      if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(isin ?? '') || names.length !== 1) continue
      const product = products.find(p => p.isin === isin)
      if (!product) continue
      for (const [header,value] of Object.entries(fields)) {
        if (/^(TER|Frais courants|Total expense ratio)$/i.test(header) && /^\d[\d.,]*\s*%$/.test(value)) product.fees = value
        if (/^(Index|Benchmark|Indice)$/i.test(header)) product.index = value || null
        if (/^(Distribution|Revenus)$/i.test(header) && /^(Accumulating|Capitalisation|Distributing|Distribution)$/i.test(value)) product.distribution = value
      }
      product.evidence = headers.map((h,i)=>`${h}: ${cells[i]}`).join(' · ')
    }
  }
  const unique = new Map()
  const namedShares = new Set(products.filter(p => p.isin).map(p => p.name))
  for (const product of products.filter(p => p.isin || !namedShares.has(p.name))) {
    const key = product.isin ?? product.name
    const previous = unique.get(key)
    if (!previous || previous.evidence.length > product.evidence.length) unique.set(key, product)
  }
  return [...unique.values()]
}
export function parseEtfDocument(htmlOrText, title) {
  const html = /<\w/.test(htmlOrText)
  const body = html ? htmlOrText.replace(/<(script|style|nav|header|footer)\b[^>]*>[\s\S]*?<\/\1>/gi, '') : htmlOrText
  const text = html ? cleanText(body) : body
  const paragraphs = html ? [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m => cleanText(m[1])) : text.split(/\n\s*\n/)
  const initial = etfAnnouncement(title)
  // Require a statement in the body for indirect headlines. Keep its exact extract.
  const excerpt = paragraphs.find(p => /(?:trois|deux|[1-9]) nouvelles solutions|nouveaux ETF|launch(?:es|ed)? .*ETF|lance .*ETF|lancement .*ETF|seront cotes|nouvelle cotation/i.test(p))
  let announcementEvidence = initial?.stage === 'candidate' ? excerpt ? { type: 'announcement', stage: 'announced', label: 'Nouvelle offre annoncée par l’émetteur', evidence: excerpt } : initial : initial
  const feeChange = paragraphs.find(p => /(?:reduce|cut|lower|r[ée]duit|baisse).{0,60}(?:fees|frais)|(?:fees|frais).{0,60}(?:reduce|cut|lower|r[ée]dui|baisse)/i.test(p))
  if (!initial && feeChange && /(?:reduce|cut|lower|r[ée]duit|baisse).{0,60}(?:fees|frais)|(?:fees|frais).{0,60}(?:reduce|cut|lower|r[ée]dui|baisse)/i.test(title)) announcementEvidence = { type: 'characteristic-change', stage: 'changed', label: 'Modification de frais annoncée', evidence: feeChange }
  const products = extractProducts(body)
  // Single-ISIN legacy extraction is still deliberately conservative.
  const launchDetails = parseLaunchDetails(html ? body.replace(/<\/(?:p|tr|div)>/gi, '\n').replace(/<[^>]*>/g, ' ') : text)
  const calendarEvidence = paragraphs.flatMap(p => p.split(/(?<=[.!?])\s+/)).find(p => /seront cot[ée]s|date de premi[eè]re cotation|first trading date/i.test(p)) ?? null
  return { launchDetails, products, announcementEvidence, calendarEvidence, evidence: { excerpt: excerpt ?? feeChange ?? announcementEvidence?.evidence ?? '', sourceHash: createHash('sha256').update(htmlOrText).digest('hex') } }
}
export async function documentText(response) {
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length > 5000000) throw new Error('Communiqué trop volumineux.')
  if (bytes.subarray(0, 5).toString() !== '%PDF-') {
    if (!/html/i.test(response.headers.get('content-type') ?? '') || !/<(?:html|article|main)\b/i.test(bytes.toString())) throw new Error('Communiqué HTML ou PDF attendu.')
    return bytes.toString('utf8')
  }
  const directory = await mkdtemp(join(tmpdir(), 'radar-launch-'))
  try {
    const path = join(directory, 'issuer.pdf')
    await writeFile(path, bytes)
    return (await promisify(execFile)('pdftotext', ['-layout', path, '-'], { timeout: 15000, maxBuffer: 2000000 })).stdout
  } finally { await rm(directory, { recursive: true, force: true }) }
}

export async function enrichEtfLaunches(observations, now = new Date(), request = fetch, extract = documentText, previousQueue = {}) {
  const errors = [], queue = structuredClone(previousQueue)
  for (const row of observations.filter(row => row.field === 'announcement')) {
    const url = row.documentUrl ?? row.sourceUrl
    if (!officialNewsDocument(url)) continue
    queue[url] ??= { row, discoveredAt: now.toISOString(), attempts: 0, status: 'pending' }
  }
  const due = Object.entries(queue).filter(([, item]) => !item.nextAttemptAt || Date.parse(item.nextAttemptAt) <= +now)
    .sort((a,b) => (a[1].attemptedAt ?? '').localeCompare(b[1].attemptedAt ?? '')).slice(0, 8)
  const processingStarted = Date.now()
  for (const [url, item] of due) {
    if (Date.now()-processingStarted > 45000) break // retry on the next pass, never drop the tail
    item.attemptedAt = now.toISOString(); item.attempts++
    try {
      const response = await request(url, { redirect: 'error', signal: AbortSignal.timeout(20000), headers: { Accept: 'text/html, application/pdf', ...(item.etag ? {'If-None-Match': item.etag} : {}), ...(item.lastModified ? {'If-Modified-Since': item.lastModified} : {}) } })
      if (response.status !== 304) {
        if (!response.ok || response.url && !officialNewsDocument(response.url)) throw new Error(`Communiqué indisponible (${response.status}).`)
        const text = await extract(response)
        if (text.trim().length < 80) throw new Error('Extraction de communiqué anormalement vide.')
        item.result = { ...parseEtfDocument(text, item.row.label), documentUrl: url, documentCheckedAt: now.toISOString(), documentHash: createHash('sha256').update(text).digest('hex') }
        item.etag = response.headers?.get('etag'); item.lastModified = response.headers?.get('last-modified')
      }
      if (!item.result) throw new Error('Réponse 304 sans extraction conservée.')
      item.status = 'done'; delete item.error; item.nextAttemptAt = new Date(+now+86400000).toISOString()
    } catch (error) { item.status = 'error'; item.error = error.message; item.nextAttemptAt = new Date(+now+Math.min(24, 2**Math.min(item.attempts, 5))*3600000).toISOString(); errors.push({ family: 'etf', entity: item.row.entity, reason: error.message }) }
  }
  const enriched = new Map(observations.map(row => [row.entity, row]))
  for (const item of Object.values(queue)) if (item.result) {
    const row = enriched.get(item.row.entity) ?? { ...item.row }
    Object.assign(row, item.result)
    enriched.set(row.entity, row)
  }
  return { observations: [...enriched.values()], errors, queue }
}
export async function collectRadarNews(now = new Date(), request = fetch) {
  const results = await Promise.all([[VANGUARD_NEWS_URL, parseVanguardNews, 'Communiqués Vanguard'], [GLOBALX_NEWS_URL, parseGlobalXNews, 'Communiqués Global X Europe']].map(async ([url, parse, entity]) => {
    try {
      const response = await request(url, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'Mozilla/5.0 EpargnantLibre-Radar/1.0', Accept: 'text/html' } })
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error(`Page officielle indisponible (${response.status}).`)
      const html = await response.text()
      if (html.length > 2000000) throw new Error('Page officielle trop volumineuse.')
      const observations = parse(html, now)
      return { observations, errors: [], source: { id: entity, name: entity, url, status: 'ok', checkedAt: now.toISOString(), lastSuccessAt: now.toISOString(), discovered: observations.length, method: 'Modèle ou liste HTML officielle', depth: 'Archive rendue par la page officielle' } }
    } catch (error) { return { observations: [], errors: [{ family: 'etf', entity, reason: error.message }], source: { id: entity, name: entity, url, status: 'error', error: error.message, attemptedAt: now.toISOString() } } }
  }))
  return { observations: results.flatMap(r => r.observations), errors: results.flatMap(r => r.errors), sources: results.map(r => r.source) }
}
