import liLu from '../../../public/data/investors/li-lu.json' with { type: 'json' }
import gates from '../../../public/data/investors/gates-trust.json' with { type: 'json' }
import klarman from '../../../public/data/investors/klarman.json' with { type: 'json' }
import { DATA_CATALOG } from '../../data/catalog.js'
import { BROKERS } from '../broker-comparator/data.js'
import { BROKER_EVIDENCE, EVIDENCE_FIELDS, OFFICIAL_SOURCES, SECONDARY_SOURCES } from '../broker-comparator/evidence.js'

export const REVIEW_DAYS = 180
export const SOON_DAYS = 30
export function parisToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now)
  const get = key => parts.find(part => part.type === key).value
  return `${get('year')}-${get('month')}-${get('day')}`
}
export function dayNumber(value) {
  if (!value) return null
  const iso = /^\d{2}\/\d{2}\/\d{4}$/.test(value) ? value.split('/').reverse().join('-') : value
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const time = Date.parse(`${iso}T00:00:00Z`)
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === iso ? time / 86400000 : null
}
export function freshness(checkedAt, today) {
  const checked = dayNumber(checkedAt)
  if (checked === null) return 'undated'
  const age = dayNumber(today) - checked
  if (age < 0) return 'future-date'
  if (age >= REVIEW_DAYS) return 'stale'
  if (age >= REVIEW_DAYS - SOON_DAYS) return 'soon'
  return null
}
export function expiry(until, today) {
  const deadline = dayNumber(until)
  if (deadline === null) return null
  const remaining = deadline - dayNumber(today)
  return remaining < 0 ? 'expired' : remaining <= SOON_DAYS ? 'ending' : 'scheduled'
}

export function addMonths(value, months) {
  if (dayNumber(value) === null) return null
  const date = new Date(dayNumber(value) * 86400000)
  const day = date.getUTCDate()
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + months)
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()
  date.setUTCDate(Math.min(day, end))
  return date.toISOString().slice(0, 10)
}
export function reviewPolicy(field) {
  const registry = field.registry ?? ''
  if (registry.endsWith('/market-history.js')) return { type: 'Cours mensuels', months: 1, rule: 'Chaque début de mois, après publication de la clôture précédente.' }
  if (/\/(instrument-returns|instrument-comparator-returns|index-returns)\.js$/.test(registry)) return { type: 'Performances annuelles', annual: true, rule: 'En janvier, contrôler la publication de l’année complète ; conserver les historiques fixes.' }
  if (registry.endsWith('/household-statistics.js')) return { type: 'Statistiques', months: 12, rule: 'Chaque année, ou dès une nouvelle publication de la source.' }
  if (/\/(etf-ter|instrument-facts|instrument-aum|instrument-aum-observations|instrument-pea|index-facts)\.js$/.test(registry)) return { type: registry.endsWith('/index-facts.js') ? 'Composition des indices' : 'Caractéristiques ETF', months: 3, rule: 'Tous les trois mois ; conserver la date de la photographie historique.' }
  return { type: 'Références et définitions', months: 6, rule: 'Tous les six mois, ou dès un changement signalé.' }
}
export function scheduledReview(base, field, today) {
  const policy = reviewPolicy(field)
  const checked = dayNumber(base.checkedAt)
  const iso = checked === null ? null : new Date(checked * 86400000).toISOString().slice(0, 10)
  let nextReviewAt = policy.annual && iso ? `${Number(iso.slice(0, 4)) + 1}-01-01` : addMonths(iso, policy.months)
  if (policy.type === 'Cours mensuels') {
    const last = field.value?.points?.map(p => p.date).filter(d => /^\d{4}-\d{2}$/.test(d)).sort().at(-1)
    // Une consultation récente ne repousse pas une clôture mensuelle manquante.
    if (last) nextReviewAt = addMonths(`${last}-01`, 2)
  }
  const remaining = nextReviewAt ? dayNumber(nextReviewAt) - dayNumber(today) : null
  const category = checked === null ? 'undated' : checked > dayNumber(today) ? 'future-date' : remaining <= 0 ? 'stale' : remaining <= SOON_DAYS ? 'soon' : 'current'
  return { ...base, nextReviewAt, category, cadence: policy.annual ? 'annual' : { 1: 'monthly', 3: 'quarterly', 6: 'semiannual', 12: 'annual' }[policy.months], dataType: policy.type, reason: policy.rule }
}

