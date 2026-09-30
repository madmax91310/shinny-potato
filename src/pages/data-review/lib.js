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

// Interface de maintenance uniquement : aucune modification des valeurs ou des générateurs.
export function buildReview(today = parisToday(), catalog = DATA_CATALOG, brokers = BROKERS, evidence = BROKER_EVIDENCE, sources = { ...OFFICIAL_SOURCES, ...SECONDARY_SOURCES }) {
  if (dayNumber(today) === null) throw new Error('Date de revue invalide')
  const items = []
  let archives = 0
  for (const record of catalog) {
    for (const [index, field] of record.fields.entries()) {
      if (field.metadata.sourceStatus === 'archive-unverifiable') { archives++; continue }
      if (!record.consumers.length) continue
      const base = { name: record.name, aliases: [record.id, ...record.aliases ?? []], field: field.label, checkedAt: field.metadata.checkedAt, urls: field.metadata.sourceUrls, to: `/bibliotheque-donnees?id=${encodeURIComponent(record.id)}`, tools: record.consumers.map(c => c.tool), registry: field.registry }
      const status = freshness(base.checkedAt, today)
      if (status) items.push({ ...base, id: `data:${record.id}:${index}`, category: status, reason: status === 'undated' ? 'La date du contrôle de source n’est pas documentée ; la fraîcheur ne peut pas être calculée.' : status === 'future-date' ? 'La date du contrôle est future : métadonnée à examiner.' : 'Revoir la source après 180 jours ; une valeur ancienne n’est pas nécessairement fausse.' })
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
        const status = freshness(source.checked, today)
        const id = `broker-source:${broker.id}:${ref.document}`
        if (status && !items.some(x => x.id === id)) items.push({ ...base, id, field: source.title, checkedAt: source.checked, urls: [source.url], category: status, reason: status === 'undated' ? 'Date du contrôle non documentée.' : 'Source du courtier à revoir ; la date d’édition du contrat ne date pas son contrôle.' })
        if (source.reviewUntil) {
          const offerId = `offer:${broker.id}:${ref.document}`
          if (!items.some(x => x.id === offerId)) items.push({ ...base, id: offerId, field: source.title, checkedAt: source.checked, until: source.reviewUntil, urls: [source.url], category: expiry(source.reviewUntil, today), reason: 'Échéance enregistrée dans la source. Vérifier une éventuelle prolongation avant de modifier l’offre.' })
        }
      }
    }
  }
  const order = ['expired', 'future-date', 'reserve', 'stale', 'undated', 'ending', 'soon', 'scheduled']
  items.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.name.localeCompare(b.name, 'fr') || a.field.localeCompare(b.field, 'fr'))
  return { today, items, archives }
}
