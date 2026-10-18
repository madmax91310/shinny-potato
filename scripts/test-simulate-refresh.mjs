import assert from 'node:assert/strict'
import { scenarioTarget, nextMonth, monthEnd } from './simulate-refresh.mjs'
assert.equal(nextMonth('2026-12'), '2027-01')
assert.equal(monthEnd('2027-02'), '2027-02-28')
assert.deepEqual(scenarioTarget('next-month', '2026-09'), { until: '2026-10', fx: true })
assert.deepEqual(scenarioTarget('ecb-outage', '2026-09'), { until: '2026-10', fx: false })
assert.deepEqual(scenarioTarget('year-rollover', '2026-09'), { until: '2027-01', fx: true })
assert.deepEqual(scenarioTarget('year-rollover', '2026-12'), { until: '2027-01', fx: true })
assert.throws(() => scenarioTarget('other', '2026-09'))
console.log('Refresh rehearsal scenarios: next month, ECB outage and year rollover targets verified.')

const {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync}=await import('node:fs')
const {tmpdir}=await import('node:os')
const {join,dirname}=await import('node:path')
const {simulate}=await import('./simulate-refresh.mjs')
const repo=mkdtempSync(join(tmpdir(),'refresh-rehearsal-'))
try {
 const save=(p,d)=>{mkdirSync(dirname(join(repo,p)),{recursive:true});writeFileSync(join(repo,p),JSON.stringify(d))}
 const record={periodEnd:'2026-09',checkedAt:'2026-10-03',points:[['2026-09',100]],anniversaryPoints:[['2026-09',120]]}
 for(const p of ['automated-monthly','automated-etf-monthly','non-bond-monthly-records','ranking-histories'])save(`src/data/${p}.json`,{A:structuredClone(record)})
 for(const p of ['bitcoin-yahoo-monthly','worldbank-gold-monthly'])save(`src/data/${p}.json`,structuredClone(record))
 for(const p of ['monthly-automated','non-bond-monthly-active'])save(`scripts/source-snapshots/${p}.json`,{A:{proofRows:[{date:'2026-09-30',value:100,close:120,monthlyClose:120}]}})
 save('scripts/source-snapshots/ranking-histories.json',{A:{rows:[{date:'2026-09-30',value:100,close:120}]}})
 const fx={checkedAt:'2026-10-03',months:{'2026-09':{asOf:'2026-09-30',rates:{EUR:1,USD:1.1}}}}
 save('src/data/monthly-fx.json',fx)
 const result=simulate(repo,'2026-10',false)
 assert.equal(result.added,6);assert.equal(Object.keys(result.coverage).length,6)
 assert.deepEqual(JSON.parse(readFileSync(join(repo,'src/data/monthly-fx.json'))),fx,'ECB outage retains original observations')
 assert.equal(JSON.parse(readFileSync(join(repo,'src/data/automated-etf-monthly.json'))).A.anniversaryPoints.at(-1)[1],120.6,'Raw and adjusted prices stay distinct')
 assert.equal(JSON.parse(readFileSync(join(repo,'.refresh-rehearsal.json'))).synthetic,true)
} finally {rmSync(repo,{recursive:true,force:true})}