// Interface de maintenance uniquement : aucune modification des valeurs ou des générateurs.
export function buildReview(today = parisToday(), catalog = DATA_CATALOG, brokers = BROKERS, evidence = BROKER_EVIDENCE, sources = { ...OFFICIAL_SOURCES, ...SECONDARY_SOURCES }) {
  if (dayNumber(today) === null) throw new Error('Date de revue invalide')
  const items = []
  const schedule = []
  let archives = 0
  for (const record of catalog) {
    for (const [index, field] of record.fields.entries()) {
      if (field.metadata.sourceStatus === 'archive-unverifiable') { archives++; continue }
      if (!record.consumers.length) continue
      const base = { maintenanceRecord: record, maintenanceField: field, name: record.name, aliases: [record.id, ...record.aliases ?? []], field: field.label, checkedAt: field.metadata.checkedAt, urls: field.metadata.sourceUrls, to: `/bibliotheque-donnees?id=${encodeURIComponent(record.id)}`, tools: record.consumers.map(c => c.tool), registry: field.registry }
      const review = scheduledReview({ ...base, id: `data:${record.id}:${index}` }, field, today)
      schedule.push(review)
      if (review.category !== 'current') items.push(review)
      if (!field.metadata.sourceUrls.length) items.push({ ...base, id: `source:${record.id}:${index}`, category: 'reserve', reason: 'Source individuelle non renseignée pour une donnée utilisée.' })
    }
  }
  for (const broker of brokers) {
    const fields = evidence[broker.id] ?? {}
    for (const [key, label] of EVIDENCE_FIELDS) {
      const item = fields[key]
      if (!item || (item.status === 'non établi' && /sans objet/i.test(item.summary))) continue
      const refs = (item.refs ?? []).map(ref => sources[ref.document]).filter(Boolean)
      const base = { name: broker.nom, aliases: [broker.id, broker.code].filter(Boolean), field: label, to: '/comparatif-courtiers', tools: ['Comparatif courtiers'], registry: 'src/pages/broker-comparator/evidence.js', urls: [...new Set(refs.map(ref => ref.url))] }
      if (item.status !== 'confirmé' || item.review?.outcome === 'unresolved') items.push({ ...base, id: `broker:${broker.id}:${key}`, category: 'reserve', checkedAt: item.review?.checked, reason: item.review?.gap ?? item.summary, detail: item.summary })
      // Les sources d'une cellule sont contrôlées séparément : une référence récemment
      // consultée ne rajeunit pas artificiellement les autres documents.
      for (const ref of item.refs ?? []) {
        const source = sources[ref.document]
        if (!source) continue
        const review = scheduledReview({ ...base, checkedAt: source.checked }, { registry: 'src/data/etf-ter.js' }, today)
        const status = review.category === 'current' ? null : review.category
        const id = `broker-source:${broker.id}:${ref.document}`
        if (!schedule.some(x => x.id === id)) schedule.push({ ...review, id, dataType: 'Courtiers', field: source.title, urls: [source.url], reason: 'Tous les trois mois, ou dès une modification des tarifs ou services.' })
        if (status && !items.some(x => x.id === id)) items.push({ ...review, id, dataType: 'Courtiers', field: source.title, checkedAt: source.checked, urls: [source.url], category: status, reason: status === 'undated' ? 'Date du contrôle non documentée.' : 'Source du courtier à revoir ; la date d’édition du contrat ne date pas son contrôle.' })
        if (source.reviewUntil) {
          const offerId = `offer:${broker.id}:${ref.document}`
          if (!items.some(x => x.id === offerId)) items.push({ ...base, id: offerId, field: source.title, checkedAt: source.checked, until: source.reviewUntil, urls: [source.url], nextReviewAt: source.reviewUntil, cadence: 'event', dataType: 'Offres promotionnelles', category: expiry(source.reviewUntil, today), reason: 'Échéance enregistrée dans la source. Vérifier une éventuelle prolongation avant de modifier l’offre.' })
        }
      }
    }
  }
  // Les trois copies locales sont rafraîchies automatiquement ; l'échéance
  // contrôle la présence du trimestre suivant, pas la réussite du workflow.
  if (catalog === DATA_CATALOG) for (const payload of [liLu, gates, klarman]) {
    const snapshot = payload.data.snapshot
    const quarterEnd = addMonths(snapshot.periodEnd, 3)
    const boundary = new Date(`${quarterEnd}T00:00:00Z`)
    const date = new Date(Date.UTC(boundary.getUTCFullYear(), boundary.getUTCMonth() + 1, 0))
    date.setUTCDate(date.getUTCDate() + 45)
    const nextReviewAt = date.toISOString().slice(0, 10)
    const remaining = dayNumber(nextReviewAt) - dayNumber(today)
    const row = { id: `investor:${payload.data.identity.slug}`, name: payload.data.identity.displayName, aliases: [payload.data.identity.slug], field: `Portefeuille au ${snapshot.periodEnd}`, checkedAt: payload.as_of?.slice(0, 10), nextReviewAt, category: remaining <= 0 ? 'stale' : remaining <= SOON_DAYS ? 'soon' : 'current', cadence: 'quarterly', dataType: 'Portefeuilles trimestriels', tools: ['Présentation investisseur'], registry: 'public/data/investors', to: '/portefeuilles-investisseurs', urls: [payload.data.sourceUrl || 'https://www.sec.gov/edgar/search/'], reason: 'Contrôler le trimestre suivant 45 jours après sa clôture. La collecte et le déploiement sont automatiques ; une date de récupération récente ne prouve pas la présence du nouveau trimestre.' }
    schedule.push(row)
    if (row.category !== 'current') items.push(row)
  }
  const order = ['expired', 'future-date', 'reserve', 'stale', 'undated', 'ending', 'soon', 'scheduled']
  items.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || (dayNumber(a.nextReviewAt ?? a.until) ?? -Infinity) - (dayNumber(b.nextReviewAt ?? b.until) ?? -Infinity) || a.name.localeCompare(b.name, 'fr') || a.field.localeCompare(b.field, 'fr'))
  schedule.sort((a, b) => (dayNumber(a.nextReviewAt) ?? -Infinity) - (dayNumber(b.nextReviewAt) ?? -Infinity) || a.name.localeCompare(b.name, 'fr'))
  return { today, items, schedule, archives }
}

