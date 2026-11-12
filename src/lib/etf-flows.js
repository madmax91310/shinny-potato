import freshnessPolicy from '../data/freshness-policy.json' with {type: 'json'}
// Net flows only. One observation owns every row's dates, currency and universe.
export const GROUPS = { asset: 'Classes d’actifs', geography: 'Zones géographiques', sector: 'Secteurs', fund: 'Produits individuels' }
const day = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
const instant = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T.*Z$/.test(value) && Number.isFinite(Date.parse(value))
const present = value => typeof value === 'string' && value.trim().length > 0
const url = value => { try { return new URL(value).protocol === 'https:' } catch { return false } }
export function parseFlow(raw) {
  if (typeof raw !== 'string') throw Error('Montant signé requis, avec unité et devise.')
  const match = raw.trim().match(/^([+−-])\s*(\d+(?:[.,]\d+)?)\s*(EUR|kEUR|MEUR|MdEUR|USD|kUSD|MUSD|MdUSD)$/)
  if (!match) throw Error('Format attendu : +5,23 MdEUR ou −81,9 MEUR (pas de séparateur de milliers).')
  const scale = { '': 1, k: 1e3, M: 1e6, Md: 1e9 }
  const currency = match[3].slice(-3), unit = match[3].slice(0, -3)
  return { amount: Number(match[2].replace(',', '.')) * scale[unit] * (match[1] === '+' ? 1 : -1), currency, unit: match[3] }
}
export function validateObservation(o, now = new Date()) {
  const errors = []
  if (!o || typeof o !== 'object') return ['Observation absente.']
  if (o.schemaVersion !== 1 || !present(o.id)) errors.push('Identité ou version invalide.')
  if (!day(o.start) || !day(o.end) || o.start > o.end || (Date.parse(o.end) - Date.parse(o.start)) / 86400000 > 6) errors.push('Dates de semaine invalides (7 jours maximum).')
  if (o.complete !== true || !['explicit-range', 'rolling-1w'].includes(o.periodKind) || !present(o.periodEvidence)) errors.push('Bornes exactes et preuve de période requises, y compris pour 1W.')
  if (Date.parse(o.end) >= Date.parse(now.toISOString().slice(0, 10))) errors.push('Période incomplète ou future.')
  if (!instant(o.publishedAt) || !instant(o.retrievedAt) || !instant(o.validatedAt) || Date.parse(o.publishedAt) < Date.parse(o.end) || Date.parse(o.retrievedAt) < Date.parse(o.publishedAt) || Date.parse(o.validatedAt) < Date.parse(o.retrievedAt) || Date.parse(o.validatedAt) > +now) errors.push('Publication, récupération et validation doivent être datées et ordonnées.')
  if (!['EUR', 'USD'].includes(o.currency) || o.metric !== 'net-flows' || o.unit !== 'currency') errors.push('Flux nets en devise requis, sans performance, volume ni variation d’encours.')
  if (!['europe-domiciled', 'europe-listed'].includes(o.universe?.basis) || !present(o.universe?.evidence) || !present(o.universe?.label) || o.universe.label.length > 80) errors.push('Univers européen à qualifier : domicile ou cotation, avec preuve et libellé court.')
  if (!Array.isArray(o.universe?.productTypes) || !o.universe.productTypes.length || o.universe.productTypes.some(t => !['ETF', 'ETC', 'ETP'].includes(t))) errors.push('Types ETF / ETC / ETP requis.')
  if (!url(o.source?.url) || !present(o.source?.publisher) || !present(o.source?.provider) || !present(o.source?.locator)) errors.push('Provenance complète et URL HTTPS requises.')
  if (!['licensed', 'open'].includes(o.source?.rightsStatus) || !present(o.source?.rightsEvidence)) errors.push('Réutilisation à documenter : licence ou autorisation ouverte.')
  if (o.status !== 'validated' || o.fixture === true) errors.push('Observation non validée ou exemple de test.')
  if (!Array.isArray(o.rows) || !o.rows.length || o.rows.length > 80) errors.push('Entre 1 et 80 lignes sourcées requises.')
  const ids = new Set(), categories = new Set()
  for (const r of Array.isArray(o.rows) ? o.rows : []) {
    if (!r || typeof r !== 'object') { errors.push('Ligne invalide.'); continue }
    if (!present(r.id) || ids.has(r.id)) errors.push('Identifiant de ligne absent ou doublon.')
    ids.add(r.id)
    const key = `${r.group}:${r.originalLabel}`
    if (!GROUPS[r.group] || !present(r.originalLabel) || !present(r.label) || r.label.length > 60 || categories.has(key)) errors.push('Catégorie absente, trop longue ou contradictoire.')
    categories.add(key)
    if (!present(r.evidence) || !Number.isFinite(r.amount)) errors.push('Valeur manquante ou preuve de ligne absente.')
    try { const p = parseFlow(r.raw); if (p.currency !== o.currency || Math.abs(p.amount - r.amount) > 0.001) errors.push('Signe, unité ou devise contradictoire.') } catch (e) { errors.push(e.message) }
    if (['start', 'end', 'currency', 'universe', 'metric', 'rank'].some(k => Object.hasOwn(r, k))) errors.push('Période, devise, univers ou classement local interdit dans une ligne.')
  }
  return [...new Set(errors)]
}
export function observationKey(o) { return JSON.stringify([o.start, o.end, o.periodKind, o.currency, o.universe?.basis, o.universe?.label, [...(o.universe?.productTypes ?? [])].sort()]) }
export function addObservation(observations, next, now = new Date()) {
  const errors = validateObservation(next, now)
  if (errors.length) throw Error(errors.join('\n'))
  if (observations.some(o => o.id === next.id || observationKey(o) === observationKey(next))) throw Error('Doublon de période et de périmètre : correction à revoir dans une PR, sans écrasement.')
  return [...observations, next].sort((a, b) => b.end.localeCompare(a.end))
}
export function latestObservation(observations, now = new Date()) { return observations.filter(o => !validateObservation(o, now).length).sort((a,b) => b.end.localeCompare(a.end) || b.publishedAt.localeCompare(a.publishedAt))[0] ?? null }
export function expectedEnd(now = new Date()) {
  // Previous completed Monday–Friday. Does not relabel a source's rolling period.
  const d = new Date(`${now.toISOString().slice(0,10)}T00:00:00Z`)
  const back = (d.getUTCDay() + 2) % 7 || 7
  d.setUTCDate(d.getUTCDate() - back)
  return d.toISOString().slice(0,10)
}
export function publicationGate(o, {now = new Date(), archive = false, maxAgeDays = freshnessPolicy.fields['etf.weeklyFlows'].dataDays} = {}) {
  const errors = validateObservation(o, now)
  if (!o) return errors
  if (!archive && (o.end < expectedEnd(now) || (+now - Date.parse(o.end)) / 86400000 > maxAgeDays)) errors.push('Nouvelle édition indisponible. Cette période est une archive ; activer le mode archive pour un texte explicitement daté.')
  return errors
}
export function periodLabel(o) { return `du ${o.start.split('-').reverse().join('/')} au ${o.end.split('-').reverse().join('/')}` }
export function signedFlow(amount, currency = 'EUR') {
  if (!Number.isFinite(amount)) throw Error('Flux absent')
  const absolute = Math.abs(amount), divisor = absolute >= 1e9 ? 1e9 : absolute >= 1e6 ? 1e6 : absolute >= 1e3 ? 1e3 : 1
  return `${amount < 0 ? '−' : '+'}${new Intl.NumberFormat('fr-FR', {maximumFractionDigits: 2}).format(absolute / divisor)} ${divisor === 1e9 ? 'Md' : divisor === 1e6 ? 'M' : divisor === 1e3 ? 'k' : ''}${currency === 'EUR' ? '€' : '$'}`
}
export function selection(o, ids) { return (o?.rows ?? []).filter(r => ids.includes(r.id)) }
export function publicScope(o) { return `${o.universe.productTypes.join(' / ')} ${o.universe.basis === 'europe-listed' ? 'cotés' : 'domiciliés'} en Europe` }
export function buildFlowTweet(o, rows, {archive = false} = {}) {
  if (!rows.length) return ''
  return `${archive ? 'Archives · ' : ''}💸 Où va l’argent des ETF ?

${periodLabel(o).replace(/^du /, 'Du ')}, voici une sélection de flux nets des ${publicScope(o)} :
${rows.map(r => `${r.label} : ${signedFlow(r.amount, o.currency)}`).join('\n')}

${rows.some(r => r.amount < 0) && rows.some(r => r.amount > 0) ? 'Des apports et des retraits coexistent.' : rows.every(r => r.amount >= 0) ? 'Ces expositions ont reçu des apports nets.' : 'Ces expositions ont enregistré des retraits nets.'}
Ce ne sont pas des rendements.
Quel flux vous interpelle ?
Pas un conseil financier.`
}
// Edited prose is free, but every numeric token must remain evidenced in this selection.
export function checkFlowText(text, o, rows, archive = false) {
  const errors = []
  const reference = buildFlowTweet(o, rows, {archive})
  const tokens = s => s.match(/[+−-]?\d+(?:[\s\u202f\u00a0.,/]\d+)*/g) ?? []
  const allowed = new Map()
  for (const token of tokens(reference)) { const key = token.replace(/[\s\u202f\u00a0]/g, ''); allowed.set(key, (allowed.get(key) ?? 0) + 1) }
  for (const token of tokens(text)) { const key = token.replace(/[\s\u202f\u00a0]/g, ''); allowed.set(key, (allowed.get(key) ?? 0) - 1) }
  if ([...allowed.values()].some(count => count < 0)) errors.push('Chiffre absent de la sélection sourcée.')
  if (!text.toLowerCase().includes(periodLabel(o)) || !text.includes(publicScope(o)) || !/flux nets/i.test(text) || !/sélection/i.test(text)) errors.push('Conserver la période, le périmètre, « sélection » et « flux nets ».')
  if (/cette semaine|semaine dernière|aujourd[’']hui|actuellement/i.test(text)) errors.push('Conserver les dates exactes plutôt qu’une formulation relative ambiguë.')
  if (archive && (!text.startsWith('Archives · ') || /cette semaine|semaine dernière|aujourd’hui|actuellement/i.test(text))) errors.push('Une archive doit rester explicitement historique.')
  if (/%/.test(text)) errors.push('Aucun pourcentage de rendement dans un texte de flux.')
  if (/plus fortes|principales collectes|top\s*\d|confiance|particuliers|anticipent|anticipation|recommand[eé]|rendement[s]?\s*(de|:)/i.test(text)) errors.push('Classement ou interprétation non démontré.')
  // Require each selected fact verbatim: prevents moving an amount to another label/sign/unit.
  if (rows.some(r => !text.includes(`${r.label} : ${signedFlow(r.amount, o.currency)}`))) errors.push('Conserver les lignes chiffrées exactes ; modifier la sélection pour les changer.')
  return errors
}
export function blankObservation() {
  return { schemaVersion: 1, id: '', status: 'validated', start: '', end: '', periodKind: 'explicit-range', complete: true, periodEvidence: '', publishedAt: '', retrievedAt: '', validatedAt: '', currency: 'EUR', unit: 'currency', metric: 'net-flows', universe: {basis: '', label: '', evidence: '', productTypes: ['ETF']}, source: {publisher: '', provider: '', url: '', locator: '', rightsStatus: '', rightsEvidence: ''}, rows: [{id: '', group: 'asset', label: '', originalLabel: '', raw: '', amount: null, evidence: ''}] }
}
