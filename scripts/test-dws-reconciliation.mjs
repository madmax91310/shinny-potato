import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { advanceRadar, observationKey } from './lib/editorial-radar.mjs'

const read = name => JSON.parse(readFileSync(new URL(`./fixtures/radar-review-583/${name}.json`, import.meta.url)))
const conflicts = read('active-conflicts-2026-10-14'), proofs = read('verified-portfolios')
const current = Object.fromEntries(Object.values(conflicts).map(c => [observationKey(c.accepted), c.accepted]))
const state = { schemaVersion: 1, initializedAt: '2026-10-01T00:00:00Z', current, anchors: current, conflicts, events: [] }
const now = new Date('2026-10-14T10:00:00Z')
const rows = proofs.flatMap(p => Object.entries(p.allocations).flatMap(([field, allocations]) => allocations.map(r => ({
  ...Object.values(conflicts).find(c => c.accepted.entity === p.entity).accepted,
  field: `${field}:${r.name}`, fieldLabel: `${field} ${r.name}`, value: r.weightPct,
  sourceHash: p.sourceHash, sourceUrl: p.sourceUrl, period: p.period, checkedAt: p.checkedAt,
  scope: `${p.entity} · fund · ${p.method}`, completeComposition: true,
}))))
const advance = (previous = state, observations = rows, verifiedCompositions = proofs, date = now) =>
  advanceRadar(previous, observations, { now: date, verifiedCompositions })
const active = result => Object.values(result.state.conflicts).filter(c => !c.resolvedAt)
const result = advance()
assert.equal(Object.keys(conflicts).length, 34)
assert.equal(active(result).length, 0)
assert.equal(result.newEvents.length, 0)
for (const c of Object.values(result.state.conflicts)) {
  assert.equal(c.resolution.kind, 'verified-source-revision')
  assert(c.proposals.length > 0)
  assert.match(c.resolution.evidencePath, /^dws-snapshots\/[a-f0-9]{64}\.json$/)
  assert.equal(result.state.current[observationKey(c.accepted)].value, c.resolution.value)
}
assert.equal(advance(result.state).newEvents.length, 0, 'A replay creates no signal')
assert.equal(active(advance(state, rows, [])).length, 34, 'Local data alone never resolve conflicts')
for (const change of [p => { p.sourceHash = 'f'.repeat(64) }, p => { p.sourceUrl = 'https://example.org/holdings' },
  p => { p.checkedAt = '2026-10-14T09:00:00Z' }, p => { p.checkedAt = '2026-10-15T10:00:00Z' },
  p => { p.allocations.countries[0].weightPct += 1 }, p => { p.allocations.sectors = [] }]) {
  const bad = structuredClone(proofs); bad.forEach(change)
  assert.equal(active(advance(state, rows, bad)).length, 34)
}
assert.equal(active(advance(state, rows.map(r => ({ ...r, completeComposition: false })))).length, 34)
const recent = structuredClone(state)
for (const c of Object.values(recent.conflicts)) for (const p of c.proposals) p.firstSeenAt = p.lastSeenAt = '2026-10-14T09:59:00Z'
const waiting = advance(recent)
assert.equal(active(waiting).length, 34, 'A new revision waits for stability')
assert.equal(active(advance(waiting.state, rows, proofs, new Date('2026-10-14T15:00:00Z'))).length, 34, 'Replaying an old proof cannot confirm stability')
const later = proofs.map(p => ({ ...p, checkedAt: '2026-10-14T15:00:00Z' }))
assert.equal(active(advance(waiting.state, rows, later, new Date('2026-10-14T15:00:00Z'))).length, 0)
const interrupted = advanceRadar(waiting.state, rows, { now: new Date('2026-10-14T14:00:00Z'),
  compositionVerificationFailures: proofs.map(p => p.entity) })
assert.equal(active(advance(interrupted.state, rows, later, new Date('2026-10-14T15:00:00Z'))).length, 34,
  'A failed or differing live check restarts the stability window')
const changed = structuredClone(rows)
changed[0].value += .25
changed[0].sourceHash = 'e'.repeat(64)
const reopened = advance(result.state, changed, [])
assert(active(reopened).length > 0, 'A further same-period revision reopens its alert')
assert.equal(reopened.newEvents.length, 0)
// An already notified or pending event using a disputed period stays suppressed.
const withEvent = structuredClone(state)
withEvent.events = [{ ...Object.values(current)[0], id: 'historical-event', kind: 'change', beforePeriod: '2026-10-07', detectedAt: now.toISOString() }]
const audited = advance(withEvent)
assert.equal(audited.state.events[0].status, 'source-conflict')
assert.equal(audited.feed.events.length, 0)
console.log('DWS: 34 source revisions reconciled; missing, stale, partial, changing and replayed evidence remain guarded; no editorial signal.')

const nextPeriod = rows.map(r => ({ ...r, period: '2026-10-15', checkedAt: '2026-10-15T10:00:00Z' }))
const superseded = advance(state, nextPeriod, [], new Date('2026-10-15T10:00:00Z'))
assert.equal(active(superseded).length, 0)
assert.equal(superseded.newEvents.length, 0)
for (const [key, c] of Object.entries(superseded.state.conflicts)) {
  assert.equal(c.resolution.kind, 'superseded-period')
  assert.equal(c.resolution.period, '2026-10-15')
  assert.deepEqual(c.accepted, state.conflicts[key].accepted)
  assert.deepEqual(c.proposals, state.conflicts[key].proposals)
}
const certifiedThenLater = advance(result.state, nextPeriod, [], new Date('2026-10-15T10:00:00Z'))
for (const c of Object.values(certifiedThenLater.state.conflicts)) assert.equal(c.resolution.kind, 'verified-source-revision')
