import {AUTOMATED_ETF} from '../src/data/automated-etf.js';
import UNDERLIERS from '../src/data/vanguard-equity-underliers.json' with {type:'json'};
import assert from 'node:assert/strict';
import {scpiWaitingForPublication,fieldState,buildAssetFieldReport,completeHoldingsEvidence} from './report-asset-fields.mjs';
import {applyAutomatedCharacteristics} from '../src/data/automated-characteristics.js';
import {buildInbox} from '../src/pages/data-review/review-inbox.js';
assert.equal(fieldState({checkedAt:'2026-10-16',asOf:'2026-01-01'},'2026-10-16'),'publication-old');
assert.equal(fieldState({checkedAt:'2026-10-01',asOf:'2026-09-30'},'2026-10-16'),'check-overdue');
assert.equal(fieldState({checkedAt:'2026-10-17'},'2026-10-16'),'invalid-date');
assert.equal(fieldState({asOf:'2026-10-15'},'2026-10-16'),'undated-check');
const p={distribution:'Distribuant',incomePolicy:'distributing',domicile:'Ireland',currencyHedge:true};
assert.deepEqual(applyAutomatedCharacteristics(p,{}),p);
const n=applyAutomatedCharacteristics(p,{sourceUrl:'https://issuer.test',characteristics:{distribution:'Accumulating',checkedAt:'2026-10-16'}});
assert.equal(n.distribution,'Capitalisant');assert.equal(n.currencyHedge,true);assert.deepEqual(Object.keys(n.automatedFields),['distribution']);
for(const [raw,expected] of [['Optimised','Physical (Optimised sampling)'],['Physical (Optimised)','Physical (Optimised sampling)'],['Replicated','Physical (Full replication)'],['Physical (Replicated)','Physical (Full replication)'],['Synthetic (swap)','Synthetic (swap)']]){
 const facts=applyAutomatedCharacteristics(p,{sourceUrl:'https://issuer.test',characteristics:{replicationMethod:raw,checkedAt:'2026-10-16'}});
 assert.equal(facts.replicationMethod,expected);assert.equal(facts.currencyHedge,true);
}
const r=buildAssetFieldReport('2026-10-16');assert(r.rows.length>2000);
// The public reader requires a versioned report before accepting any rows.
// Exercise the real producer, not a versioned test-only response.
const published=JSON.parse(JSON.stringify(r));
assert.equal(published.schemaVersion,1,'Coverage must declare the version accepted by Données à revoir');
assert(published.rows.every(row=>typeof row.id==='string'));
assert.equal(buildInbox({coverage:published}).examinedFields,r.rows.length);
// Composition-only underliers remain inventoried; unused TER is non-applicable.
const monitored=new Set([...Object.keys(AUTOMATED_ETF),...Object.keys(UNDERLIERS)]);
assert.equal(r.summary.ter.total,monitored.size);
assert.equal(r.summary.ter.applicable,Object.keys(AUTOMATED_ETF).length);
assert.deepEqual(new Set(r.rows.filter(row=>row.type==='instrument'&&row.field==='ter').map(row=>row.id)),monitored);
assert(r.rows.some(x=>x.type==='equity'&&x.field==='monthly'));
assert(r.rows.some(x=>x.id==='IE00BM8R0J59'&&x.field==='holdings'&&typeof x.state==='string'));
for(const s of Object.values(r.summary))assert.equal(Object.values(s.states).reduce((a,b)=>a+b,0),s.total);
console.log('Field freshness, missing fields, metadata provenance and all-asset coverage validated.');

for(const isin of ['IE00BFMXYX26','IE00BK5BQZ41','IE00BKX55R35']) {
 const fields=r.rows.filter(row=>row.id===isin)
 assert(fields.filter(row=>!['countries','sectors','completeHoldings'].includes(row.field)).every(row=>row.state==='not-applicable'))
 for(const field of ['countries','sectors'])assert(fields.find(row=>row.field===field).present)
}

const unidentified=completeHoldingsEvidence({complete:true,asOf:'2026-10-21',rows:[{isin:'US0378331005',weightPct:99.9},{isin:null,weightPct:.1}]},{lastSuccessAt:'2026-10-22'})
assert.equal(unidentified.unidentifiedWeightPct,.1)
assert.equal(unidentified.unidentifiedSecurityCount,1)

const scpiWait={collectionStatus:{status:'waiting-publication',lastAccessSuccessAt:'2026-11-14',internalReviewDue:'2026-11-14',issuerPublicationDeadline:null,deadlineBasis:'internal-monitoring-policy'}}
assert(scpiWaitingForPublication(scpiWait,'2026-11-14'),'Internal review date includes its last day')
assert(!scpiWaitingForPublication(scpiWait,'2026-11-15'),'Expired internal monitoring does not mask old data')
assert(!scpiWaitingForPublication({...scpiWait,collectionStatus:{...scpiWait.collectionStatus,status:'failed'}},'2026-11-14'))
assert(!scpiWaitingForPublication(scpiWait,'2026-11-14','price'),'Snapshot waiting must not certify another field')
