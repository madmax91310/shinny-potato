import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { analyze, pairOverlap, readiness, validateSnapshot, validateAllocation, compare, buildTweet } from '../src/pages/etf-scanner/lib.js'
const now = new Date('2026-10-10T18:00:00Z')
const policy = { maxSnapshotAgeDays: 7, maxCheckAgeDays: 2 }
const a = 'IE00B4L5Y983', b = 'IE00B5BMR087', pea = 'FR001400U5Q4'
const stock = (isin, weightPct, name = isin) => ({ isin, name, weightPct, assetClass: 'Equity', country: 'United States', sector: 'Information Technology' })
function snapshot(isin, rows) { return { schemaVersion: 1, isin, complete: true, basis: 'fund', scope: 'all-published-positions', asOf: '2026-10-08', rows, positionCount: rows.length, portfolioWeightPct: rows.reduce((s, r) => s + r.weightPct, 0), sourceUrl: 'https://www.blackrock.com/' } }
const sa = snapshot(a, [stock('US0378331005', 25, 'Apple'), stock('US0378331005', 15, 'Apple other venue'), stock('US5949181045', 50, 'Microsoft'), { isin: null, name: 'Cash', assetClass: 'Cash', weightPct: 10 }])
const sb = snapshot(b, [stock('US0378331005', 60, 'Apple'), stock('US02079K3059', 39, 'Alphabet A'), stock(null, 1, 'Rights')])
const entry = s => ({ file: s.isin + '.json', positionCount: s.rows.length, basis: s.basis, scope: s.scope, asOf: s.asOf, checkedAt: '2026-10-10' })
const manifest = { instruments: { [a]: entry(sa), [b]: entry(sb) }, peaCoverage: { [pea]: { basis: 'index', asOf: sa.asOf, checkedAt: '2026-10-10' } }, policy }
const snapshots = { [a]: sa, [b]: sb }
assert.equal(pairOverlap(sa, sb).weight, 40)
assert.equal(pairOverlap(sb, sa).weight, 40)
assert.equal(pairOverlap(sa, sb).count, 1)
const r = analyze([{ isin: a, weight: 50 }, { isin: b, weight: 50 }], snapshots, manifest, now)
assert.equal(r.positions.length, 3)
assert.equal(r.positions[0].weight, 50)
assert.deepEqual(r.positions[0].contributions, [{ isin: a, weight: 20 }, { isin: b, weight: 30 }])
assert.equal(r.sharedWeight, 50); assert.equal(r.identifiedWeight, 94.5); assert.equal(r.unidentifiedWeight, .5); assert.equal(r.nonEquityWeight, 5)
assert.equal(r.countries[0].weight, 95)
const partial = analyze([{ isin: a, weight: 50 }, { isin: pea, weight: 50 }], snapshots, manifest, now)
assert.equal(partial.analyzedWeight, 50); assert.equal(partial.positions[0].weight, 25); assert.equal(partial.complete, false)
assert.equal(compare(r, partial), null)
assert.match(buildTweet(partial, null, [{ isin: a, weight: 50 }, { isin: pea, weight: 50 }], [], x => x), /Analyse partielle : 50 %/)
assert.throws(() => analyze([{ isin: pea, weight: 100 }], snapshots, manifest, now), /Aucune composition/)
assert.ok(readiness({ ...entry(sa), available: true, checkedAt: '2026-10-07' }, policy, now))
assert.ok(readiness({ ...entry(sa), asOf: '2026-10-11' }, policy, now))
assert.ok(readiness({ ...entry(sa), asOf: '2026-02-30' }, policy, now))
assert.ok(readiness({ ...entry(sa), basis: 'index' }, policy, now))
assert.equal(readiness({ ...entry(sa), checkedAt: '2026-10-08' }, policy, now), null)
assert.throws(() => validateAllocation([{ isin: a, weight: 80 }, { isin: b, weight: 30 }]), /110/)
assert.throws(() => validateAllocation([{ isin: a, weight: 50 }, { isin: a, weight: 50 }]), /plusieurs fois/)
assert.throws(() => validateAllocation([{ isin: a, weight: NaN }]), /Chaque ETF/)
assert.throws(() => validateSnapshot({ ...sa, complete: false }, a, entry(sa)), /incohérente/)
assert.throws(() => validateSnapshot({ ...sa, rows: sa.rows.slice(1) }, a, entry(sa)), /incohérente/)
assert.throws(() => validateSnapshot({ ...sa, portfolioWeightPct: 99 }, a, entry(sa)), /somme/)
const negativeCash = snapshot(a, [stock('US0378331005', 99), { name: 'Cash', isin: null, assetClass: 'Cash', weightPct: 1.1 }, { name: 'FX', isin: null, assetClass: 'FX', weightPct: -.1 }])
validateSnapshot(negativeCash, a, entry(negativeCash))
const root = 'public/data/scanner-holdings/'
const live = JSON.parse(readFileSync(root + 'manifest.json'))
const real = Object.fromEntries(Object.entries(live.instruments).map(([isin, e]) => {
 const raw = readFileSync(root + e.file)
 assert.equal(createHash('sha256').update(raw).digest('hex'), e.fileSha256, 'Published file digest must match its bytes')
 return [isin, validateSnapshot(JSON.parse(raw), isin, e)]
}))
// Use the last check date: this regression remains useful when the real data age.
const observation = new Date(Math.max(...Object.values(live.instruments).map(e => Date.parse(e.checkedAt))) + 12 * 3600000)
for (const isin of Object.keys(real)) {
 const result = analyze([{ isin, weight: 100 }], real, live, observation)
 assert.equal(result.complete, true)
 assert.ok(result.identifiedWeight > 90)
 assert.ok(Math.abs(result.equityWeight + result.nonEquityWeight - real[isin].portfolioWeightPct) < 1e-7)
}
const worldUsa = analyze([{ isin: a, weight: 80 }, { isin: b, weight: 20 }], real, live, observation)
const worldEm = analyze([{ isin: a, weight: 80 }, { isin: 'IE00BKM4GZ66', weight: 20 }], real, live, observation)
assert.ok(worldUsa.sharedCount > 400); assert.equal(worldEm.sharedCount, 0)
assert.ok(compare(worldUsa, worldEm).top10 < 0)
console.log(`Scanner: financial invariants, partial coverage, freshness and all ${Object.keys(real).length} real portfolios passed.`)
