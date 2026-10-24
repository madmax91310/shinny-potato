import { EXTRA_SOURCES, extraDiscovery, extraDate, extraSummary, tagContent, statisticalPeriod } from './radar-extra-sources.mjs'
import { housingTopic, housingConventions, qualifyDvfSales } from '../../src/lib/radar-housing.js'
import { createHash } from 'node:crypto'
import { parseOfficialListing } from './purchasing-power-sources.mjs'
import { cleanText } from './purchasing-power-news.mjs'
import { parseEtfDocument } from './radar-news.mjs'
export const PUBLICATION_SOURCES = [
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
export const statisticalTopic = text => housingTopic(text) || /salaires?|remunerations?|patrimoine|niveaux? de vie|inegalites?|logements?|inflation|prix a la consommation|retraites?|prestations?|epargne|credit.*(?:immobilier|habitat)|credits? aux particuliers|endettement|revenus?|pauvrete/.test(normal(text))
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
export function discoverPublications(content, source) {
  if (/Request Rejected|Access Denied|captcha|Incapsula incident|Vérification de sécurité|Please enable JavaScript to view the page content/i.test(content) && content.length < 100000) throw new Error('Accès refusé ou page anti-robot, même si HTTP 200')
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
  if(source.id==='dvf'){
    const dataset=JSON.parse(html),resource=dataset.resources?.[0]
    if(dataset.slug!=='demandes-de-valeurs-foncieres'||!resource)throw Error('Livraison DVF invalide')
    return {family:'economie',entity:'dvf-dgfip',field:'release',fieldLabel:'Livraison de données DVF',factType:'dataset-release',label:`DVF : ${resource.title}`,value:{resources:dataset.resources.map(r=>({id:r.id,title:r.title,updatedAt:r.last_modified,checksum:r.checksum??null}))},sourceUrl:source.url,publicationId:`dvf:${resource.id}:${resource.last_modified}`,publishedAt:null,period:resource.title,referencePeriod:resource.title,checkedAt:now.toISOString(),scope:'France, couverture et exclusions DGFiP décrites dans la notice DVF',rule:'publication',discovery:true,summary:dataset.description.slice(0,1500),evidence:{sourceHash:hash(html),excerpt:resource.title,method:'Métadonnées API officielles ; last_modified ne prouve pas une date de publication statistique.'},housing:{...housingConventions(dataset.description,'dvf'),license:dataset.license,resourceUpdatedAt:resource.last_modified,localQualification:{...qualifyDvfSales([]),sampleSize:null,reason:'Aucun lot de transactions locales qualifié ; aucun prix local ni évolution mensuelle produit.'}},reason:'Nouvelle livraison ou révision de données brutes ; aucun prix local déduit du nom du fichier.',angle:'Attendre une série de transactions comparables et représentatives avant de calculer un prix local.'}
  }
  const publishedAt = source.method.startsWith('extra-') ? extraDate(html,source,listing) : (source.id === 'dws' || source.id.startsWith('bdf-')) && listing.publishedAt ? listing.publishedAt : publicationDate(html, source)
  if (Date.parse(publishedAt) > +now) throw new Error('Publication datée dans le futur')
  const title = source.host === 'www.insee.fr' ? cleanText(html.match(/<span\b[^>]*class="titre-titre"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? '') : tag(html, 'h1') || listing.title
  if (!title || title.length > 700) throw new Error('Titre de publication absent ou anormal')
  const base = { ...(housingTopic(title) || source.id.startsWith('bdf-credit') || ['notaires-paris','credit-logement','oll'].includes(source.id) ? {topic:'immobilier',housing:housingConventions(title+' '+cleanText(html.slice(html.indexOf('<h1'))),source.id)} : {}), family: source.family, entity: `publication-${hash(url).slice(0,20)}`, field: 'announcement', fieldLabel: 'Publication officielle', label: title, sourceUrl: url, publicationId: url, publisher: source.name, publishedAt, period: publishedAt, checkedAt: now.toISOString(), scope: `Publication officielle · ${source.name}`, discovery: true, rule: 'announcement', priority: 'high', maxAgeDays: 400 }
  if (source.family === 'etf') {
    const parsed = parseEtfDocument(html, title)
    if(source.id==='xetra' && /listing|listed|trad/i.test(title+' '+cleanText(html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]??''))) parsed.announcementEvidence={type:'trading',stage:'trading',label:'Cotation annoncée par Deutsche Börse',evidence:title}
    const docId = cleanText(html).match(/Doc ID:\s*(\d{5,12})/)?.[1]
    return { ...base, ...(docId ? { publicationId: `${source.id}:document:${docId}` } : {}), value: title, ...parsed, documentUrl: url, documentHash: hash(html), documentCheckedAt: now.toISOString(), reason: 'Communiqué officiel daté, noms et caractéristiques limités aux associations prouvées.', angle: 'Comparer les expositions annoncées et les produits déjà disponibles. Une cotation ne prouve pas une disponibilité chez un courtier.' }
  }
  if (!statisticalTopic(title)) return { rejected: 'Publication hors des thèmes ménages suivis', title, publishedAt }
  let paragraphs = [...html.matchAll(/<p\b[^>]*class="paragraphe-chapeau[^>]*>([\s\S]*?)<\/p>/gi)].map(match => cleanText(match[1]))
  if (!paragraphs.length && source.host === 'www.insee.fr') paragraphs = [...html.matchAll(/<p\b[^>]*class="paragraphe\s[^>]*>([\s\S]*?)<\/p>/gi)].slice(0,3).map(match => cleanText(match[1]))
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
  let summary
  try { summary = source.method.startsWith('extra-') ? extraSummary(html,source) : paragraphs.join('\n\n') } catch(error) {
    if(source.id!=='oll')throw error
    summary = tagContent(html,'h1')
  }
  const metadataOnly = source.id==='credit-logement' || source.id==='oll' && !/[%€]|euros/i.test(summary)
  if (!summary || !/\d/.test(summary)) throw new Error('Résumé statistique chiffré absent : extraction à adapter')
  // A publication's edition year is not necessarily its statistical reference year.
  const years = [...new Set(summary.match(/\b20\d{2}\b/g) ?? [])].sort()
  const year = source.id === 'drees' ? null : statisticalPeriod(title)
  const dataPeriods = years
  return { ...base, field: 'publication', rule: 'publication', factType: metadataOnly ? 'publication-watch' : 'statistical-publication', ...(source.id==='credit-logement'?{publishedAt:null,sourceDeclaredPublicationDate:publishedAt,publicationDateNote:'La date de la métadonnée peut être celle du mois statistique ; date de diffusion non certifiée. Les données restent à suivre.'}:{}), referencePeriod: year ?? null, dataPeriods, value: summary, summary, evidence: { sourceHash: hash(html), excerpt: summary, method: 'Paragraphes du chapeau officiel, sans réécriture générative' }, reason: 'Publication statistique officielle : un repère pour comprendre les revenus, le patrimoine ou les dépenses. La portée reste celle du texte cité.', angle: 'Partir du chiffre principal du résumé officiel et préciser la population, la période et les limites avant de comparer.' }
}

// Durable FIFO with exponential retry. No age-based deletion, and no lastmod as publication date.
export async function collectPublications(now = new Date(), request = fetch, previous = {}, sources = PUBLICATION_SOURCES, budget = 12) {
  const state = structuredClone(previous), errors = [], reports = []
  state.documents ??= {}; state.sources ??= {}
  const requestContent = async (url, cached, limit = 2500000) => {
    const response = await request(url, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'EpargnantLibre-Radar/2.0', Accept: 'application/xml, text/html, application/rss+xml', ...(cached?.etag ? {'If-None-Match': cached.etag} : {}), ...(cached?.lastModified ? {'If-Modified-Since': cached.lastModified} : {}) } })
    if (response.status === 304) return { unchanged: true }
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (response.url && new URL(response.url).hostname !== new URL(url).hostname) throw new Error('Redirection hors du domaine officiel')
    const bytes = await response.arrayBuffer()
    if (bytes.byteLength > limit) throw new Error(`Source trop volumineuse (${bytes.byteLength})`)
    return { content: new TextDecoder().decode(bytes), etag: response.headers.get('etag'), lastModified: response.headers.get('last-modified') }
  }
  await Promise.all(sources.map(async source => {
    const old = state.sources[source.id] ?? {}, report = { ...old, id: source.id, name: source.name, url: source.url, method: source.method, depth: source.depth, attemptedAt: now.toISOString() }
    try {
      // Sitemap is large: daily check; RSS and listing every hour.
      if (!old.nextCheckAt || Date.parse(old.nextCheckAt) <= +now) {
        const result = await requestContent(source.url, old, source.method === 'sitemap' ? 25000000 : 2500000)
        if (!result.unchanged) {
          const rows = await extraDiscovery(result.content,source,request) ?? discoverPublications(result.content, source)
          report.discovered = rows.length
          for (const row of rows) state.documents[row.url] ??= { ...row, backfill: !old.lastSuccessAt, source: source.id, discoveredAt: now.toISOString(), attempts: 0, status: 'pending' }
          report.etag = result.etag; report.lastModified = result.lastModified
        }
        report.checkedAt = now.toISOString(); report.lastSuccessAt = report.checkedAt; report.status = 'ok'; delete report.error
        report.nextCheckAt = new Date(+now+(source.method === 'sitemap' ? 24 : 1)*3600000).toISOString()
      }
    } catch (error) { report.status = 'error'; report.error = error.message; errors.push({ family: source.family, entity: source.name, reason: error.message }) }
    state.sources[source.id] = report; reports.push(report)
  }))
  const due = Object.entries(state.documents).filter(([, item]) => !item.nextAttemptAt || Date.parse(item.nextAttemptAt) <= +now)
    .sort((a,b) => (a[1].attemptedAt ?? '').localeCompare(b[1].attemptedAt ?? '') || b[1].discoveredAt.localeCompare(a[1].discoveredAt))
  // Round-robin across sources: a prolific archive cannot starve the others.
  const start=(state.nextSourceIndex ?? 0)%sources.length
  const order=[...sources.slice(start),...sources.slice(0,start)]
  const queues = order.map(source => due.filter(([, item]) => item.source === source.id)), chosen = []
  while (chosen.length < budget && queues.some(q => q.length)) for (const q of queues) if (q.length && chosen.length < budget) chosen.push(q.shift())
  if(chosen.length) state.nextSourceIndex=(sources.findIndex(source=>source.id===chosen.at(-1)[1].source)+1)%sources.length
  const processingStarted = Date.now()
  for (const [url, item] of chosen) {
    if (Date.now()-processingStarted > 90000) break // remaining documents stay pending durably
    const source = sources.find(source => source.id === item.source)
    item.attemptedAt = now.toISOString(); item.attempts++
    try {
      // Xtrackers serves HTTP 500 without its canonical trailing slash.
      // Keep stable deduplication keys, but request the official route.
      const fetchUrl = source.id === 'xtrackers' ? url.replace(/\/$/, '') + '/' : url
      const result = await requestContent(fetchUrl, item)
      if (result.unchanged) {
        if (item.observation) item.status = 'done'
        else if (item.reason) item.status = 'rejected'
        else throw new Error('Réponse 304 sans extraction ou rejet conservé.')
      }
      if (!result.unchanged) {
        const observation = parsePublication(result.content, source, url, now, item)
        if (observation.rejected) { item.status = 'rejected'; item.reason = observation.rejected }
        else { observation.backfill = item.observation && observation.publishedAt > item.observation.publishedAt ? false : item.backfill ?? false; item.observation = observation; item.status = 'done'; item.availableAt ??= now.toISOString(); item.detectionDelayHours = (+new Date(item.discoveredAt)-Date.parse(observation.publishedAt))/3600000; item.availabilityDelayHours = (+now-Date.parse(item.discoveredAt))/3600000 }
        item.etag = result.etag; item.lastModified = result.lastModified
      }
      item.nextAttemptAt = new Date(+now+7*86400000).toISOString(); delete item.error
    } catch (error) { item.status = 'error'; item.error = error.message; item.nextAttemptAt = new Date(+now+Math.min(24, 2**Math.min(item.attempts,5))*3600000).toISOString(); errors.push({ family: source.family, entity: url, reason: error.message }) }
  }
  for (const report of reports) {
    const docs = Object.values(state.documents).filter(item => item.source === report.id)
    report.queue = Object.fromEntries(['pending','done','error','rejected'].map(status => [status, docs.filter(item => item.status === status).length]))
  }
  for (const [url,item] of Object.entries(state.documents)) if (item.status === 'error' && !errors.some(error => error.entity === url)) errors.push({ family: sources.find(source => source.id === item.source)?.family ?? 'radar', entity: url, reason: item.error })
  return { state, sources: reports, errors, observations: Object.values(state.documents).flatMap(item => item.observation ? [item.observation] : []) }
}
