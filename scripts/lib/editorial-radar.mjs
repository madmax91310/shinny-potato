import { normalizedReplication, replicationField, replicationEquivalent, replicationWordingEvent } from '../../src/lib/replication-method.js'
import { createHash } from 'node:crypto'
import { publishablePurchasingNews } from './purchasing-power-news.mjs'
import { reconcileDws } from './dws-reconciliation.mjs'
import { factualTitle, readableInvestorFiling } from '../../src/lib/radar-editorial.js'

export const FAMILIES = { etf: 'ETF', indices: 'Indices', courtiers: 'Courtiers', epargne: 'Épargne', scpi: 'SCPI', assurance: 'Assurance-vie', investisseurs: 'Investisseurs', economie: 'Repères économiques', 'pouvoir-achat': 'Pouvoir d’achat' }
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
// Valuation/exposure dates describe a snapshot, not the time of collection.
// A revision of that snapshot is evidence to review, never a market movement.
export const datedEtfSnapshot = o => o.family === 'etf' && (o.field === 'aum' || o.field === 'top10' || o.field?.startsWith('metric:') || /^(countries|sectors):/.test(o.field))
export function meaningful(before, after) {
  if (replicationEquivalent(before, after)) return false
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
  const purchasing = after.family === 'pouvoir-achat'
  const metadata = purchasing ? Object.fromEntries(['topic', 'topicLabel', 'publisher', 'status', 'statusEvidence', 'summary'].map(key => [key, after[key] ?? ''])) : Object.fromEntries(['launchDetails', 'documentUrl', 'documentCheckedAt', 'documentHash'].filter(key => after[key] !== undefined).map(key => [key, after[key]]))
  const title = after.rule === 'announcement' ? `Nouveau communiqué officiel : ${after.label}` : kind === 'new' ? `${after.label} : nouvelle donnée suivie` : isPublication ? `${after.label} : nouvelle publication` : `${after.label} : ${after.fieldLabel.toLocaleLowerCase('fr-FR')} en mouvement`
  const movement = kind === 'new' ? `Une nouvelle donnée sourcée est disponible : ${afterText}.` : isPublication ? `La publication ${after.period} est disponible : ${afterText}.` : `${after.fieldLabel} : ${beforeText} → ${afterText}.`
  const angle = after.angle ?? `Qu’est-ce que cette évolution change pour quelqu’un qui utilise ${after.label} ?`
  const purchasingDraft = purchasing ? `🔖 Sauvegarde ce tweet\n\n${after.label}\n\n${after.summary}\n\n📌 ${after.status}\n\n${angle}\n\nSource : ${after.sourceUrl}` : null
  return { ...metadata, id, family: after.family, entity: after.entity, label: after.label, field: after.field, fieldLabel: after.fieldLabel, title: purchasing ? `${kind === 'new' ? 'Pouvoir d’achat' : 'Actualité mise à jour'} : ${after.label}` : title, kind: kind === 'new' ? 'new' : isPublication ? 'publication' : 'change', priority: after.priority ?? 'normal', detectedAt, before: before?.value ?? null, after: after.value, beforeText, afterText, beforePeriod: before?.period ?? null, period: after.period, scope: after.scope, unit: after.unit ?? '', sourceUrl: after.sourceUrl, previousSourceUrl: before?.sourceUrl ?? null, checkedAt: after.checkedAt, tool: after.tool, angle, draft: purchasingDraft ?? `${movement}\n\n${after.label}${after.entity.match(/^[A-Z]{2}[A-Z0-9]{10}$/) ? ` · ${after.entity}` : ''}\nPérimètre : ${after.scope}\n${before ? `Ancienne observation : ${before.period}\n` : ''}Observation actuelle : ${after.period}\n\n${angle}`, reason: after.reason ?? 'Changement d’une donnée publiée, à périmètre comparable.' }
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
export function advanceRadar(previous, observations, { now = new Date(), sourceRevision = '', errors = [], purchasingSources = [], verifiedCompositions = [], compositionVerificationFailures = [] } = {}) {
  if (previous && (previous.schemaVersion !== 1 || !previous.current || !previous.anchors || !Array.isArray(previous.events))) throw new Error('Historique radar invalide : conservation du fichier précédent.')
  const stamp = now.toISOString(), state = previous ? structuredClone(previous) : { schemaVersion: 1, initializedAt: stamp, current: {}, anchors: {}, events: [] }
  // Retire the removed legislative category from existing items and alert retries.
  for (const collection of [state.current, state.anchors]) for (const [key, item] of Object.entries(collection)) if (!publishablePurchasingNews(item)) delete collection[key]
  state.events = state.events.filter(publishablePurchasingNews)
  for (const event of state.events) if (replicationWordingEvent(event)) {
    event.status = 'wording-only'
    event.normalization = { version: 1, before: normalizedReplication(event.before, event.previousSourceUrl), after: normalizedReplication(event.after, event.sourceUrl), reason: 'Equivalent replication wording; original evidence retained.' }
  }
  const issues = [...errors], newEvents = [], seen = new Set(state.events.map(event => event.id))
  state.conflicts ??= {}
  // Keep old alerts for audit, but remove same-snapshot changes from the public
  // feed and from notification retries, including alerts predating this guard.
  for (const event of state.events) if (datedEtfSnapshot(event) && event.beforePeriod === event.period && event.kind === 'change') event.status = 'source-conflict'
  const entities = new Set(Object.values(state.current).map(o => `${o.family}:${o.entity}`))
  const valid = observations.filter(publishablePurchasingNews).filter(o => {
    if (validObservation(o, now)) return true
    issues.push({ family: o?.family ?? 'radar', entity: o?.entity ?? '', reason: `Observation non exploitable : ${o?.fieldLabel ?? o?.field ?? 'champ inconnu'}.` })
    return false
  })
  // Only an explicitly complete, validated allocation proves an omitted group
  // has zero weight. A partial/missing collection must never erase a value.
  const allocations = new Map()
  for (const row of valid) if (row.family === 'etf' && /^(countries|sectors):/.test(row.field)) {
    const group = stable([row.entity, row.scope, row.field.split(':')[0], row.period])
    if (!allocations.has(group)) allocations.set(group, [])
    allocations.get(group).push(row)
  }
  for (const rows of allocations.values()) {
    const sample = rows[0], prefix = sample.field.split(':')[0] + ':'
    const fields = new Set(rows.map(row => row.field))
    const total = rows.reduce((sum, row) => sum + row.value, 0)
    if (!rows.every(row => row.completeComposition === true && typeof row.value === 'number' &&
      row.sourceHash && row.sourceHash === sample.sourceHash && row.sourceUrl === sample.sourceUrl &&
      row.checkedAt === sample.checkedAt) || fields.size !== rows.length || total < 99 || total > 101) continue
    for (const old of Object.values(state.current)) {
      if (old.family !== 'etf' || old.entity !== sample.entity || old.scope !== sample.scope ||
          !old.field.startsWith(prefix) || fields.has(old.field) || old.period > sample.period) continue
      valid.push({ ...sample, field: old.field, fieldLabel: old.fieldLabel, value: 0,
        absenceEvidence: 'Absent from a validated complete allocation' })
    }
  }
  const reconciled = reconcileDws(state, valid, verifiedCompositions, now, compositionVerificationFailures)
  const keys = new Set()
  for (const after of valid) {
    const key = observationKey(after)
    if (keys.has(key)) throw new Error(`Observation dupliquée : ${key}`)
    keys.add(key)
    if (reconciled.has(key)) continue
    const before = state.anchors[key]
    const latest = state.current[key]
    if (latest && (after.period < latest.period || after.period === latest.period && Date.parse(after.checkedAt) < Date.parse(latest.checkedAt))) {
      state.ignoredObservations ??= {}
      state.ignoredObservations[key] = { period: after.period, checkedAt: after.checkedAt, receivedAt: stamp, reason: 'older-observation', retainedPeriod: latest.period }
      continue
    }
    if (latest && datedEtfSnapshot(after) && after.period === latest.period && !same(latest.value, after.value)) {
      const conflictKey = `${key}:${after.period}`
      const conflict = state.conflicts[conflictKey] ??= { accepted: latest, period: after.period, firstSeenAt: stamp, proposals: [] }
      if (conflict.resolvedAt) {
        conflict.resolutions ??= []
        conflict.resolutions.push({ resolvedAt: conflict.resolvedAt, ...conflict.resolution })
        delete conflict.resolvedAt
        delete conflict.resolution
      }
      const proposalId = digest({ value: after.value, sourceUrl: after.sourceUrl, sourceHash: after.sourceHash ?? null })
      const existing = conflict.proposals.find(p => p.id === proposalId)
      if (existing) existing.lastSeenAt = stamp
      else conflict.proposals.push({ id: proposalId, observation: after, firstSeenAt: stamp, lastSeenAt: stamp })
      continue
    }
    // A return to an already superseded value for the same publication period
    // is conflicting evidence. Keep the last accepted observation for review.
    const roundTrip = latest && !replicationEquivalent(latest, after) && !same(latest.value, after.value) && state.events.some(event =>
      observationKey(event) === key && event.beforePeriod === after.period && event.period === after.period && same(event.before, after.value) && !replicationWordingEvent(event))
    if (roundTrip) {
      issues.push({ family: after.family, entity: after.entity, reason: `Valeur contradictoire pour la même période : ${after.fieldLabel}. Dernière observation conservée.` })
      continue
    }
    state.current[key] = after
    // Advance equivalent wording silently; preserve every raw before/after in
    // the historical events and use the latest source as the next baseline.
    if (before && replicationEquivalent(before, after)) { state.anchors[key] = after; continue }
    if (!before) {
      state.anchors[key] = after
      // Initialisation is silent. New fields on an existing product are also
      // silent: a newly qualified parser is not a market announcement.
      // Old articles added to a newsroom archive are not breaking news.
      const familyBootstrap = after.family === 'pouvoir-achat' && !Object.values(previous?.current ?? {}).some(o => o.family === after.family)
      const recentAnnouncement = after.rule !== 'announcement' || Date.parse(after.period) >= Date.parse(after.family === 'pouvoir-achat' ? stamp : state.initializedAt) - 7 * 86400000
      if (previous && !familyBootstrap && !entities.has(`${after.family}:${after.entity}`) && after.discovery && recentAnnouncement) {
        const event = makeEvent(null, after, stamp, 'new')
        event.title = factualTitle(event)
        if (!seen.has(event.id)) { seen.add(event.id); newEvents.push(event) }
      }
      continue
    }
    // A clean later period restarts comparison from a non-disputed baseline.
    // Do this even below the editorial threshold; otherwise the bad anchor
    // would contaminate a later cumulative movement.
    const disputedAnchor = datedEtfSnapshot(after) && after.period > before.period &&
      state.conflicts[`${key}:${before.period}`]?.proposals?.length
    if (disputedAnchor) {
      state.anchors[key] = after
      continue
    }
    if (!meaningful(before, after)) continue
    const event = makeEvent(before, after, stamp)
    if (replicationField(after)) event.normalization = { version: 1, before: normalizedReplication(before.value, before.sourceUrl), after: normalizedReplication(after.value, after.sourceUrl) }
    event.title = factualTitle(event)
    state.anchors[key] = after
    if (!seen.has(event.id)) { seen.add(event.id); newEvents.push(event) }
  }
  // Update historical wording as well as new events without resetting their
  // ids, detection dates, evidence, or notification/read receipts.
  for (const event of [...newEvents, ...state.events]) Object.assign(event, readableInvestorFiling(event))
  state.events = [...newEvents, ...state.events].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt) || a.id.localeCompare(b.id))
  // A later revision can invalidate an already emitted cross-period movement.
  // Keep its audit record, but never publish/retry a signal whose baseline or
  // destination snapshot is disputed, even after that conflict is resolved.
  const disputed = new Set(Object.values(state.conflicts).filter(c => c.proposals?.length)
    .map(c => `${observationKey(c.accepted)}:${c.period}`))
  for (const event of state.events) if (datedEtfSnapshot(event) && event.kind === 'change' &&
    [event.beforePeriod, event.period].some(period => disputed.has(`${observationKey(event)}:${period}`))) {
    event.status = 'source-conflict'
  }
  const publishableNewEvents = newEvents.filter(event => !['source-conflict', 'wording-only'].includes(event.status))
  // Enrich an existing announcement without inventing a second launch alert.
  for (const row of valid.filter(row => row.family === 'etf' && row.field === 'announcement' && row.launchDetails)) {
    for (const event of state.events.filter(event => event.entity === row.entity && event.period === row.period && event.label === row.label)) {
      for (const key of ['launchDetails', 'documentUrl', 'documentCheckedAt', 'documentHash']) event[key] = row[key]
    }
  }
  for (const [conflictKey, conflict] of Object.entries(state.conflicts)) {
    const latest = state.current[observationKey(conflict.accepted)]
    if (latest?.period > conflict.period && !conflict.resolvedAt) {
      conflict.resolvedAt = stamp
      conflict.resolution = { kind: 'superseded-period', period: latest.period,
        sourceUrl: latest.sourceUrl, sourceHash: latest.sourceHash ?? null,
        reason: 'Publication plus récente ; contradiction historique conservée, sans validation rétroactive ni mouvement de marché déduit.' }
    }
    if (!conflict.resolvedAt) issues.push({ family: conflict.accepted.family, entity: conflict.accepted.entity, reason: `Valeur contradictoire pour la même période (${conflict.period}) : ${conflict.accepted.fieldLabel}. Dernière observation conservée ; propositions archivées (${conflictKey}).` })
  }
  state.lastCheckedAt = stamp
  state.sourceRevision = sourceRevision
  state.lastErrorCount = issues.length
  const counts = Object.fromEntries(Object.keys(FAMILIES).map(family => [family, new Set(valid.filter(o => o.family === family).map(o => o.entity)).size]))
  // All history stays in the state branch. The public feed is bounded.
  const purchasingItems = Object.values(state.current).filter(o => o.family === 'pouvoir-achat').sort((a, b) => b.period.localeCompare(a.period) || a.label.localeCompare(b.label)).slice(0, 120)
  const feed = { purchasingPower: { sources: purchasingSources, items: purchasingItems }, schemaVersion: 1, initializedAt: state.initializedAt, checkedAt: stamp, sourceRevision, observationCount: valid.length, coverage: counts, newSignalCount: publishableNewEvents.length, errors: issues, events: state.events.filter(event => !['source-conflict', 'wording-only'].includes(event.status)).slice(0, 500), thresholds: { compositionPoints: 2, aumRelativePct: 20, occupancyPoints: 2 }, scopeNote: 'Produits et sources raccordés à l’application. Une nouvelle donnée suivie ne prouve pas un lancement sur le marché.' }
  return { state, feed, newEvents: publishableNewEvents }
}
