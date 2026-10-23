import { replicationWordingEvent } from './replication-method.js'
// Shared by the UI and notifications: collecting a fact does not make it a post.
export const EDITORIAL_DAYS = 14
export const EDITORIAL_LIMIT = 5
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
  if (/\b(?:now trading|begins? trading|starts? trading|commences? trading|listed today)\b|desormais (?:cote|negociable)|debut des negociations/.test(t)) return { type: 'launch', stage: 'trading', label: 'Négociation annoncée par l’émetteur', evidence: title }
  if (/\b(?:will launch|plans? to launch|to launch|upcoming launch)\b|lancera|va lancer|lancement (?:prevu|annonce)|sera lance/.test(t)) return { type: 'launch', stage: 'announced', label: 'Lancement annoncé', evidence: title }
  if (/\blaunch(?:es|ed|ing)?\b|\bintroduces?\b|\blance\b|\blancement\b/.test(t)) return { type: 'launch', stage: 'launched', label: 'Lancement déclaré par l’émetteur', evidence: title }
  return null
}

export function editorialState(event) {
  if (replicationWordingEvent(event) || event.status === 'wording-only') return 'secondary'
  const field = event.field ?? ''
  if (event.status === 'source-conflict') return 'secondary'
  if (event.family === 'etf' && field === 'announcement') {
    const announcement = etfAnnouncement(event.label)
    return announcement ? announcement.stage === 'trading' || announcement.stage === 'launched' && event.launchDetails?.isin && (event.launchDetails.fees || event.launchDetails.index) ? 'ready' : 'watch' : 'secondary'
  }
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

export function editorialScore(event) {
  if (event.family === 'etf' && event.field === 'announcement') return 0
  if (/^(ter|pea|lifecycle)$/.test(event.field ?? '')) return 1
  if (['courtiers', 'epargne', 'pouvoir-achat'].includes(event.family)) return 2
  return 3
}

// Same product + publication period + editorial state, never a broad topic.
// Each child keeps its date, source, perimeter, draft and read receipt.
export function groupSignals(events) {
  const groups = new Map()
  for (const event of events) {
    const state = editorialState(event)
    const key = JSON.stringify([event.family, event.entity, event.period, state])
    if (!groups.has(key)) groups.set(key, { id: key, state, event, events: [] })
    groups.get(key).events.push(event)
  }
  return [...groups.values()].map(group => {
    group.events.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt) || a.id.localeCompare(b.id))
    return { ...group, event: group.events[0] }
  }).sort((a, b) => editorialScore(a.event) - editorialScore(b.event) || b.event.detectedAt.localeCompare(a.event.detectedAt) || a.id.localeCompare(b.id))
}

export function recentEditorial(event, now = Date.now()) {
  const stamp = Date.parse(event.detectedAt)
  return stamp <= now && stamp >= now - EDITORIAL_DAYS * 86400000
}

export function editorialAudience(event) {
  return ({ etf: 'Épargnants qui détiennent ou comparent cet ETF.', courtiers: 'Clients de ce courtier, selon le marché et la formule concernés.', epargne: 'Épargnants concernés par le produit ou le régime indiqué.', assurance: 'Souscripteurs de ce contrat, selon ses conditions.', scpi: 'Associés et nouveaux souscripteurs de cette SCPI.', investisseurs: 'Lecteurs qui suivent les positions déclarées de cet investisseur.', 'pouvoir-achat': 'Particuliers concernés par les conditions décrites dans la source.' })[event.family] ?? 'Lecteurs intéressés par cette exposition.'
}

export function factualTitle(event) {
  const filing = investorFilingType(event)
  if (filing === 'revision') return `${event.label} : relevé révisé pour la même période · ${event.period}`
  if (filing === 'unknown') return `${event.label} : période de déclaration à vérifier`
  if (!event.label || !event.fieldLabel) return event.title
  if (event.family === 'etf' && event.field === 'announcement') {
    const announcement = etfAnnouncement(event.label)
    return announcement ? `${announcement.label} : ${event.label}` : `Communiqué : ${event.label}`
  }
  if (event.family === 'pouvoir-achat') return event.label
  if (event.kind === 'new') return `${event.label} : nouvelle donnée suivie`
  if (event.kind === 'publication') return `${event.label} : ${event.fieldLabel} · ${event.period}`
  if (['number', 'boolean', 'string'].includes(typeof event.before) && ['number', 'boolean', 'string'].includes(typeof event.after)) return `${event.label} : ${event.fieldLabel.toLocaleLowerCase('fr-FR')}, ${event.beforeText} → ${event.afterText}`
  return `${event.label} : ${event.fieldLabel.toLocaleLowerCase('fr-FR')} modifiés`
}
