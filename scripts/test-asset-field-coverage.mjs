import {AUTOMATED_ETF} from '../src/data/automated-etf.js';
import UNDERLIERS from '../src/data/vanguard-equity-underliers.json' with {type:'json'};
import assert from 'node:assert/strict';
import {fieldState,buildAssetFieldReport} from './report-asset-fields.mjs';
import {applyAutomatedCharacteristics} from '../src/data/automated-characteristics.js';
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
// Composition-only underlying funds are catalogued too; their unknown TER must
// remain visible, without pretending they belong to the automated ETF universe.
const monitored=new Set([...Object.keys(AUTOMATED_ETF),...Object.keys(UNDERLIERS)]);
assert.equal(r.summary.ter.total,monitored.size);
assert.deepEqual(new Set(r.rows.filter(row=>row.type==='instrument'&&row.field==='ter').map(row=>row.id)),monitored);
assert(r.rows.some(x=>x.type==='equity'&&x.field==='monthly'));
assert(r.rows.some(x=>x.id==='IE00BM8R0J59'&&x.field==='holdings'&&typeof x.state==='string'));
for(const s of Object.values(r.summary))assert.equal(Object.values(s.states).reduce((a,b)=>a+b,0),s.total);
console.log('Field freshness, missing fields, metadata provenance and all-asset coverage validated.');
