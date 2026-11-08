import assert from 'node:assert/strict'
import facts from './fixtures/jpm-published-exposures-20261108.json' with {type:'json'}
import {qualifyExposureClassification} from '../src/lib/exposure-classification.js'
import {dcaExposure,publishedExposure} from '../src/pages/dca-profiles/exposure.js'
const isin='IE0003UVYC20',now=new Date('2026-11-08T12:00:00Z')
const refs={[isin]:{isin}}
for(const field of ['countries','sectors']){
 const o={...facts[field],provider:'J.P. Morgan'},q=qualifyExposureClassification(o,field)
 assert(q);assert(q.id.startsWith('jpm-'));assert(!/gics|ishares/i.test(q.id))
 assert.equal(qualifyExposureClassification({...o,sourceComponent:'fundData.wrongField'},field),null)
 assert.equal(qualifyExposureClassification({...o,sourceUrl:o.sourceUrl.replace(isin,'IE0000000000')},field),null)
 refs[isin][field]={...o,compatibility:q.id+':fund'}
 const r=publishedExposure([{asset:isin,isin,weight:100}],refs,field,now)
 assert.equal(r.groups[0].asOf,'2026-10-31')
 assert(Math.abs(r.groups[0].rows.find(r=>r.name==='Liquidités').weight-.8)<1e-12)
 assert(!('holdings'in refs[isin]),'Exposure allocation cannot grant holdings completeness')
 // A separately classified source must not be presented as the same taxonomy.
 const other='different';refs[other]={isin:other,[field]:{...refs[isin][field],compatibility:'other-taxonomy'}}
 const lines=[{asset:isin,isin,weight:70},{asset:other,isin:other,weight:30}]
 assert.equal(dcaExposure(lines,refs,field,now).groups.length,2)
 assert.deepEqual(publishedExposure(lines,refs,field,now),publishedExposure([...lines].reverse(),refs,field,now))
}
assert.equal(facts.countries.rows.find(r=>r.name==='United States').weightPct,67.6)
assert.equal(facts.sectors.rows.find(r=>r.name==='Banks').label,'Banques')
console.log('JEPG: dated issuer fund allocations, retained cash, proprietary taxonomy separation, exact source/field, no full-book inference and stable ordering passed.')
