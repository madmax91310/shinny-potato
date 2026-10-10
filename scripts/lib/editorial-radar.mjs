import { createHash } from 'node:crypto'

export const FAMILIES = { etf: 'ETF', indices: 'Indices', courtiers: 'Courtiers', epargne: 'Épargne', scpi: 'SCPI', assurance: 'Assurance-vie', investisseurs: 'Investisseurs', economie: 'Repères économiques' }
export function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`
  return JSON.stringify(value)
}
const digest = value => createHash('sha256').update(stable(value)).digest('hex').slice(0, 24)
const same = (a, b) => stable(a) === stable(b)
export function validObservation(o, now) {
  if (!o || !FAMILIES[o.family] || !o.entity || !o.field || !o.label || !o.fieldLabel || !o.scope || !o.period || !o.checkedAt) return false
  try { if (new URL(o.sourceUrl).protocol !== 'https:') return false } catch { return false }
  const checked = Date.parse(o.checkedAt)
  if (!Number.isFinite(checked) || checked > now.getTime() + 86400000 || now - checked > (o.maxAgeDays ?? 90) * 86400000) return false
  if (o.value === null || o.value === undefined || typeof o.value === 'number' && !Number.isFinite(o.value)) return false
  // Accept only JSON primitives, arrays and objects containing finite numbers.
  const finite = v => typeof v === 'number' ? Number.isFinite(v) : Array.isArray(v) ? v.every(finite) : v && typeof v === 'object' ? Object.values(v).every(finite) : ['string', 'boolean'].includes(typeof v) || v === null
  return finite(o.value)
}
export const observationKey = o => `${o.family}:${o.entity}:${o.field}:${digest(o.scope)}`
export function meaningful(before, after) {
  if (same(before.value, after.value)) return after.rule === 'publication' && before.period !== after.period
  if (typeof before.value !== typeof after.value) return false
  if (typeof after.value !== 'number') return true
  const delta = Math.abs(after.value - before.value)
  if (delta < (after.threshold ?? 0.000001) - 1e-9) return false
  if (after.relativeThreshold && (!before.value || delta / Math.abs(before.value) < after.relativeThreshold - 1e-9)) return false
  return true
}
const number = value => value.toLocaleString('fr-FR', { maximumFractionDigits: 3 })
export function displayValue(value, unit = '') {
  if (typeof value === 'number') return `${number(value)}${unit ? ` ${unit}` : ''}`
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  if (Array.isArray(value)) return value.slice(0, 10).map(item => typeof item === 'string' ? item : item.ticker ? `${item.ticker}${item.changePct === null ? '' : ` (${number(item.changePct)} % d’actions)`}` : stable(item)).join(' · ')
  if (value?.positions) return `${value.positions.length} positions · ${displayValue(value.positions)}${value.exits?.length ? ` · Sorties : ${value.exits.join(', ')}` : ''}`
  if (value && typeof value === 'object') return Object.entries(value).map(([key, v]) => `${key} : ${displayValue(v)}`).join(' · ')
  return String(value)
}
function makeEvent(before, after, detectedAt, kind = 'change') {
  const isPublication = after.rule === 'publication' && before?.period !== after.period
  const id = digest({ key: observationKey(after), before: before?.value ?? null, after: after.value, beforePeriod: before?.period ?? null, afterPeriod: after.period })
  const beforeText = before ? displayValue(before.value, after.unit) : 'Pas encore suivi'
  const afterText = displayValue(after.value, after.unit)
  const title = after.rule === 'announcement' ? `Nouveau communiqué officiel : ${after.label}` : kind === 'new' ? `${after.label} : nouvelle donnée suivie` : isPublication ? `${after.label} : nouvelle publication` : `${after.label} : ${after.fieldLabel.toLocaleLowerCase('fr-FR')} en mouvement`
  const movement = kind === 'new' ? `Une nouvelle donnée sourcée est disponible : ${afterText}.` : isPublication ? `La publication ${after.period} est disponible : ${afterText}.` : `${after.fieldLabel} : ${beforeText} → ${afterText}.`
  const angle = after.angle ?? `Qu’est-ce que cette évolution change pour quelqu’un qui utilise ${after.label} ?`
  return { id, family: after.family, entity: after.entity, label: after.label, field: after.field, fieldLabel: after.fieldLabel, title, kind: kind === 'new' ? 'new' : isPublication ? 'publication' : 'change', priority: after.priority ?? 'normal', detectedAt, before: before?.value ?? null, after: after.value, beforeText, afterText, beforePeriod: before?.period ?? null, period: after.period, scope: after.scope, unit: after.unit ?? '', sourceUrl: after.sourceUrl, previousSourceUrl: before?.sourceUrl ?? null, checkedAt: after.checkedAt, tool: after.tool, angle, draft: `${movement}\n\n${after.label}${after.entity.match(/^[A-Z]{2}[A-Z0-9]{10}$/) ? ` · ${after.entity}` : ''}\nPérimètre : ${after.scope}\n${before ? `Ancienne observation : ${before.period}\n` : ''}Observation actuelle : ${after.period}\n\n${angle}`, reason: after.reason ?? 'Changement d’une donnée publiée, à périmètre comparable.' }
}

// The reference advances only after an emitted signal, so small daily changes
// accumulate. Missing/invalid values never delete the last good observation.
export function shouldRefreshRadar(previous, { eventName, sourceRevision, now = new Date() } = {}) {
  // A daily/manual run always visits external newsrooms. A failed extraction
  // must also be retried, even when local source data has not changed.
  if (!previous || previous.schemaVersion !== 1 || !previous.current || !previous.anchors || !Array.isArray(previous.events) || !['push', 'workflow_run'].includes(eventName) || !sourceRevision || previous.sourceRevision !== sourceRevision || previous.lastErrorCount !== 0) return true
  const elapsed = now.getTime() - Date.parse(previous.lastCheckedAt)
  return !Number.isFinite(elapsed) || elapsed < 0 || elapsed >= 15 * 60000
}
export function advanceRadar(previous, observations, { now = new Date(), sourceRevision = '', errors = [] } = {}) {
  if (previous && (previous.schemaVersion !== 1 || !previous.current || !previous.anchors || !Array.isArray(previous.events))) throw new Error('Historique radar invalide : conservation du fichier précédent.')
  const stamp = now.toISOString(), state = previous ? structuredClone(previous) : { schemaVersion: 1, initializedAt: stamp, current: {}, anchors: {}, events: [] }
  const issues = [...errors], newEvents = [], seen = new Set(state.events.map(event => event.id))
  const entities = new Set(Object.values(state.current).map(o => `${o.family}:${o.entity}`))
  const valid = observations.filter(o => {
    if (validObservation(o, now)) return true
    issues.push({ family: o?.family ?? 'radar', entity: o?.entity ?? '', reason: `Observation non exploitable : ${o?.fieldLabel ?? o?.field ?? 'champ inconnu'}.` })
    return false
  })
  const keys = new Set()
  for (const after of valid) {
    const key = observationKey(after)
    if (keys.has(key)) throw new Error(`Observation dupliquée : ${key}`)
    keys.add(key)
    const before = state.anchors[key]
    const latest = state.current[key]
    if (latest && (after.period < latest.period || after.period === latest.period && Date.parse(after.checkedAt) < Date.parse(latest.checkedAt))) {
      issues.push({ family: after.family, entity: after.entity, reason: `Observation plus ancienne ignorée : ${after.fieldLabel}.` })
      continue
    }
    // A return to an already superseded value for the same publication period
    // is conflicting evidence. Keep the last accepted observation for review.
    const roundTrip = latest && !same(latest.value, after.value) && state.events.some(event =>
      observationKey(event) === key && event.beforePeriod === after.period && event.period === after.period && same(event.before, after.value))
    if (roundTrip) {
      issues.push({ family: after.family, entity: after.entity, reason: `Valeur contradictoire pour la même période : ${after.fieldLabel}. Dernière observation conservée.` })
      continue
    }
    state.current[key] = after
    if (!before) {
      state.anchors[key] = after
      // Initialisation is silent. New fields on an existing product are also
      // silent: a newly qualified parser is not a market announcement.
      // Old articles added to a newsroom archive are not breaking news.
      const recentAnnouncement = after.rule !== 'announcement' || Date.parse(after.period) >= Date.parse(state.initializedAt) - 7 * 86400000
      if (previous && !entities.has(`${after.family}:${after.entity}`) && after.discovery && recentAnnouncement) {
        const event = makeEvent(null, after, stamp, 'new')
        if (!seen.has(event.id)) { seen.add(event.id); newEvents.push(event) }
      }
      continue
    }
    if (!meaningful(before, after)) continue
    const event = makeEvent(before, after, stamp)
    state.anchors[key] = after
    if (!seen.has(event.id)) { seen.add(event.id); newEvents.push(event) }
  }
  state.events = [...newEvents, ...state.events].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt) || a.id.localeCompare(b.id))
  state.lastCheckedAt = stamp
  state.sourceRevision = sourceRevision
  state.lastErrorCount = issues.length
  const counts = Object.fromEntries(Object.keys(FAMILIES).map(family => [family, new Set(valid.filter(o => o.family === family).map(o => o.entity)).size]))
  // All history stays in the state branch. The public feed is bounded.
  const feed = { schemaVersion: 1, initializedAt: state.initializedAt, checkedAt: stamp, sourceRevision, observationCount: valid.length, coverage: counts, newSignalCount: newEvents.length, errors: issues, events: state.events.slice(0, 500), thresholds: { compositionPoints: 2, aumRelativePct: 20, occupancyPoints: 2 }, scopeNote: 'Produits et sources raccordés à l’application. Une nouvelle donnée suivie ne prouve pas un lancement sur le marché.' }
  return { state, feed, newEvents }
}
