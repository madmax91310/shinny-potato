import { requestRadarSource, sourceFailureKind, assertRadarAccess } from './radar-source-health.mjs'
import { unexplainedOfferOmissions } from './radar-offer-watch.mjs'
import { consumerRejection } from './radar-consumer.mjs'
import { articleBody,htmlElement } from './radar-article-body.mjs'
import {bdfDebtCharts} from './bdf-debt-charts.mjs'
import { relatePublications } from './radar-relationships.mjs'
import { planPublicationQueue, documentDelays, queueClass } from './radar-queue.mjs'
import { COVERAGE_SOURCES, coverageDiscovery } from './radar-coverage.mjs'
import { OFFER_SOURCES, offerDiscovery, offerSnapshot, compareOfferSnapshots } from './radar-offer-watch.mjs'
import { INSEE_SEARCH, inseeQuery, inseeDiscovery } from './radar-insee-search.mjs'
import { CONSUMER_SOURCES, discoverConsumer, parseConsumer } from './radar-consumer.mjs'
import { editorialExclusion } from '../../src/lib/radar-policy.js'
import { EXTRA_SOURCES, extraDiscovery, extraDate, extraSummary, tagContent, statisticalPeriod, creditLogementDiffusion } from './radar-extra-sources.mjs'
import { housingTopic, housingConventions, qualifyDvfSales } from '../../src/lib/radar-housing.js'
import { createHash } from 'node:crypto'
import { parseOfficialListing } from './purchasing-power-sources.mjs'
import { cleanText } from './purchasing-power-news.mjs'
import { parseEtfDocument, documentText } from './radar-news.mjs'
export const PUBLICATION_SOURCES = [
  ...OFFER_SOURCES,
  INSEE_SEARCH,
  ...CONSUMER_SOURCES,
  ...COVERAGE_SOURCES,
  ...EXTRA_SOURCES,
  { id: 'insee-publications', name: 'INSEE · publications nationales', url: 'https://www.insee.fr/fr/flux/2', method: 'rss', host: 'www.insee.fr', family: 'economie', depth: 'Fenêtre RSS officielle' },
  { id: 'insee-conjoncture', name: 'INSEE · conjoncture et inflation', url: 'https://www.insee.fr/fr/flux/3', method: 'rss', host: 'www.insee.fr', family: 'economie', depth: 'Fenêtre RSS officielle' },
  { id: 'amundi', name: 'Amundi · actualités et avis', url: 'https://www.amundietf.fr/sitemap/sitemap.xml', method: 'sitemap', host: 'www.amundietf.fr', family: 'etf', depth: 'Toutes les URL françaises des actualités du sitemap' },
  { id: 'wisdomtree', name: 'WisdomTree · communiqués européens', url: 'https://www.wisdomtree.com/fr/press-room', method: 'links', host: 'www.wisdomtree.com', family: 'etf', depth: 'Archive rendue par le serveur, sans pagination supposée' },
  ...[
    ['credit', 'Crédits aux particuliers', '7157', '7166'],
    ['savings', 'Épargne des ménages', '7171', '7176'],
    ['debt', 'Endettement des ménages et des SNF', '5412505', '5412509'],
  ].map(([id, label, theme, sub]) => ({ id: `bdf-${id}`, name: `Banque de France · ${label}`, url: `https://www.banque-france.fr/fr/publications-et-statistiques/statistiques?theme%5B${theme}%5D=${theme}&sub_theme%5B${sub}%5D=${sub}`, method: 'bdf-cards', host: 'www.banque-france.fr', family: 'economie', depth: 'Première page thématique ; liens datés, pagination non supposée' })),
  { id: 'dws', name: 'DWS / Xtrackers · communiqués', url: 'https://www.dws.com/en-gb/Our-Profile/media/media-releases/', method: 'dws-model', host: 'www.dws.com', family: 'etf', depth: 'Résultats du modèle officiel rendu ; archive limitée à ce modèle' },
  { id: 'drees', name: 'DREES', url: 'https://drees.solidarites-sante.gouv.fr/', method: 'links', host: 'drees.solidarites-sante.gouv.fr', family: 'economie', depth: 'Accueil public ; contrôle du contenu anti-robot' },
  { id: 'dares', name: 'DARES', url: 'https://dares.travail-emploi.gouv.fr/', method: 'links', host: 'dares.travail-emploi.gouv.fr', family: 'economie', depth: 'Accueil public ; contrôle du contenu anti-robot' },
]
const hash = text => createHash('sha256').update(text).digest('hex')
const normal = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
export const statisticalTopic = text => housingTopic(text) || /salaires?|remunerations?|patrimoine|niveaux? de vie|inegalites?|logements?|inflation|prix a la consommation|retraites?|prestations?|pouvoir d.achat|epargne|credit.*(?:immobilier|habitat)|credits? aux particuliers|endettement|revenus?|pauvrete/.test(normal(text))
const tag = (text, name) => cleanText(text.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, 'i'))?.[1] ?? '')
export function canonicalUrl(value) {
  const url = new URL(value)
  for (const name of [...url.searchParams.keys()]) if (/^(utm_|xtor$|fbclid$)/i.test(name)) url.searchParams.delete(name)
  url.hash = ''; url.searchParams.sort()
  return url.href.replace(/\/$/, '')
}
function official(value, source) {
  const url = new URL(value, source.url)
  if (url.protocol !== 'https:' || url.hostname !== source.host || url.port || url.username || url.password) throw new Error('URL hors périmètre officiel')
  return canonicalUrl(url.href)
}
// A pure INSEE book index is a discovery document, not a numerical abstract.
// Follow only explicitly labelled chapters in the existing household themes.
export function inseeBookChapters(html, source, url) {
  if (source.host !== 'www.insee.fr') return null
  let parentUrl; try { parentUrl = new URL(official(url,source)) } catch { return null }
  if(parentUrl.search)return null
  const parent = parentUrl.pathname.match(/^\/fr\/statistiques\/(\d+)$/)?.[1]
  if (!parent || !/<div\b[^>]*class=["'][^"']*\bproduit-sommaire\b[^"']*\bsommaire-seul\b/i.test(html)) return null
  const start = [...html.matchAll(/<nav\b[^>]*class=["'][^"']*\bsommaire-container\b[^"']*["'][^>]*>/gi)]
    .find(match => new RegExp(`data-produit=["']${parent}["']`).test(match[0]))
  if (!start) return null
  const section = htmlElement(html, start.index), chapters = new Map(), excluded = new Map()
  for (const [, href, content] of section.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let child; try { child = new URL(official(cleanText(href), source)) } catch { continue }
    const id = child.pathname.match(/^\/fr\/statistiques\/(\d+)$/)?.[1]
    if (!id || id === parent || child.searchParams.get('sommaire') !== parent) continue
    // The publisher's default document route has its own title/paragraphs;
    // sommaire only wraps it in the parent book's header and abstract.
    child.searchParams.delete('sommaire')
    if (child.search) continue
    const key = canonicalUrl(child.href), title = cleanText(content)
    if (!title || !statisticalTopic(title) || editorialExclusion({label:title})) {
      if (!chapters.has(key)) excluded.set(key, {url:key,title,reason:!title?'Lien sans titre statistique qualifié':'Chapitre hors des thèmes ménages suivis'})
      continue
    }
    chapters.set(key,{url:key,title,discoveredHref:official(cleanText(href), source)})
    excluded.delete(key)
  }
  if (!chapters.size) return null // An empty/unidentified index is not a healthy result.
  return {chapters:[...chapters.values()],excluded:[...excluded.values()],sourceHash:hash(html)}
}
export function discoverPublications(content, source) {
  if (/Request Rejected|Access Denied|captcha|Incapsula incident|Vérification de sécurité|Please enable JavaScript to view the page content/i.test(content) && content.length < 100000) throw new Error('Accès refusé ou page anti-robot, même si HTTP 200')
  const consumer = discoverConsumer(content, source)
  if (consumer) return consumer
  const rows = []
  if (source.id === 'bdf-credit') {
    const xml = parseOfficialListing(content, { id: 'banque-france-credit' })
    for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) rows.push({ url: official(tag(item,'link'),source), title: tag(item,'title'), publishedAt: tag(item,'pubDate') })
  } else if (source.method === 'bdf-cards') {
    for (const [, href, card] of content.matchAll(/<a\b[^>]*href\s*=\s*"([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
      const title = tag(card,'h3')
      if (!title || !statisticalTopic(title) || !/^\/fr\/(?:statistiques\/|publications-et-statistiques\/statistiques\/credits-aux-particuliers-)/.test(href)) continue
      const match = normal(cleanText(card)).match(/\b(\d{1,2}) (janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre) (20\d{2})\b/)
      if (!match) throw new Error('Date officielle de carte Banque de France absente')
      rows.push({ url: official(href,source), title, publishedAt: `${match[3]}-${String(MONTHS.indexOf(match[2])+1).padStart(2,'0')}-${match[1].padStart(2,'0')}` })
    }
  } else if (source.method === 'dws-model') {
    const raw = content.match(/<vue-media-releases-page[^>]*:model="([^"]+)"/i)?.[1]
    const model = JSON.parse(cleanText(raw ?? ''))
    if (model.headline !== 'Media Releases' || !Array.isArray(model.results) || !model.results.length) throw new Error('Modèle DWS de communiqués absent')
    for (const row of model.results) if (/ETF|Xtrackers/i.test(row.headline)) {
      const date = row.date?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (!date) throw new Error('Date du communiqué DWS absente')
      rows.push({ url: official(row.linkUrl.href, source), title: row.headline, publishedAt: `${date[3]}-${date[2]}-${date[1]}` })
    }
  } else if (source.method === 'rss') {
    if (!/<rss\b|<feed\b/i.test(content)) throw new Error('Flux structuré absent')
    for (const [, item] of content.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
      const title = tag(item, 'title')
      if (statisticalTopic(title)) rows.push({ url: official(tag(item, 'link'), source), title, hint: tag(item, 'pubDate') })
    }
  } else if (source.method === 'sitemap') {
    if (!/<urlset\b/i.test(content)) throw new Error('Sitemap officiel absent')
    for (const [, item] of content.matchAll(/<url>([\s\S]*?)<\/url>/gi)) {
      const url = tag(item, 'loc')
      if (url.includes('/fr/professionnels/a-propos/news/')) rows.push({ url: official(url, source), hint: tag(item, 'lastmod') })
    }
    rows.sort((a,b) => b.hint.localeCompare(a.hint))
  } else {
    for (const [, href, html] of content.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
      const title = cleanText(html)
      if (source.family === 'etf' ? !/\/fr\/press-room\/.+/.test(href) : !statisticalTopic(title) || !/publication|etudes|resultats/.test(href)) continue
      try { rows.push({ url: official(href, source), title }) } catch { /* Ignore navigation to another domain. */ }
    }
  }
  // Empty relevant subset is healthy only when a real source listing was parsed.
  if (!rows.length && source.method !== 'rss') throw new Error('Extraction vide anormale : aucune publication découverte')
  return [...new Map(rows.map(row => [row.url, row])).values()]
}
const MONTHS = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre']
export function publicationDate(html, source) {
  let date = html.match(/(?:property|name)=["'](?:article:published_time|datePublished)["'][^>]*content=["'](\d{4}-\d{2}-\d{2})/i)?.[1]
    ?? html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})/)?.[1]
  if (source.host === 'www.insee.fr') {
    const part = html.match(/<div\b[^>]*class="date-diffusion[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? ''
    const match = cleanText(part).match(/(\d{2})\/(\d{2})\/(\d{4})/)
    if (match) date = `${match[3]}-${match[2]}-${match[1]}`
  }
  if (source.id === 'amundi') {
    const metadata = html.match(/class="am-date-and-tag[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? ''
    const match = normal(cleanText(metadata)).match(/(\d{1,2}) ([a-z]+) (20\d{2})/)
    if (match && MONTHS.includes(match[2])) date = `${match[3]}-${String(MONTHS.indexOf(match[2])+1).padStart(2,'0')}-${match[1].padStart(2,'0')}`
  }
  if (source.id === 'drees') {
    const header = [...html.matchAll(/class="article-header-separator"[^>]*>([\s\S]*?)<\/span>/g)].map(m=>cleanText(m[1])).join(' ')
    const match = header.match(/Paru le (\d{2})\/(\d{2})\/(\d{4})/)
    if (match) date = `${match[3]}-${match[2]}-${match[1]}`
  }
  if (source.id === 'wisdomtree') {
    const nearTitle = html.slice(html.indexOf('</h1>'), html.indexOf('</h1>')+600)
    const match = normal(cleanText(nearTitle)).match(/publie le (\d{1,2}) ([a-z]+) (20\d{2})/)
    if (match && MONTHS.includes(match[2])) date = `${match[3]}-${String(MONTHS.indexOf(match[2])+1).padStart(2,'0')}-${match[1].padStart(2,'0')}`
  }
  if (!date || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) throw new Error('Date de publication absente : collecte et lastmod ne la remplacent pas')
  return date
}
export function parsePublication(html, source, url, now = new Date(), listing = {}) {
  if(source.format && /<html\b/i.test(html)){
    const canonical=html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/i)?.[1]
    if(canonical && canonicalUrl(canonical)!==canonicalUrl(url))throw Error('Page canonique différente du document demandé')
  }
  const headline=listing.title??tag(html,'h1')
  const issuerRelay=/\bETF/i.test(headline) && (source.id==='credit-agricole-news' && /^Amundi\b/i.test(headline) || source.id==='bnp-bank' && /^BNP Paribas (?:Asset Management|AM)\b/i.test(headline))
  if(source.method.startsWith('consumer-') && !issuerRelay) {
    const observation=parseConsumer(html,{...source,primaryHosts:PUBLICATION_SOURCES.filter(s=>s.evidenceLevel!=='journalistic').map(s=>s.host)},url,now,listing)
    if(listing.publicationDateEvidence)observation.evidence={...observation.evidence,publicationDateEvidence:listing.publicationDateEvidence}
    return observation
  }
  if(source.requireUcits && !/\bUCITS\b/i.test(cleanText(html)))return {rejected:'Annonce sans statut UCITS documenté ; lancement américain non généralisé à la France',title:listing.title}
  if(issuerRelay)source={...source,family:'etf'}
  if(source.id==='dvf'){
    const dataset=JSON.parse(html),resource=dataset.resources?.[0]
    if(dataset.slug!=='demandes-de-valeurs-foncieres'||!resource)throw Error('Livraison DVF invalide')
    return {family:'economie',entity:'dvf-dgfip',field:'release',fieldLabel:'Livraison de données DVF',factType:'dataset-release',label:`DVF : ${resource.title}`,value:{resources:dataset.resources.map(r=>({id:r.id,title:r.title,updatedAt:r.last_modified,checksum:r.checksum??null}))},sourceUrl:source.url,publicationId:`dvf:${resource.id}:${resource.last_modified}`,publishedAt:null,period:resource.title,referencePeriod:resource.title,checkedAt:now.toISOString(),scope:'France, couverture et exclusions DGFiP décrites dans la notice DVF',rule:'publication',discovery:true,summary:dataset.description.slice(0,1500),evidence:{sourceHash:hash(html),excerpt:resource.title,method:'Métadonnées API officielles ; last_modified ne prouve pas une date de publication statistique.'},housing:{...housingConventions(dataset.description,'dvf'),license:dataset.license,resourceUpdatedAt:resource.last_modified,localQualification:{...qualifyDvfSales([]),sampleSize:null,reason:'Aucun lot de transactions locales qualifié ; aucun prix local ni évolution mensuelle produit.'}},reason:'Nouvelle livraison ou révision de données brutes ; aucun prix local déduit du nom du fichier.',angle:'Attendre une série de transactions comparables et représentatives avant de calculer un prix local.'}
  }
  const publishedAt = source.format ? extraDate(html,source,listing) : source.method.startsWith('extra-') ? extraDate(html,source,listing) : (source.id === 'dws' || source.id.startsWith('bdf-')) && listing.publishedAt ? listing.publishedAt : publicationDate(html, source)
  if (Date.parse(publishedAt) > +now) throw new Error('Publication datée dans le futur')
  const title = source.host === 'www.insee.fr' ? cleanText(html.match(/<span\b[^>]*class="titre-titre"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? '') : tag(html, 'h1') || listing.title
  if (!title || title.length > 700) throw new Error('Titre de publication absent ou anormal')
  if (editorialExclusion({label:title})) return {rejected:editorialExclusion({label:title}),title,publishedAt}
  const publishedInstant=html.match(/(?:property|name)=["']article:published_time["'][^>]*content=["'](\d{4}-\d{2}-\d{2}T[^"']+)/i)?.[1]??html.match(/"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2}T[^"]+)/)?.[1]??null
  const base = {publishedInstant, ...(housingTopic(title) || source.id.startsWith('bdf-credit') || ['notaires-paris','credit-logement','oll'].includes(source.id) ? {topic:'immobilier',housing:housingConventions(title+' '+cleanText(html.slice(html.indexOf('<h1'))),source.id)} : {}), family: source.family, evidenceLevel:'official', sources:[{url,role:'official',label:source.name}], entity: `publication-${hash(url).slice(0,20)}`, field: 'announcement', fieldLabel: 'Publication officielle', label: title, sourceUrl: url, publicationId: url, publisher: source.name, publishedAt, period: publishedAt, checkedAt: now.toISOString(), scope: `Publication officielle · ${source.name}`, discovery: true, rule: 'announcement', priority: 'high', maxAgeDays: 400 }
  if (source.family === 'etf') {
    const parsed = parseEtfDocument(html, title)
    if(source.id==='xetra' && /listing|listed|trad/i.test(title+' '+cleanText(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]??''))) parsed.announcementEvidence={type:'trading',stage:'trading',label:'Cotation annoncée par Deutsche Börse',evidence:title}
    const docId = cleanText(html).match(/Doc ID:\s*(\d{5,12})/)?.[1]
    return { ...base, ...(docId ? { publicationId: `${source.id}:document:${docId}` } : {}), value: title, ...parsed, documentUrl: url, documentHash: hash(html), documentCheckedAt: now.toISOString(), reason: 'Communiqué officiel daté, noms et caractéristiques limités aux associations prouvées.', angle: 'Comparer les expositions annoncées et les produits déjà disponibles. Une cotation ne prouve pas une disponibilité chez un courtier.' }
  }
  let paragraphs = [...html.matchAll(/<p\b[^>]*class="paragraphe-chapeau[^>]*>([\s\S]*?)<\/p>/gi)].map(match => cleanText(match[1]))
  if (!paragraphs.length && source.host === 'www.insee.fr') {
    const bodyParagraphs=[...html.matchAll(/<p\b[^>]*class="paragraphe\s[^>]*>([\s\S]*?)<\/p>/gi)].map(match=>cleanText(match[1])).filter(p=>!/^(?:Télécharge|Références|Consulte)/i.test(p))
    const facts=bodyParagraphs.filter(p=>/\d[\d,.\s]*\s*(?:%|euros|€|millions?|milliards?)/i.test(p))
    paragraphs=(facts.length?facts:bodyParagraphs).slice(0,3)
  }
  if(source.host==='www.insee.fr')paragraphs=paragraphs.filter(p=>!/^(?:Télécharge|Consulte|Version imprimable|Données \()/i.test(p))
  if (source.id === 'drees') paragraphs = [...html.matchAll(/<p\b[^>]*class="fr-text--lead[^>]*>([\s\S]*?)<\/p>/gi)].map(match => cleanText(match[1]))
  if (source.id.startsWith('bdf-')) {
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? ''
    paragraphs = [...main.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match => cleanText(match[1])).filter(text => /\d/.test(text) && text.length > 80).slice(0,3)
    if (!paragraphs.length) paragraphs = [...main.matchAll(/<div\b[^>]*id="textContent\d+"[^>]*>([\s\S]*?)<\/div>/gi)].map(match => cleanText(match[1])).filter(text => /\d/.test(text) && text.length > 80).slice(0,3)
  }
  if (!paragraphs.length && source.id === 'bdf-debt') {
    const table = [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map(match => match[1]).find(text => /20\d{2}/.test(cleanText(text)))
    if (table) paragraphs = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].slice(0,5).map(match => [...match[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(cell=>cleanText(cell[1])).join(' · '))
  }
  let chartEvidence=null
  if(!paragraphs.length&&source.id==='bdf-debt'){
    chartEvidence=bdfDebtCharts(html,title,publishedAt)
    paragraphs=[chartEvidence.summary]
  }
  let summary
  try { summary = source.method.startsWith('extra-') ? extraSummary(html,source) : paragraphs.join('\n\n') } catch(error) {
    if(source.id!=='oll')throw error
    summary = tagContent(html,'h1')
  }
  const diffusion=source.id==='credit-logement'?creditLogementDiffusion(html):null
  if(diffusion&&Date.parse(diffusion)>+now)throw Error('Diffusion CSA future ; événement attendu distinct d’une publication parue')
  const metadataOnly = source.id==='credit-logement' && !diffusion || source.id==='oll' && !/[%€]|euros/i.test(summary)
  if (!summary || !/\d/.test(summary)) {
    const book = !listing.observation && !listing.lastValidObservation && inseeBookChapters(html,source,url)
    if (book) return {rejected:`Sommaire d’ouvrage, sans résumé statistique propre : ${book.chapters.length} chapitres ménages découverts, extraction individuelle différée.`,title,publishedAt,bookDiscovery:book}
    throw new Error('Résumé statistique chiffré absent : extraction à adapter')
  }
  if (!statisticalTopic(title)) return { rejected: 'Publication hors des thèmes ménages suivis', title, publishedAt }
  // A publication's edition year is not necessarily its statistical reference year.
  const years = [...new Set(summary.match(/\b20\d{2}\b/g) ?? [])].sort()
  const year = source.id === 'drees' ? null : statisticalPeriod(title)
  const dataPeriods = years
  return { ...base, field: 'publication', rule: 'publication', factType: metadataOnly ? 'publication-watch' : 'statistical-publication', ...(source.id==='credit-logement'?{publishedAt:diffusion,period:diffusion??base.period,sourceDeclaredPublicationDate:publishedAt,publicationDateNote:diffusion?'Diffusion des résultats explicitement annoncée lors de la conférence ; métadonnée WordPress conservée séparément.':'La date de la métadonnée peut être celle du mois statistique ; date de diffusion non certifiée. Les données restent à suivre.'}:{}), referencePeriod: chartEvidence?.period ?? year ?? null, dataPeriods:chartEvidence?[chartEvidence.period]:dataPeriods, value: summary, summary, evidence: { sourceHash: hash(html), excerpt: summary, ...(chartEvidence?{controlledSeries:chartEvidence.series}:{}), method: chartEvidence?'Données littérales des deux graphiques officiels ; dernier trimestre, axes, populations et unités contrôlés sans exécuter le JavaScript.':source.id==='credit-logement'?'Tableau officiel des taux fixes, colonnes et périodes conservées ; diffusion qualifiée seulement par une présentation explicitement datée.':'Paragraphes du chapeau officiel, sans réécriture générative' }, reason: 'Publication statistique officielle : un repère pour comprendre les revenus, le patrimoine ou les dépenses. La portée reste celle du texte cité.', angle: 'Partir du chiffre principal du résumé officiel et préciser la population, la période et les limites avant de comparer.' }
}

// Durable FIFO with exponential retry. No age-based deletion, and no lastmod as publication date.
export async function collectPublications(now = new Date(), request = fetch, previous = {}, sources = PUBLICATION_SOURCES, budget) {
  const started = Date.now(), metrics = { requests: 0, bytes: 0, notModified: 0, attemptedDocuments:0 }
  const state = structuredClone(previous), errors = [], reports = []
  state.documents ??= {}; state.sources ??= {}; state.documentDurationsMs ??= []; state.offerReferences ??= {}
  // Versioned requalification only for existing rejected/partial adapters. No global replay.
  const parserVersion = source => source.host==='www.insee.fr' ? 4 : source.method.startsWith('consumer-') || source.format || source.family==='etf' || source.method==='offer-watch' || source.id==='insee-studies' ? 3 : source.id==='bdf-debt'?1:source.parserVersion
  sources=sources.map(source=>({...source,parserVersion:Math.max(source.parserVersion??0,parserVersion(source)??0)}))
  const requestContent = async (url, cached, limit = 2500000, body = null) => {
    const response = await requestRadarSource(request,url, { ...(body?{method:'POST',body:JSON.stringify(body)}:{}), signal: AbortSignal.timeout(25000), headers: { ...(body?{'Content-Type':'application/json'}:{}), 'User-Agent': 'EpargnantLibre-Radar/2.0', Accept: body?'application/json':'application/rss+xml, application/xml, application/json, text/html, application/pdf', ...(cached?.etag ? {'If-None-Match': cached.etag} : {}), ...(cached?.lastModified ? {'If-Modified-Since': cached.lastModified} : {}) } },()=>metrics.requests++)
    if (response.status === 304) { metrics.notModified++; return { unchanged: true } }
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (response.url && new URL(response.url).hostname !== new URL(url).hostname) throw new Error('Redirection hors du domaine officiel')
    const bytes = await response.arrayBuffer()
    metrics.bytes += bytes.byteLength
    if (bytes.byteLength > limit) throw new Error(`Source trop volumineuse (${bytes.byteLength})`)
    const pdf=Buffer.from(bytes).subarray(0,5).toString()==='%PDF-'
    const extracted=pdf ? await documentText(new Response(bytes,{headers:response.headers})) : null
    return { content: extracted ?? new TextDecoder(response.headers.get('content-type')?.match(/charset=([^; ]+)/i)?.[1] ?? 'utf-8').decode(bytes), etag: response.headers.get('etag'), lastModified: response.headers.get('last-modified') }
  }
  const discoveryRequest=async (url,options)=>{
    const response=await requestRadarSource(request,url,options,()=>metrics.requests++)
    const bytes=await response.clone().arrayBuffer()
    metrics.bytes+=bytes.byteLength
    if(bytes.byteLength>2500000)throw Error('Inventaire auxiliaire trop volumineux')
    return response
  }
  await Promise.all(sources.map(async source => {
    const old = state.sources[source.id] ?? {}, report = { ...old, id: source.id, name: source.name, url: source.url, method: source.method, depth: source.depth, attemptedAt: now.toISOString() }
    try {
      // Sitemap is large: daily check; RSS and listing every hour.
      const discoveryVersion=source.discoveryVersion ?? (source.id==='insee-studies'?3:undefined)
      const discoveryChanged=discoveryVersion!==undefined && old.discoveryVersion!==discoveryVersion
      if (!old.nextCheckAt || Date.parse(old.nextCheckAt) <= +now || discoveryChanged) {
        const result = await requestContent(source.url, discoveryChanged || old.archiveWarning ? null : old, source.method === 'sitemap' ? 25000000 : 2500000,source.method==='insee-search'?inseeQuery(0):null)
        if(result.unchanged && !old.lastSuccessAt)throw Error('Réponse 304 sans inventaire validé conservé')
        if (!result.unchanged) {
          assertRadarAccess(result.content)
          const rows = offerDiscovery(result.content,source) ?? await inseeDiscovery(result.content,source,discoveryRequest) ?? await coverageDiscovery(result.content,source,discoveryRequest) ?? await extraDiscovery(result.content,source,discoveryRequest) ?? discoverPublications(result.content, source)
          report.discovered = rows.length
          report.archiveWarning=rows.archiveWarning??null
          report.discoveryFailures=rows.discoveryFailures??[]
          report.expectedListingItems=rows.expectedListingItems??rows.length
          report.discoveryDateEvidence=rows.filter(row=>row.publicationDateEvidence).map(row=>({url:row.url,...row.publicationDateEvidence}))
          for (const row of rows) {
            const existing=state.documents[row.url]
            if(source.id==='hanetf' && !row.title)row.title=existing?.observation?.label??existing?.title
            if(existing && existing.source===source.id && (existing.title!==row.title || (existing.description??'')!==(row.description??'') || (existing.publishedAt??null)!==(row.publishedAt??null) || (existing.listingRejection??null)!==(row.listingRejection??null))) {
              Object.assign(existing,row,{listingRejected:Boolean(row.listingRejection),nextAttemptAt:now.toISOString(),...(row.listingRejection ? {status:'rejected',reason:row.listingRejection}: {status:'pending'})})
            }
            state.documents[row.url] ??= { ...row, backfill: !old.lastSuccessAt || source.id==='hanetf' && discoveryChanged || source.id==='insee-studies' && old.discoveryVersion!==3, source: source.id, discoveredAt: now.toISOString(), attempts: 0, status: row.listingRejection ? 'rejected' : 'pending', ...(row.listingRejection ? {reason:row.listingRejection,listingRejected:true}: {}) }
          }
          report.etag = result.etag; report.lastModified = result.lastModified
        }
        report.discoveryVersion=discoveryVersion??old.discoveryVersion
        report.checkedAt = now.toISOString(); report.lastSuccessAt = report.checkedAt; report.status = report.archiveWarning?'partial':'ok'; delete report.error; delete report.failureKind
        if(report.archiveWarning)report.failureKind=sourceFailureKind(report.archiveWarning)
        if(report.archiveWarning)errors.push({family:source.family,entity:source.name,reason:report.archiveWarning})
        report.nextCheckAt = new Date(+now+(source.method === 'sitemap' ? 1440 : source.cadenceMinutes ?? 60)*60000).toISOString()
      }
    } catch (error) { report.status = 'error'; report.error = error.message; report.failureKind=sourceFailureKind(error); errors.push({ family: source.family, entity: source.name, reason: error.message }) }
    state.sources[source.id] = report; reports.push(report)
  }))
  const owners=new Map(sources.map(source=>[source.id,source]))
  const upgradeNeeded=item=>{
    const source=owners.get(item.source)
    return source?.host==='www.insee.fr' && item.status==='error' && item.error==='Résumé statistique chiffré absent : extraction à adapter' || source?.id==='bdf-debt' && ['error','partial','rejected'].includes(item.status) || source?.id==='credit-logement' || source?.id==='revolut-news' || source?.method==='offer-watch' || source?.id==='xetra' || (source?.family==='etf'||item.observation?.family==='etf') && item.observation && !item.observation.products?.length || item.observation?.evidenceLevel==='journalistic' || item.status==='rejected' && (source?.format || source?.method.startsWith('consumer-')) && !consumerRejection(item.title??'',item.description??'')
  }
  const parserDue=item=>upgradeNeeded(item) && owners.get(item.source)?.parserVersion && item.parserVersion!==owners.get(item.source).parserVersion && item.parserVersionAttempted!==owners.get(item.source).parserVersion
  const due = Object.entries(state.documents).filter(([, item]) => (!item.listingRejected || parserDue(item)) && (parserDue(item) || !item.nextAttemptAt || Date.parse(item.nextAttemptAt) <= +now))
    .sort((a,b) => (a[1].attemptedAt ?? '').localeCompare(b[1].attemptedAt ?? '') || (b[1].processingPriority??0)-(a[1].processingPriority??0) || b[1].discoveredAt.localeCompare(a[1].discoveredAt))
  // Round-robin across sources: a prolific archive cannot starve the others.
  const requalificationIds=new Set(due.filter(([,item])=>parserDue(item)).map(([url])=>url))
  const queuePlan=planPublicationQueue(due,sources,now,state,budget,{requalificationIds})
  const chosen=queuePlan.chosen
  state.queuePass=(state.queuePass??0)+1
  if(chosen.length) state.nextSourceIndex=(sources.findIndex(source=>source.id===chosen.at(-1)[1].source)+1)%sources.length
  const processingStarted = Date.now()
  for (const [url, item] of chosen) {
    if (Date.now()-processingStarted > 90000) break // remaining documents stay pending durably
    const source = sources.find(source => source.id === item.source)
    const existingParserRecord=item.status==='rejected'||item.status==='partial'||item.attempts>0
    const requalifying=Boolean(upgradeNeeded(item) && source.parserVersion && item.parserVersion!==source.parserVersion), migrating=requalifying&&Boolean(item.observation)
    if(requalifying)item.parserVersionAttempted=source.parserVersion
    // Former listing-level rejects must be reconsidered by the matching new parser.
    if(requalifying && item.listingRejected){item.listingRejected=false;delete item.listingRejection}
    const documentStarted=Date.now(), wasError=['error','partial'].includes(item.status)
    const admittedClass=queueClass(item,now)
    if(!Object.hasOwn(item,'firstAttemptAt'))item.firstAttemptAt=item.attempts===0?now.toISOString():item.attempts===1?item.attemptedAt??null:null
    item.queueClass=admittedClass; item.lastQueueServiceAt=now.toISOString()
    item.attemptedAt = now.toISOString(); item.attempts++; metrics.attemptedDocuments++
    try {
      // Xtrackers serves HTTP 500 without its canonical trailing slash.
      // Keep stable deduplication keys, but request the official route.
      const fetchUrl = source.id === 'xtrackers' ? url.replace(/\/$/, '') + '/' : url
      // A 304 cannot validate a new parser against text that was not retained.
      const result = await requestContent(fetchUrl, requalifying||item.status==='partial'?null:item, 5000000)
      if (result.unchanged) {
        if (requalifying && source.host==='www.insee.fr') throw Error('Réponse 304 sans texte pour qualifier le nouvel adaptateur de sommaire')
        if (item.observation || item.offerBaseline) item.status = 'done'
        else if (item.reason) item.status = 'rejected'
        else throw new Error('Réponse 304 sans extraction ou rejet conservé.')
      }
      if (!result.unchanged) {
        if(source.method==='offer-watch') {
          const snapshot=offerSnapshot(result.content,source,now,item)
          const previousReference=item.offerBaseline??(item.backfill?undefined:state.offerReferences[snapshot.referenceKey])
          const ordered=!previousReference?.dates.effectiveAt || !snapshot.dates.effectiveAt || snapshot.dates.effectiveAt>=previousReference.dates.effectiveAt
          const omissions=unexplainedOfferOmissions(previousReference,snapshot)
          const change=(!item.offerBaseline&&item.backfill)||!ordered||omissions.length ? null : compareOfferSnapshots(previousReference,snapshot,source,url)
          if(item.offerBaseline&&item.offerBaseline.semanticVersion!==snapshot.semanticVersion)item.parserBaselineBeforeMigration??=item.offerBaseline
          const familyReference=state.offerReferences[snapshot.referenceKey]
          const familyOrder=familyReference?.dates.effectiveAt??familyReference?.edition??''
          const snapshotOrder=snapshot.dates.effectiveAt??snapshot.edition??''
          if(ordered&&!omissions.length&&snapshotOrder>=familyOrder)state.offerReferences[snapshot.referenceKey]=snapshot
          if(change){item.observation=change;item.backfill=false;item.previousOfferVersion=previousReference}
          if(omissions.length){item.offerCoverage={status:'partial',reason:'Clauses non retrouvées : aucune suppression établie',omissions};item.latestOfferCandidate=snapshot;item.status='partial';item.partialReason=item.offerCoverage.reason}
          else {item.offerBaseline=snapshot;delete item.offerCoverage;delete item.latestOfferCandidate;item.status='done'}
          item.firstObservedAt??=now.toISOString();item.availableAt??=now.toISOString()
        } else {
        let observation = parsePublication(result.content, source, url, now, item)
        if(observation.family==='etf' && observation.announcedProductCount>0 && !observation.products?.length){
          const main=result.content.match(/<main\b[^>]*>/i)
          const body=main?htmlElement(result.content,main.index):articleBody(result.content)||result.content
          const links=[...body.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)].flatMap(m=>{try{const u=new URL(cleanText(m[1]),url);return u.hostname===source.host&&/\.pdf(?:$|&)|\.pdf$/i.test(u.href)?[u.href]:[]}catch{return[]}})
          const uniqueLinks=[...new Set(links)]
          observation.extraction={...(observation.extraction??{}),status:'partial',reason:'Gamme annoncée mais tous les produits ne sont pas encore extractibles ; complément officiel en attente.'}
          if(uniqueLinks.length===1)try{
            const supplement=await requestContent(uniqueLinks[0],null,5000000)
            const details=parseEtfDocument(supplement.content,observation.label)
            observation={...observation,products:details.products,supportingCalendarEvidence:details.calendarEvidence,supportingDocuments:[{url:uniqueLinks[0],sourceHash:hash(supplement.content)}],extraction:{...details.extraction,status:details.products.length>=observation.announcedProductCount?'complete':'partial',reason:details.products.length>=observation.announcedProductCount?null:'Produits annoncés non tous extractibles du PDF associé'}}
          }catch(error){observation.extraction={status:'partial',reason:'PDF officiel associé : '+error.message}}
        }
        if (observation.bookDiscovery) {
          if(requalifying)item.backfill=true // Structural migration is not a new publication.
          item.bookDiscovery={...observation.bookDiscovery,checkedAt:now.toISOString(),parentPublishedAt:observation.publishedAt}
          for (const child of observation.bookDiscovery.chapters) state.documents[child.url]??={...child,source:source.id,backfill:Boolean(item.backfill||requalifying),discoveredAt:now.toISOString(),attempts:0,status:'pending',discoveredVia:url}
        }
        if (observation.rejected) { item.status = 'rejected'; item.reason = observation.rejected; delete item.observation }
        else {
          const prior=item.observation
          const complete=item.lastValidObservation??prior
          if(observation.extraction?.status==='partial'&&complete&&complete.extraction?.status!=='partial'){
            item.lastValidObservation=complete
            item.partialCandidate=observation
            observation={...complete,extraction:{...observation.extraction,lastValidAt:complete.checkedAt}}
          }else if(observation.extraction?.status!=='partial') {delete item.partialCandidate;delete item.lastValidObservation}
          const newPublication=prior && observation.publishedAt>prior.publishedAt
          const newDatedCorrection=prior && observation.status==='Correction / démenti' && observation.correctionPublishedAt>=item.discoveredAt.slice(0,10) && JSON.stringify(observation.value)!==JSON.stringify(prior.value)
          if(newPublication || newDatedCorrection)item.backfill=false
          observation.backfill=item.backfill??false; item.observation = observation; item.status = 'done'; item.availableAt ??= now.toISOString(); item.detectionDelayHours = (+new Date(item.discoveredAt)-Date.parse(observation.publishedAt))/3600000; item.availabilityDelayHours = (Date.parse(item.availableAt)-Date.parse(item.discoveredAt))/3600000 }
        }
        item.etag = result.etag; item.lastModified = result.lastModified
        // Search explicitly linked originals in our qualified source domains.
        // Discovery remains separate from confirmation; fetching occurs through
        // the same bounded queue on a later pass, with normal failure recovery.
        for(const reference of item.observation?.sources?.filter(row=>row.role==='original-link-unverified').slice(0,2) ?? []) {
          let original;try{original=canonicalUrl(reference.url)}catch{continue}
          const owner=sources.find(row=>row.host===new URL(original).hostname)
          if(owner && new URL(original).pathname.split('/').filter(Boolean).length>=3 && !/\.(?:pdf|png|jpg)$/i.test(new URL(original).pathname))state.documents[original]??={url:original,source:owner.id,backfill:item.backfill,discoveredAt:now.toISOString(),attempts:0,status:'pending',discoveredVia:url}
        }
      }
      if(source.parserVersion)item.parserVersion=source.parserVersion
      if(requalifying && item.observation && (migrating || existingParserRecord))item.observation.parserMigration=true
      if(item.observation?.extraction?.status==='partial'){item.status='partial';item.partialReason=item.observation.extraction.reason;if(!wasError||!item.firstFailureAt)item.firstFailureAt=now.toISOString()}
      else if(item.status==='partial'){if(!wasError||!item.firstFailureAt)item.firstFailureAt=now.toISOString()}
      else if(wasError){item.recoveredAt=now.toISOString();item.failureHistory??=[];item.failureHistory.push({failedAt:item.firstFailureAt,recoveredAt:item.recoveredAt});item.failureHistory=item.failureHistory.slice(-20)}
      item.nextAttemptAt = new Date(+now+(item.status==='partial' ? 2*3600000 : source.method==='offer-watch' ? source.cadenceMinutes*60000 : source.method.startsWith('consumer-') ? 3600000 : 7*86400000)).toISOString(); delete item.error; delete item.failureKind
    } catch (error) { if(!wasError||!item.firstFailureAt)item.firstFailureAt=now.toISOString();item.lastFailureAt=now.toISOString(); item.status = 'error'; item.error = error.message; item.failureKind=sourceFailureKind(error); item.nextAttemptAt = new Date(+now+Math.min(24, 2**Math.min(item.attempts,5))*3600000).toISOString(); errors.push({ family: source.family, entity: url, reason: error.message }) }
    finally { state.documentDurationsMs.push(Date.now()-documentStarted);state.documentDurationsMs=state.documentDurationsMs.slice(-120);if(item.observation?.publishedInstant)item.publishedInstant=item.observation.publishedInstant;Object.assign(item,documentDelays(item)) }
  }
  // Existing first-party publication proofs remain valid: hydrate missing attribution metadata
  // only for a previously extracted document on its registered official host.
  // This neither changes values/dates nor creates a market event.
  for(const document of Object.values(state.documents)) {
    const observation=document.observation, owner=sources.find(source=>source.id===document.source)
    if(observation?.discovery && !observation.evidenceLevel && observation.evidence?.sourceHash && owner && owner.evidenceLevel!=='journalistic'){
      let host;try{host=new URL(observation.sourceUrl).hostname}catch{continue}
      if(host!==owner.host)continue
      observation.evidenceLevel='official'
      observation.sources??=[{url:observation.sourceUrl,role:'official',label:owner.name}]
    }
  }
  consolidateOfficialAnnouncements(state)
  relatePublications(state)
  for (const report of reports) {
    const docs = Object.values(state.documents).filter(item => item.source === report.id)
    report.queue = Object.fromEntries(['pending','done','error','rejected','partial'].map(status => [status, docs.filter(item => item.status === status).length]))
    report.extractionStatus=report.queue.partial ? 'partial' : report.queue.error ? 'error' : report.queue.done ? 'validated' : report.queue.pending ? 'pending' : 'no-in-scope-publication'
    report.silentBaselines=docs.filter(item=>item.offerBaseline&&!item.observation).length
    report.lastExtractionSuccessAt=docs.filter(item=>item.observation).map(item=>item.observation.checkedAt).sort().at(-1)??null
  }
  for (const [url,item] of Object.entries(state.documents)) if (item.status === 'error' && !errors.some(error => error.entity === url)) errors.push({ family: sources.find(source => source.id === item.source)?.family ?? 'radar', entity: url, reason: item.error })
  const waiting=Object.values(state.documents).filter(d=>['pending','error','partial'].includes(d.status))
  state.metrics = { ...metrics, queue:{admitted:chosen.length,attempted:metrics.attemptedDocuments,capacity:queuePlan.limit,p90DocumentMs:queuePlan.p90DocumentMs,requalificationsEligible:queuePlan.eligibleRequalifications,requalificationsSelected:chosen.filter(([url])=>requalificationIds.has(url)).length,recentEligible:queuePlan.eligibleRecent,recentFirstAttempted:chosen.filter(([,d])=>d.queueClass==='recent-first-extraction' && d.firstAttemptAt===now.toISOString()).length,recentDeferred:Math.max(0,queuePlan.eligibleRecent-chosen.filter(([,d])=>d.queueClass==='recent-first-extraction'&&d.firstAttemptAt===now.toISOString()).length),pending:waiting.length,oldestWaitHours:waiting.length?Math.max(...waiting.map(d=>(+now-Date.parse(d.discoveredAt))/3600000)):0,objective:queuePlan.objective}, durationMs: Date.now()-started, checkedAt: now.toISOString() }
  state.queueHistory??=[]
  state.queueHistory.push({checkedAt:now.toISOString(),eventName:process.env.GITHUB_EVENT_NAME??'local-qualification',runId:process.env.GITHUB_RUN_ID??null,requests:metrics.requests,bytes:metrics.bytes,durationMs:state.metrics.durationMs,...state.metrics.queue})
  state.queueHistory=state.queueHistory.slice(-512)
  return { state, metrics: state.metrics, sources: reports, errors, observations: Object.values(state.documents).flatMap(item => item.observation ? [item.observation] : []) }
}

// Exact reproduction only: same dated headline, issuer and event nature.
// A theme, approximate wording or matching ISIN alone never merges releases.
export function consolidateOfficialAnnouncements(state) {
 const groups=new Map()
 for(const document of Object.values(state.documents)){
  const o=document.observation
  if(o?.family!=='etf'||!o.documentHash||!o.publishedAt||!o.announcementEvidence||o.correctionOf)continue
  const title=normal(o.label).replace(/[^a-z0-9]+/g,' ').trim()
  if(title.split(' ').length<5||!/^(?:amundi|bnp paribas|dws|invesco|ishares|vanguard|xtrackers|wisdomtree|vaneck|ubs|jpmorgan|spdr|state street|global x)\b/.test(title))continue
  const key=JSON.stringify([title,o.publishedAt,o.announcementEvidence.type])
  const group=groups.get(key)??[];group.push(document);groups.set(key,group)
 }
 for(const group of groups.values()){
  if(group.length<2)continue
  const knownIsins=new Set(group.map(d=>(d.observation.products??[]).map(p=>p.isin).filter(Boolean).sort().join(',')).filter(Boolean))
  if(knownIsins.size>1)continue // Same generic headline can still announce distinct products.
  group.sort((a,b)=>(a.discoveredAt??'').localeCompare(b.discoveredAt??'')||a.observation.publicationId.localeCompare(b.observation.publicationId))
  const primary=group.find(d=>d.observation.eventKey)?.observation??group[0].observation
  const key=primary.eventKey??JSON.stringify([primary.family,primary.publicationId,primary.publishedAt])
  for(const document of group){
   const row=document.observation;row.eventKey=key
   row.sources??=[{url:row.sourceUrl,label:row.publisher,role:'official'}]
   for(const other of group.map(d=>d.observation))if(!row.sources.some(s=>s.url===other.sourceUrl))row.sources.push({url:other.sourceUrl,label:other.publisher,role:'official-matching-announcement',sourceHash:other.documentHash})
  }
 }
}
