import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {gunzipSync} from 'node:zlib'
import {createHash} from 'node:crypto'
import {qualifyHoldings} from '../src/pages/dca-profiles/holdings-qualification.js'
import {projectDcaHoldings} from './lib/dca-holdings-projection.mjs'
import {portfolioAnalytics} from '../src/pages/dca-profiles/analytics.js'
import {holdingsConsumerQualifications,applyHoldingsConsumerQualification} from './lib/holdings-consumer-qualification.mjs'
const fixture=name=>JSON.parse(readFileSync(new URL(`./fixtures/wisdomtree-ranking-basis-20261110/${name}.json`,import.meta.url)))
const ranked=fixture('rankings-retained'),native=fixture('native-qualified'),isin='IE000W8WMSL2',reference={isin,synthetic:false},now=new Date('2026-11-10T23:00:00Z')
const raw=gunzipSync(readFileSync(new URL('./fixtures/wisdomtree-ranking-basis-20261110/issuer-api.json.gz',import.meta.url)))
assert.equal(createHash('sha256').update(raw).digest('hex'),native.sha256)
const source=JSON.parse(raw),byFigi=new Map(source.filter(r=>r.figi).map(r=>[r.figi,r]))
assert(source.every(r=>r.wtClassID===58690128&&r.fundTicker==='WQTM LN'&&r.dt.startsWith(native.asOf)))
assert.equal(byFigi.size,47)
for(const row of native.rows)assert.equal(row.weightPct,byFigi.get(row.figi).wgt*100,'Each original native weight is bound to the exact raw FIGI')
assert.equal(ranked.asOf,native.asOf)
assert.deepEqual(new Set(ranked.rows.map(r=>r.isin)),new Set(native.rows.map(r=>r.isin)))
const total=h=>h.rows.reduce((s,r)=>s+r.weightPct,0)
assert(Math.abs(total(ranked)-99.9998)<1e-10)
assert(Math.abs(total(native)-99.7068663385412)<1e-10)
assert(Math.abs(native.navReconciliation.excludedWeightPctByType.Cash-.2931336614588322)<1e-10)
assert(total(ranked)-total(native)>.29,'Same dated books are financially different; no assumption about the unexplained cause')
for(const h of [ranked,projectDcaHoldings(ranked,false),{...ranked,method:'reworded source method'}]){
 const q=qualifyHoldings(h,{isin},reference,now)
 assert(!q.valid&&!q.complete)
 assert(q.reasons.some(r=>r.includes('dénominateur NAV')))
 assert.deepEqual(h.rows.map(r=>[r.isin,r.weightPct]),ranked.rows.map(r=>[r.isin,r.weightPct]),'No source weight rewritten')
}
assert(qualifyHoldings(native,{isin},reference,now).complete,'Distinct proved original NAV/cash book remains admissible; not a GitHub supplier execution proof')
const projected=projectDcaHoldings(ranked,false)
const qa=holdingsConsumerQualifications({references:{q:reference},holdings:{q:projected},sourceRecords:{[isin]:ranked},now})[isin]
assert.equal(qa.outcomes[0].status,'evaluated');assert.equal(qa.outcomes[0].complete,false)
assert.equal(applyHoldingsConsumerQualification({field:'completeHoldings',actionState:'current'},qa).actionState,'unqualified','The existing supervision reducer exposes this consumer failure')
const lines=[{asset:'q',isin,weight:50,label:'Quantum'},{asset:'n',isin,weight:50,label:'Native'}]
const result=portfolioAnalytics(lines,{q:reference,n:reference},{q:projected,n:native},now)
assert(!result.pairs.some(p=>p.overlap!=null),'An unqualified ranking cannot produce either full or partial financial overlap')
const bad={...ranked,navReconciliation:native.navReconciliation}
assert(!qualifyHoldings(bad,{isin},reference,now).complete,'Pasting a different book’s accounting does not prove the ranking denominator')
console.log('WisdomTree: same-date financial mismatch reproduced, retained/reread ranking refused without weight edits, proved native book preserved, existing supervision incident produced.')