// Le regroupement consomme la périodicité de la règle qui a calculé la date.
// Il ne recalcule aucune échéance et n'assimile pas un retard à une erreur.
export const REVIEW_CADENCES = {
  monthly: 'Mensuel', quarterly: 'Trimestriel', semiannual: 'Semestriel',
  annual: 'Annuel', event: 'Échéances des offres',
}
export function reviewCalendar(report) {
  return [...new Map([...report.schedule, ...report.items.filter(item => item.until)].map(item => [item.id, item])).values()]
}
export function summarizeCadences(rows, today) {
  const currentDay = dayNumber(today)
  if (currentDay === null) throw new Error('Date de revue invalide')
  return Object.entries(REVIEW_CADENCES).map(([id, label]) => {
    const items = rows.filter(item => item.cadence === id)
    const dated = items.filter(item => dayNumber(item.nextReviewAt) !== null && !['undated', 'future-date'].includes(item.category))
    const due = dated.filter(item => dayNumber(item.nextReviewAt) <= currentDay)
    const upcoming = dated.filter(item => dayNumber(item.nextReviewAt) > currentDay)
    const earliest = list => list.map(item => item.nextReviewAt).sort()[0] ?? null
    return { id, label, total: items.length, due: due.length,
      oldestDueAt: earliest(due), nextReviewAt: earliest(upcoming),
      unplanned: items.length - dated.length,
      types: [...new Set(items.map(item => item.dataType))],
    }
  })
}
