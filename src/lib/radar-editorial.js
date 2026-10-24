import { replicationWordingEvent } from './replication-method.js'
// Shared by the UI and notifications: collecting a fact does not make it a post.
export const EDITORIAL_DAYS = 14
export const EDITORIAL_LIMIT = 5
export const SCORE_RULES = Object.freeze({ audience: 30, impact: 25, novelty: 20, comparison: 15, freshness: 10, priority: 65, major: 85, sourceCap: 2, exposureCap: 1 })
export const EDITORIAL_STATES = { ready: 'À exploiter', watch: 'À suivre', secondary: 'Variations secondaires' }
const normal = value => String(value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

// The collection date and a legacy `publication` label cannot establish a new
// reporting period. The guard also applies to events already in the feed.
export function investorFilingType(event) {
  if (event.family !== 'investisseurs' || event.field !== 'filing') return null
  if (event.kind === 'new') return 'coverage'
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') &&
    Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
  if (!validDate(event.period) || !validDate(event.beforePeriod)) return 'unknown'
  if (event.period === event.beforePeriod) return 'revision'
  return event.period > event.beforePeriod ? 'publication' : 'unknown'
}

export function readableInvestorFiling(event) {
  const type = investorFilingType(event)
  if (!type || type === 'publication' || type === 'coverage') return event
  const reason = type === 'revision'
    ? 'Le relevé a changé pour une même période. Cela peut venir de la source ou de la collecte ; cette mise à jour ne prouve pas une nouvelle opération de l’investisseur.'
    : 'Les périodes disponibles ne permettent pas d’établir une nouvelle déclaration.'
  const angle = 'Comparer les relevés et leur périmètre avant de parler de nouveaux achats ou de nouvelles ventes.'
  return { ...event, title: factualTitle(event), reason, angle,
    draft: `${factualTitle(event)}\n\n${reason}\n\nPériode déclarée : ${event.period ?? 'non documentée'}\n${event.scope ?? ''}\n\n${angle}` }
}

// Only explicit issuer wording qualifies an announcement. A launch is not a
// listing, French distribution permission, or availability at a retail broker.
export function etfAnnouncement(title = '') {
  const t = normal(title)
  if (!/\betfs?\b|exchange.traded|\bucits\b/.test(t)) return null
  if (/\b(?:report|research|study|webinar|survey|guide|rapport|etude|guide)\b/.test(t)) return null
  if (/\b(?:not|no|may|might|could|considering|rumour|rumor)\b|ne .*pas|pourrait|envisage/.test(t)) return null
  if (/\b(?:will|plans? to|expected to|scheduled to)\b|lancera|sera |va lancer/.test(t) && /launch|trad(?:e|ing)|list(?:ed|ing)|lanc|negoci/.test(t)) return { type: 'launch', stage: 'announced', label: 'Lancement annoncé', evidence: title }
  if (/nouvelle (?:place de )?cotation|additional listing|cross.list|cote .*sur|lists? .*on/.test(t)) return { type: 'listing', stage: 'trading', label: 'Nouvelle cotation annoncée', evidence: title }
  if (/\b(?:now trading|begins? trading|starts? trading|commences? trading|listed today)\b|desormais (?:cote|negociable)|debut des negociations/.test(t)) return { type: 'first-trading', stage: 'trading', label: 'Première négociation annoncée par l’émetteur', evidence: title }
  if (/\b(?:will launch|plans? to launch|to launch|upcoming launch)\b|lancera|va lancer|lancement (?:prevu|annonce)|sera lance/.test(t)) return { type: 'launch', stage: 'announced', label: 'Lancement annoncé', evidence: title }
  if (/\blaunch(?:es|ed|ing)?\b|\bintroduces?\b|\blance\b|\blancement\b/.test(t)) return { type: 'launch', stage: 'launched', label: 'Lancement déclaré par l’émetteur', evidence: title }
  if (/renforce (?:sa gamme|son offre)|enrichit (?:sa gamme|son offre)|nouvelles solutions|elargit (?:sa gamme|son offre)/.test(t)) return { type: 'announcement', stage: 'candidate', label: 'Nouvelle offre à qualifier', evidence: title }
  return null
}

export function editorialState(event) {
  if (replicationWordingEvent(event) || event.status === 'wording-only') return 'secondary'
  const field = event.field ?? ''
  if (event.factType === 'source-revision') return 'secondary'
  if (event.status === 'source-conflict') return 'secondary'
  if (event.family === 'etf' && field === 'announcement') {
    const announcement = event.announcementEvidence ?? etfAnnouncement(event.label)
    if (event.documentHash && announcement?.stage !== 'candidate' && event.products?.length && event.evidence?.excerpt) return 'ready'
    return announcement ? announcement.stage === 'trading' || announcement.stage === 'launched' && event.launchDetails?.isin && (event.launchDetails.fees || event.launchDetails.index) ? 'ready' : 'watch' : 'secondary'
  }
  if (event.factType === 'statistical-publication') return event.publishedAt && event.evidence?.excerpt && event.evidence?.sourceHash ? 'ready' : 'watch'
  if (event.family === 'economie' && event.publishedAt && event.unit && event.evidence?.sourceHash && event.kind !== 'new' && event.beforePeriod !== event.period) return 'ready'
  if (['etf', 'indices'].includes(event.family) && /^(top10|countries:|sectors:)/.test(field) && event.kind !== 'new' && event.beforePeriod !== event.period && typeof event.before === 'number' && typeof event.after === 'number' && Math.abs(event.after-event.before) >= 5 && !/other|autres|non ventile/i.test(normal(field))) return 'ready'
  // A newly connected catalogue record is never a product launch or a change.
  if (event.kind === 'new' && event.family !== 'pouvoir-achat') return 'secondary'
  if (event.family === 'pouvoir-achat') {
    const status = event.officialStatus ?? event.status ?? ''
    const concrete = /\d|€|euros|plafond|taux|tarif|frais|eligib|condition|date|versement|exoner|rembours/i.test(normal(`${event.label} ${event.summary}`))
    return concrete && /Application indiquée|Application annoncée|Loi promulguée|Loi adoptée définitivement|Promulgation indiquée/.test(status) ? 'ready' : 'watch'
  }
  if (event.family === 'etf') return /^(ter|pea|lifecycle|characteristics:(index|distribution|replicationMethod|productStructure))$/.test(field) ? 'ready' : 'secondary'
  if (event.family === 'courtiers') return 'ready'
  if (event.family === 'epargne') return 'ready'
  if (event.family === 'assurance') return /^(fees:|euro:)/.test(field) ? 'ready' : 'secondary'
  if (event.family === 'scpi') return /^(price|distribution|subscriptionFee|managementFee|minimum)$/.test(field) ? 'ready' : 'secondary'
  if (event.family === 'investisseurs' && field === 'filing') return investorFilingType(event) === 'publication' ? 'ready' : 'secondary'
  return 'secondary'
}

export function factType(event) {
  if (event.factType) return event.factType
  if (event.kind === 'new' && event.field !== 'announcement' && event.family !== 'pouvoir-achat') return 'coverage'
  if (event.family === 'pouvoir-achat') return 'regulatory-measure'
  if (event.field === 'announcement') { const type = (event.announcementEvidence ?? etfAnnouncement(event.label))?.type; return ['listing','first-trading'].includes(type) ? type : 'product-announcement' }
  if (event.beforePeriod === event.period && (event.kind === 'publication' || event.family === 'economie')) return 'source-revision'
  if (event.family === 'economie') return 'statistical-publication'
  return 'characteristic-change'
}
export const FACT_LABELS = { 'statistical-publication': 'Publication statistique', 'regulatory-measure': 'Mesure réglementaire', 'product-announcement': 'Annonce de produit', listing: 'Nouvelle place de cotation', 'first-trading': 'Première négociation', 'characteristic-change': 'Changement de caractéristique', 'source-revision': 'Révision de source', coverage: 'Nouvelle donnée raccordée' }
export function reliability(event) {
  const reasons = []
  try { if (new URL(event.sourceUrl).protocol !== 'https:') reasons.push('Source HTTPS manquante') } catch { reasons.push('Source manquante') }
  if (!event.scope || !event.period || !Number.isFinite(Date.parse(event.checkedAt))) reasons.push('Périmètre ou date de contrôle manquant')
  if (['source-conflict', 'wording-only'].includes(event.status)) reasons.push('Conflit ou libellé équivalent')
  if (event.after === null || event.after === undefined || typeof event.after === 'number' && !Number.isFinite(event.after)) reasons.push('Fait absent ou invalide')
  return { usable: reasons.length === 0, reasons }
}
export function editorialAssessment(event, now = Date.now(), rules = SCORE_RULES) {
  const state = editorialState(event), type = factType(event)
  const household = event.family === 'economie' || event.family === 'pouvoir-achat'
  const savings = ['courtiers', 'epargne', 'assurance'].includes(event.family)
  const composition = /^(top10|countries:|sectors:)/.test(event.field ?? '')
  const factors = {
    audience: [household ? 1 : savings ? .7 : composition && state === 'ready' ? .65 : .35, household ? 'Repère pour les ménages ou salariés ; effectif exact inconnu' : 'Public limité au produit ou au placement ; effectif inconnu'],
    impact: [household || savings ? 1 : /ter|pea|fees|price/.test(event.field ?? '') ? .8 : composition && state === 'ready' ? .8 : .3, household ? 'Revenus, budget ou patrimoine' : savings ? 'Conditions concrètes de l’épargne' : composition ? 'Évolution de l’exposition, sans achat ni vente déduit' : 'Caractéristiques du placement'],
    novelty: [type === 'coverage' || type === 'source-revision' || state === 'secondary' ? 0 : 1, type === 'coverage' ? 'Extension de couverture' : type === 'source-revision' ? 'Révision sans nouvelle période' : state === 'secondary' ? 'Variation technique' : 'Publication ou changement documenté'],
    comparison: [household || event.before !== null && event.before !== undefined ? 1 : event.products?.length ? .7 : null, household ? 'Permet de situer une situation ou un budget' : event.before !== null && event.before !== undefined ? 'Avant/après conservé avec périmètre' : event.products?.length ? 'Expositions nommées dans le communiqué' : 'Comparaison non documentée'],
  }
  // Publication time takes precedence. A discovery today never rejuvenates an old document.
  const publication = event.publishedAt ?? (event.field === 'announcement' ? event.period : null)
  const age = publication ? (now-Date.parse(publication))/86400000 : NaN
  factors.freshness = [Number.isFinite(age) && age >= 0 ? age <= 2 ? 1 : age <= 7 ? .7 : age <= 14 ? .3 : 0 : null, publication ? `Publication : ${publication}` : 'Date de publication inconnue ; détection non substituée']
  const criteria = Object.entries(factors).map(([key, [factor, reason]]) => ({ key, points: factor === null ? 0 : Math.round(rules[key]*factor), maximum: rules[key], unknown: factor === null, reason }))
  const score = criteria.reduce((total, row) => total+row.points, 0), quality = reliability(event)
  return { score, criteria, reliability: quality, state, type, priority: quality.usable && state === 'ready' && score >= rules.priority, major: quality.usable && state === 'ready' && score >= rules.major && Number.isFinite(age) && age <= 2 }
}
export const editorialScore = (event, now) => editorialAssessment(event, now).score
export function publicationKey(event) {
  if (event.publicationId) return JSON.stringify([event.family, event.publicationId, event.publishedAt ?? event.period])
  return JSON.stringify([event.family, event.entity, event.period])
}
// Group exact publications, keeping all child facts and legacy read identifiers.
export function groupSignals(events, now = Date.now()) {
  const groups = new Map()
  for (const event of events) {
    const state = editorialState(event), key = JSON.stringify([publicationKey(event), state])
    if (!groups.has(key)) groups.set(key, { id: key, state, event, events: [] })
    groups.get(key).events.push(event)
  }
  return [...groups.values()].map(group => {
    group.events.sort((a, b) => (a.entity === 'salary-median' ? -1 : b.entity === 'salary-median' ? 1 : editorialScore(b,now)-editorialScore(a,now)) || b.detectedAt.localeCompare(a.detectedAt) || a.id.localeCompare(b.id))
    const event = group.events[0]
    return { ...group, event, assessment: editorialAssessment(event, now) }
  }).sort((a,b) => b.assessment.score-a.assessment.score || b.event.detectedAt.localeCompare(a.event.detectedAt) || a.id.localeCompare(b.id))
}
const eventExposure = event => event.exposureKey ?? event.launchDetails?.index ?? (event.products?.length === 1 ? event.products[0].index : null)
export function selectEditorial(groups, limit = EDITORIAL_LIMIT) {
  const selected = [], others = [], counts = new Map(), exposures = new Map()
  for (const group of groups) {
    let host
    try { host = new URL(group.event.sourceUrl).hostname } catch { host = group.event.family }
    const exposure = eventExposure(group.event)
    if (selected.length < limit && (counts.get(host) ?? 0) < SCORE_RULES.sourceCap && (!exposure || (exposures.get(exposure) ?? 0) < SCORE_RULES.exposureCap)) { selected.push(group); counts.set(host, (counts.get(host) ?? 0)+1); if (exposure) exposures.set(exposure,(exposures.get(exposure) ?? 0)+1) }
    else others.push(group)
  }
  return { selected, others }
}

export function recentEditorial(event, now = Date.now()) {
  const stamp = Date.parse(event.detectedAt)
  return stamp <= now && stamp >= now - EDITORIAL_DAYS * 86400000
}

export function editorialAudience(event) {
  if (event.populationScope) return event.populationScope
  if (event.family === 'economie') return event.population ?? 'Ménages et salariés dans le périmètre de la publication.'
  return ({ etf: 'Épargnants qui détiennent ou comparent cet ETF.', courtiers: 'Clients de ce courtier, selon le marché et la formule concernés.', epargne: 'Épargnants concernés par le produit ou le régime indiqué.', assurance: 'Souscripteurs de ce contrat, selon ses conditions.', scpi: 'Associés et nouveaux souscripteurs de cette SCPI.', investisseurs: 'Lecteurs qui suivent les positions déclarées de cet investisseur.', 'pouvoir-achat': 'Particuliers concernés par les conditions décrites dans la source.' })[event.family] ?? 'Lecteurs intéressés par cette exposition.'
}

export function factualTitle(event) {
  if (event.family === 'economie' && event.unit && event.entity === 'salary-median') return `${event.label} : ${event.afterText} en ${event.period}`
  if (event.factType === 'statistical-publication') return event.label
  const filing = investorFilingType(event)
  if (filing === 'revision') return `${event.label} : relevé révisé pour la même période · ${event.period}`
  if (filing === 'unknown') return `${event.label} : période de déclaration à vérifier`
  if (!event.label || !event.fieldLabel) return event.title
  if (event.family === 'etf' && event.field === 'announcement') {
    const announcement = event.announcementEvidence ?? etfAnnouncement(event.label)
    return announcement ? `${announcement.label} : ${event.label}` : `Communiqué : ${event.label}`
  }
  if (event.family === 'pouvoir-achat') return event.label
  if (event.kind === 'new') return `${event.label} : nouvelle donnée suivie`
  if (event.kind === 'publication') return `${event.label} : ${event.fieldLabel} · ${event.period}`
  if (['number', 'boolean', 'string'].includes(typeof event.before) && ['number', 'boolean', 'string'].includes(typeof event.after)) return `${event.label} : ${event.fieldLabel.toLocaleLowerCase('fr-FR')}, ${event.beforeText} → ${event.afterText}`
  return `${event.label} : ${event.fieldLabel.toLocaleLowerCase('fr-FR')} modifiés`
}
