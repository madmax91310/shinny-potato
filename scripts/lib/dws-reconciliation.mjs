import {unknownAllocationGroups} from './radar-allocation-coverage.mjs'
import { observationKey } from './editorial-radar.mjs'

const STABILITY_MS = 4 * 60 * 60 * 1000
const fields = ['countries', 'sectors']
const equal = (a, b) => Math.abs(a - b) < 0.0000001

// Accept a stable, independently re-read issuer revision, never a market move.
// Historical contradictions remain archived; only their operational alert closes.
export function reconcileDws(state, observations, proofs, now, failedEntities = []) {
  state.compositionChecks ??= {}
  const reconciled = new Set()
  for (const row of Object.values(state.current)) if (failedEntities.includes(row.entity) &&
      /^(countries|sectors):/.test(row.field)) state.compositionChecks[`${row.entity}:${row.period}`] ??= {}
  for (const [key, check] of Object.entries(state.compositionChecks)) if (failedEntities.some(entity => key.startsWith(entity + ':'))) {
    state.compositionChecks[key] = { ...check, sourceHash: null, stabilitySourceHash: null, stableSince: now.toISOString(),
      checkedAt: now.toISOString(), status: 'interrupted' }
  }
  for (const proof of proofs) {
    const { entity, period, sourceHash, sourceUrl, method, checkedAt } = proof
    const stabilityScope = 'complete-document-except-display-name-of-checksummed-isin-v1'
    if (proof.stabilitySourceHash != null && (!/^[a-f0-9]{64}$/.test(proof.stabilitySourceHash)
        || proof.stabilityScope !== stabilityScope)) continue
    if (failedEntities.includes(entity)) continue
    if (!/^[A-Z]{2}[A-Z0-9]{10}$/.test(entity ?? '') ||
        sourceUrl !== `https://etf.dws.com/api/pdp/en-gb/etf/${entity}/holdings` ||
        !/^[a-f0-9]{64}$/.test(sourceHash ?? '') ||
        !method?.includes('Full physical securities portfolio; registration country and industry') ||
        !Number.isFinite(Date.parse(checkedAt)) || Date.parse(checkedAt) > +now ||
        +now - Date.parse(checkedAt) > 5 * 60000) continue
    const rows = observations.filter(o => o.family === 'etf' && o.entity === entity &&
      fields.some(field => o.field.startsWith(field + ':')))
    if (!rows.length || !rows.every(o => o.period === period && o.sourceHash === sourceHash &&
        o.sourceUrl === sourceUrl && o.completeComposition === true &&
        o.scope === `${entity} · fund · ${method}`)) continue
    if (!fields.every(field => {
      const expected = proof.allocations?.[field]
      const actual = rows.filter(o => o.field.startsWith(field + ':'))
      if (!Array.isArray(expected) || !expected.length || new Set(expected.map(r => r.name)).size !== expected.length ||
          !expected.every(r => Number.isFinite(r.weightPct)) ||
          Math.abs(expected.reduce((s, r) => s + r.weightPct, 0) - 100) > 1) return false
      // Old synthesized zero proposals are not independent evidence for an
      // omitted group when the complete source still has unclassified weight.
      if (unknownAllocationGroups(expected).length && actual.some(o =>
          !expected.some(r => o.field === `${field}:${r.name}`))) return false
      return expected.every(r => actual.some(o => o.field === `${field}:${r.name}` && equal(o.value, r.weightPct))) &&
        actual.every(o => equal(o.value, expected.find(r => o.field === `${field}:${r.name}`)?.weightPct ?? 0))
    })) continue
    const key = `${entity}:${period}`
    const old = state.compositionChecks[key]
    let since = checkedAt
    if (old) {
      if (Date.parse(checkedAt) <= Date.parse(old.checkedAt)) continue
      // A renamed display label does not change a checksummed ISIN's identity.
      // The independently parsed signature still contains every other raw field.
      // Legacy checks retain their clock only when their complete raw hash matches.
      if (old.sourceHash === sourceHash || (proof.stabilitySourceHash &&
          old.stabilityScope === proof.stabilityScope && old.stabilitySourceHash === proof.stabilitySourceHash)) since = old.stableSince
    } else {
      // Bootstrap from timestamped historical source hashes, not repeated reads
      // of today's local files. A later competing hash resets the stability clock.
      const proposals = Object.values(state.conflicts).filter(c => c.accepted.entity === entity && c.period === period)
        .flatMap(c => c.proposals ?? [])
      const matches = proposals.filter(p => p.observation.sourceHash === sourceHash).map(p => Date.parse(p.firstSeenAt)).filter(Number.isFinite)
      const competing = proposals.filter(p => p.observation.sourceHash !== sourceHash).map(p => Date.parse(p.lastSeenAt)).filter(Number.isFinite)
      if (matches.length) since = new Date(Math.max(Math.min(...matches), ...competing)).toISOString()
    }
    const stable = Date.parse(checkedAt) - Date.parse(since) >= STABILITY_MS
    state.compositionChecks[key] = { sourceHash, sourceUrl, checkedAt, stableSince: since,
      ...(proof.stabilitySourceHash ? {stabilitySourceHash: proof.stabilitySourceHash, stabilityScope: proof.stabilityScope} : {}),
      evidencePath: `dws-snapshots/${sourceHash}.json`, status: stable ? 'confirmed' : 'pending' }
    if (!stable) continue
    for (const row of rows) {
      const rowKey = observationKey(row), conflict = state.conflicts[`${rowKey}:${period}`]
      if (!conflict || conflict.resolvedAt) continue
      const latest = state.current[rowKey]
      if (latest?.period > period) continue
      conflict.resolvedAt = now.toISOString()
      conflict.resolution = { kind: 'verified-source-revision', value: row.value,
        ...state.compositionChecks[key], reason: 'Portefeuille officiel complet relu indépendamment ; révision stable au moins quatre heures. Historique conservé, aucun mouvement de marché déduit.' }
      state.current[rowKey] = row
      state.anchors[rowKey] = row
      reconciled.add(rowKey)
    }
  }
  return reconciled
}
