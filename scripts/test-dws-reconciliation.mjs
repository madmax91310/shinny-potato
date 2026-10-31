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

// The raw archives differ when a known ISIN's display name changes. Independent
// Python parsing keeps all other fields in this versioned document signature.
const scope = 'complete-document-except-display-name-of-checksummed-isin-v1'
const signatureProofs = proofs.map(p=>({...p,stabilitySourceHash:'1'.repeat(64),stabilityScope:scope}))
const seeded = advance(recent,rows,signatureProofs)
const at = (date,hash='e'.repeat(64),signature='1'.repeat(64)) => ({
  date:new Date(date),rows:rows.map(r=>({...r,sourceHash:hash,checkedAt:date})),
  proofs:signatureProofs.map(p=>({...p,sourceHash:hash,checkedAt:date,stabilitySourceHash:signature}))})
const before = at('2026-10-14T13:58:00Z'),after = at('2026-10-14T14:01:00Z')
const renamed = advance(seeded.state,before.rows,before.proofs,before.date)
assert.equal(active(renamed).length,34,'A name-only revision cannot shorten four hours')
assert.equal(active(advance(renamed.state,after.rows,after.proofs,after.date)).length,0,
  'A name-only revision does not restart four hours of unchanged financial data and identities')
const financial = at('2026-10-14T13:58:00Z','e'.repeat(64),'2'.repeat(64))
const reset = advance(seeded.state,financial.rows,financial.proofs,financial.date)
const tooSoon = at('2026-10-14T14:01:00Z','e'.repeat(64),'2'.repeat(64))
assert.equal(active(advance(reset.state,tooSoon.rows,tooSoon.proofs,tooSoon.date)).length,34,
  'A financial change restarts stability even when country/sector totals happen to match')
const failedSignature = advanceRadar(seeded.state,rows,{now:new Date('2026-10-14T12:00:00Z'),compositionVerificationFailures:proofs.map(p=>p.entity)})
assert.equal(active(advance(failedSignature.state,after.rows,after.proofs,after.date)).length,34,
  'A failed check interrupts the new signature clock too')
const legacyChanged = advance(waiting.state,before.rows,before.proofs,before.date)
assert.equal(active(advance(legacyChanged.state,after.rows,after.proofs,after.date)).length,34,
  'Migration never backdates a signature that was not previously certified')
for(const invalid of [{stabilitySourceHash:'x',stabilityScope:scope},{stabilitySourceHash:'1'.repeat(64),stabilityScope:'unknown'}]){
 assert.equal(active(advance(recent,rows,proofs.map(p=>({...p,...invalid})))).length,34)
}
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

// Defend the independent qualifier against legacy synthesized zeros arriving
// from an older producer/cache as well as preventing their creation upstream.
{
  const {reconcileDws} = await import('./lib/dws-reconciliation.mjs')
  const fixture = JSON.parse(readFileSync(new URL('./fixtures/radar-unknown-classifications-20261030.json', import.meta.url)))
  const state = structuredClone(fixture.state), now = new Date('2026-10-31T01:00:00Z')
  const fakeZeros = fixture.affected.map(({key}) => ({...fixture.rows.find(r => r.entity === fixture.state.current[key].entity && r.field.startsWith('countries:')),field:fixture.state.current[key].field,fieldLabel:fixture.state.current[key].fieldLabel,value:0,absenceEvidence:'Absent from a validated complete allocation'}))
  const before = JSON.stringify(state)
  const reconciled = reconcileDws(state,[...fixture.rows,...fakeZeros],fixture.proofs.map(p=>({...p,checkedAt:now.toISOString()})),now)
  assert.equal(reconciled.size,0,'Unclassified weight prevents a legacy zero from passing independent verification')
  assert.equal(JSON.stringify(state),before,'No clock, anchor, value or conflict advanced on rejected inference')
}
