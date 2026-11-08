import assert from 'node:assert/strict'
import {partialPublishedCountries} from './partial-published-countries.mjs'
import record from './fixtures/avantis-partial-countries-20261108.json' with {type:'json'}
import {publishedExposure,exposureDisplay} from '../src/pages/dca-profiles/exposure.js'
import {donutData} from '../src/pages/dca-profiles/image.js'
const now=new Date('2026-11-08T12:00:00Z'),isin=record.isin
const q=partialPublishedCountries(isin,record,now)
assert(q);assert.equal(q.complete,false);assert.equal(q.coveragePct,89.28)
assert.equal(q.rows[0].weightPct,69.95);assert.equal(q.asOf,'2026-10-31')
const lines=[{asset:isin,isin,label:isin,weight:100}],references={[isin]:{isin,countries:q}}
const result=publishedExposure(lines,references,'countries',now),display=exposureDisplay(result)
assert(Math.abs(display.coverage-89.28)<1e-9);assert(Math.abs(display.missing-10.72)<1e-9)
const donut=donutData({countries:result},'countries')
assert(donut.rows.some(r=>r.name==='Non ventilé ici'&&Math.abs(r.weight-10.72)<1e-9))
assert(!q.rows.some(r=>r.name==='Unknown'),'The remainder is not invented as an issuer row')
assert.equal(publishedExposure(lines,references,'countries',new Date('2027-03-01')).groups.length,0)
for(const patch of [{status:'unqualified'},{asOf:'2027-01-01'},{sha256:''},{evidence:{...record.fieldQualification.countries.evidence,coveragePct:100}}]){
 assert.equal(partialPublishedCountries(isin,{...record,fieldQualification:{countries:{...record.fieldQualification.countries,...patch}}},now),null)
}
assert.equal(partialPublishedCountries('IE0000000000',record,now),null)
assert(!('holdings'in q)&&!('sectors'in q),'A partial geographic table cannot qualify holdings or sectors')
console.log('Avantis: five original country weights, 89.28% covered, 10.72% grey remainder, expiry and exact share checked; full coverage stays unavailable.')
