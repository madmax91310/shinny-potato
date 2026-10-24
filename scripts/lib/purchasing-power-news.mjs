import { editorialExclusion, editorialTopic, RADAR_TOPICS } from '../../src/lib/radar-policy.js'
import { createHash } from 'node:crypto'
import { parseOfficialListing } from './purchasing-power-sources.mjs'

// Public official feeds only: no API key, paid service or manual article list.
export const PURCHASING_SOURCES = [
  { id: 'service-public', name: 'Service Public', url: 'https://www.service-public.gouv.fr/abonnements/rss/actu-actualites-particuliers.rss', hosts: ['www.service-public.gouv.fr', 'www.service-public.fr'] },
  { id: 'bercy', name: 'Ministère de l’Économie', url: 'https://www.economie.gouv.fr/rss/toutesactualites', hosts: ['www.economie.gouv.fr'] },
  { id: 'vie-publique-actualites', name: 'Vie publique · actualités', url: 'https://www.vie-publique.fr/actualites-feeds.xml', hosts: ['www.vie-publique.fr'] },
  { id: 'vie-publique-lois', name: 'Vie publique · lois', url: 'https://www.vie-publique.fr/lois-feeds.xml', hosts: ['www.vie-publique.fr'] },
  { id: 'banque-france-credit', name: 'Banque de France · crédits aux particuliers', url: 'https://www.banque-france.fr/fr/publications-et-statistiques/statistiques?theme%5B7157%5D=7157&sub_theme%5B7166%5D=7166', hosts: ['www.banque-france.fr'], format: 'html' },
  { id: 'cre-prix', name: 'CRE · prix de l’énergie', url: 'https://www.cre.fr/documents/communiques-de-presse.html', hosts: ['www.cre.fr'], format: 'html' },
]
const normalize = s => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[’']/g, ' ')
export function cleanText(value = '') {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => { const n = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code); return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : '' })
    .replace(/&(eacute|egrave|ecirc|agrave|acirc|icirc|ocirc|ucirc|ugrave|ccedil|rsquo|lsquo|rdquo|ldquo|ndash|mdash|hellip|euro);/g, (_,name) => ({eacute:'é',egrave:'è',ecirc:'ê',agrave:'à',acirc:'â',icirc:'î',ocirc:'ô',ucirc:'û',ugrave:'ù',ccedil:'ç',rsquo:'’',lsquo:'‘',rdquo:'”',ldquo:'“',ndash:'–',mdash:'—',hellip:'…',euro:'€'})[name])
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g, m => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&apos;': "'", '&nbsp;': ' ' })[m])
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}
const tag = (xml, name) => xml.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] ?? ''
export function officialUrl(value, source) {
  const url = new URL(value, source.url)
  if (source.upgradeHttp && url.protocol === 'http:' && source.hosts.includes(url.hostname)) url.protocol = 'https:'
  if (url.protocol !== 'https:' || !source.hosts.includes(url.hostname) || url.username || url.password || url.port) throw new Error('Lien d’actualité non officiel.')
  for (const key of [...url.searchParams.keys()]) if (/^(utm_|egn-|xtor$|fbclid$)/i.test(key)) url.searchParams.delete(key)
  url.hash = ''
  // Service Public's former hostname is an alias, not a new announcement.
  if (url.hostname === 'www.service-public.fr') url.hostname = 'www.service-public.gouv.fr'
  url.searchParams.sort()
  return url.href
}
export function classifyTopic(title, summary) { return editorialTopic(title, summary) }
// Legislative status is tied to an explicit short extract, never to the host
// or to an old law mentioned in the full article. A chamber vote ≠ enactment.
export function classifyStatus(title, summary) {
  const clauses = [title, ...summary.split(/(?<=[.!?])\s+/)].filter(Boolean)
  let fallback
  for (const clause of clauses) {
    const s = normalize(clause)
    if (/(?:ne |n ).*pas.*(?:adopt|vot|promulgu|vigueur|applicable)|pas encore|pourrait|serait|devrait/.test(s)) continue
    let status
    if (/entre(?:e|nt|ra|ront)? en vigueur|applicable|s applique|sont appliqu|est applique/.test(s)) {
      status = /entrera|entreront|sera applicable|seront applicables|s appliquera/.test(s) ? 'Application annoncée' : 'Application indiquée'
    } else if (/promulgu/.test(s)) status = 'Promulgation indiquée'
    else if (/(?:adopte|vote|approuve)(?:e|es|s)?\b/.test(s)) status = 'Vote indiqué · étape à vérifier'
    else if (/projet de loi|proposition de loi|amendement|propose|en debat/.test(s)) status = 'Proposition / en discussion'
    else if (/annonce/.test(s)) status = 'Annonce'
    if (status) {
      const result = { status, evidence: clause.slice(0, 450) }
      if (status === 'Proposition / en discussion' || status === 'Annonce') fallback ??= result
      else return result
    }
  }
  return fallback ?? { status: 'À préciser', evidence: '' }
}
// Only a final adoption or promulgation qualifies a legislative announcement.
export function adoptedLaw(title = '', summary = '') {
  for (const clause of [title, ...summary.split(/(?<=[.!?])\s+/)].filter(Boolean)) {
    const text = normalize(clause)
    if (/(?:ne |n ).*pas|pas encore|pourrait|serait|devrait|non adopte|sera|seront|prevu|attendu|doit etre|avant .*promulgu|apres .*promulgu|si .*adopt/.test(text)) continue
    if (/promulgu(?:e|ee|ees|es|ation)\b/.test(text)) return { status: 'Loi promulguée', evidence: clause.slice(0, 450) }
    if (/(?:adopte|vote)(?:e|es|s)? definitivement|adoption definitive/.test(text) && !/amendement|en commission|premiere lecture/.test(text)) return { status: 'Loi adoptée définitivement', evidence: clause.slice(0, 450) }
  }
  return null
}
export function publishablePurchasingNews(item) {
  if (editorialExclusion(item)) return false
  if (item.factType === 'consumer-announcement') return true
  if (item.family !== 'pouvoir-achat') return true
  const publisher = item.publisher ?? ''
  const host = (() => { try { return new URL(item.sourceUrl).hostname } catch { return '' } })()
  if (/^(?:Assemblée nationale|Sénat)/.test(publisher) || /(?:^|\.)(?:senat\.fr|assemblee-nationale\.fr)$/.test(host)) return false
  const title = item.label ?? item.value?.title ?? ''
  const summary = item.summary ?? item.value?.summary ?? ''
  const legislative = publisher === 'Vie publique · lois' || /\blois?\b|amendement|\bplf(?:ss)?\b|projet de budget/.test(normalize(title + ' ' + summary)) || /Proposition|discussion|Adoption en|Vote indiqué|Rejet/.test(item.status ?? item.value?.status ?? '')
  return !legislative || Boolean(adoptedLaw(title, summary))
}
export function parsePurchasingFeed(xml, source, now = new Date()) {
  if (xml.length > 2000000 || /<!DOCTYPE|<!ENTITY/i.test(xml) || !/<rss\b/i.test(xml) || !/<channel\b/i.test(xml) || !/<\/rss>\s*$/i.test(xml)) throw new Error('Flux officiel invalide ou format modifié.')
  if ((xml.match(/<item\b/gi) ?? []).length !== (xml.match(/<\/item>/gi) ?? []).length) throw new Error('Flux officiel tronqué.')
  const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
  if (!items.length && /<item\b/i.test(xml)) throw new Error('Flux officiel tronqué.')
  const observations = [], errors = []
  for (const [, item] of items) {
    try {
      const title = cleanText(tag(item, 'title')), summary = cleanText(tag(item, 'description')).slice(0, 550)
      if (!title || title.length > 350) throw new Error('Titre manquant ou trop long.')
      const topic = classifyTopic(title, summary)
      if (!topic) continue
      const link = cleanText(tag(item, 'link'))
      // The household RSS also syndicates the official professional portal.
      // Discard this known out-of-scope host without trusting arbitrary links.
      const candidate = new URL(link, source.url)
      if (source.id === 'service-public' && candidate.protocol === 'https:' &&
        ['entreprendre.service-public.gouv.fr', 'entreprendre.service-public.fr'].includes(candidate.hostname) &&
        !candidate.username && !candidate.password && !candidate.port && /^\/actualites\/A\d+$/.test(candidate.pathname)) continue
      const sourceUrl = officialUrl(link, source)
      if (!cleanText(tag(item, 'link'))) throw new Error('Lien manquant.')
      const rawDate = cleanText(tag(item, 'pubDate') || tag(item, 'dc:date'))
      // Bercy uses local calendar dates without an offset. Preserve the
      // publisher's calendar day; never substitute today's collection date.
      const stamp = Date.parse(/^\d{4}-\d{2}-\d{2} /.test(rawDate) ? rawDate.replace(' ', 'T') + 'Z' : rawDate)
      const period = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : Number.isFinite(stamp) ? new Date(stamp).toISOString().slice(0, 10) : ''
      const day = Date.parse(`${period}T00:00:00Z`)
      if (!rawDate || !Number.isFinite(stamp) || !Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== period || period > now.toISOString().slice(0, 10)) throw new Error('Date de publication invalide ou future.')
      // Archives are retained in state; adding one to a feed is not news.
      if (now.getTime() - day > 45 * 86400000) continue
      const classified = classifyStatus(title, summary)
      const { status, evidence } = adoptedLaw(title, summary) ?? classified
      if (!publishablePurchasingNews({ family: 'pouvoir-achat', label: title, summary, publisher: source.name, sourceUrl })) continue
      const statistical = /etude|enquete|statistiques|salaire median|niveaux? de vie|patrimoine des menages/.test(normalize(title)) && /\d/.test(summary) && !/loi|decret|proposition|arrete/.test(normalize(title))
      const entity = `purchasing-news-${createHash('sha256').update(sourceUrl).digest('hex').slice(0, 20)}`
      observations.push({ family: 'pouvoir-achat', ...(statistical ? { factType: 'statistical-publication' } : {}), entity, label: title, field: 'announcement', fieldLabel: 'Actualité officielle', value: { title, summary, status }, period, checkedAt: now.toISOString(), sourceUrl, evidence: { sourceHash: createHash('sha256').update(item).digest('hex'), excerpt: summary }, scope: 'Actualité officielle · particuliers', publishedAt: period, publicationId: sourceUrl, tool: null, rule: statistical ? 'publication' : 'announcement', discovery: true, priority: /\bptz\b|smic|loi de finances|prime|taux|revaloris|plafond/i.test(normalize(title)) ? 'high' : 'normal', topic, topicLabel: RADAR_TOPICS[topic], publisher: source.name, status, statusEvidence: evidence, summary, angle: statistical ? 'Présenter le repère chiffré et son périmètre, puis distinguer la situation médiane et les écarts entre ménages.' : 'Préciser le public, la date et les conditions citées avant de comparer.', reason: 'Titre, résumé et date récupérés automatiquement dans le flux officiel. Le statut repose sur une formulation explicite ; aucun impact individuel n’est inventé.' })
    } catch (error) { errors.push({ family: 'pouvoir-achat', entity: source.name, reason: error.message }) }
  }
  // A duplicate URL is one article even with tracking parameters/aliases.
  const unique = new Map()
  for (const o of observations) if (!unique.has(o.entity) || o.period > unique.get(o.entity).period) unique.set(o.entity, o)
  return { observations: [...unique.values()], errors, itemCount: items.length }
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const TRANSIENT_HTTP = new Set([408, 429, 500, 502, 503, 504])
export async function fetchFeed(source, request, wait = pause, cache = null) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let response
    try {
      response = await request(source.url, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'Mozilla/5.0 EpargnantLibre-Radar/1.0', Accept: source.format === 'html' ? 'text/html' : 'application/rss+xml, application/xml, text/xml', ...(cache?.etag ? { 'If-None-Match': cache.etag } : {}), ...(cache?.lastModified ? { 'If-Modified-Since': cache.lastModified } : {}) } })
    } catch (error) {
      if (attempt === 2) throw error
      await wait(1000 * 2 ** attempt)
      continue
    }
    if (response.status === 304) { if (!cache?.content) throw new Error('Flux 304 sans version conservée.'); return cache.content }
    if (!response.ok) {
      const error = new Error(`Flux officiel indisponible (HTTP ${response.status}).`)
      if (!TRANSIENT_HTTP.has(response.status) || attempt === 2) throw error
      const header = response.headers.get('retry-after')
      const seconds = header && /^\d+$/.test(header.trim()) ? Number(header) : NaN
      const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - Date.now()
      // Respect short publisher cooldowns. A long cooldown is left to the next
      // scheduled run, rather than retrying earlier than the publisher allows.
      if (Number.isFinite(delay) && delay > 30000) throw error
      await wait(Math.max(1000 * 2 ** attempt, Number.isFinite(delay) ? delay : 0))
      continue
    }
    // Source/schema failures are not transport failures: do not retry them.
    if (response.url) officialUrl(response.url, source)
    if (!(source.format === 'html' ? /html/i : /xml|rss/i).test(response.headers.get('content-type') ?? '')) throw new Error('La source n’a pas renvoyé le format officiel attendu.')
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength > 2000000) throw new Error('Flux officiel trop volumineux.')
    const buffer = Buffer.from(bytes)
    const decoded = buffer[0] === 0x1f && buffer[1] === 0x8b ? (await import('node:zlib')).gunzipSync(buffer, { maxOutputLength: 2000000 }) : buffer
    const encoding = decoded.subarray(0, 150).toString('ascii').match(/encoding=['"]([^'"]+)/i)?.[1]
    const content = new TextDecoder(/iso-8859/i.test(encoding ?? '') ? 'iso-8859-15' : 'utf-8').decode(decoded)
    if (cache) Object.assign(cache, { content, etag: response.headers.get('etag'), lastModified: response.headers.get('last-modified') })
    return content
  }
}
export async function collectPurchasingNews(now = new Date(), request = fetch, _previous = null) {
  const cache = structuredClone(_previous?.purchasingCache ?? {})
  const results = await Promise.all(PURCHASING_SOURCES.map(async source => {
    try {
      const content = await fetchFeed(source, request, pause, cache[source.id] ??= {})
      const parsed = parsePurchasingFeed(source.format === 'html' ? parseOfficialListing(content, source) : content, source, now)
      return { ...parsed, source: { id: source.id, name: source.name, url: source.url, checkedAt: now.toISOString(), status: parsed.errors.length ? 'partial' : 'ok', articles: parsed.itemCount, relevant: parsed.observations.length } }
    } catch (error) {
      return { observations: [], errors: [{ family: 'pouvoir-achat', entity: source.name, reason: error.message }], source: { id: source.id, name: source.name, url: source.url, checkedAt: now.toISOString(), status: 'error', articles: 0, relevant: 0 } }
    }
  }))
  const unique = new Map()
  for (const o of results.flatMap(r => r.observations)) if (!unique.has(o.entity) || o.period > unique.get(o.entity).period) unique.set(o.entity, o)
  return { cache, observations: [...unique.values()], errors: results.flatMap(r => r.errors), sources: results.map(r => r.source) }
}
