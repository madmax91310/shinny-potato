import {AUTOMATED_ETF} from '../src/data/automated-etf.js';
import assert from 'node:assert/strict';
import {fieldState,buildAssetFieldReport} from './report-asset-fields.mjs';
import {applyAutomatedCharacteristics,replicationContradictsLocation} from '../src/data/automated-characteristics.js';
for (const location of ['France, réplication physique intégrale','France, réplication physique avec échantillonnage possible']) {
 for (const method of ['Direct(Physical)','Direct Replication (physically)']) assert.equal(replicationContradictsLocation(location,method),false);
 assert.equal(replicationContradictsLocation(location,'Synthetic (swap)'),true);
}
assert.equal(replicationContradictsLocation('réplication physique intégrale','Physical (Sampling)'),true);
assert.equal(replicationContradictsLocation('réplication physique optimisée','Physical (Full replication)'),true);
assert.equal(replicationContradictsLocation('réplication synthétique (swap)','Direct(Physical)'),true);
assert.equal(replicationContradictsLocation("adossé à de l'or physique (pas de réplication synthétique)",'Physical Replication'),false);
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
const r=buildAssetFieldReport('2026-10-16');assert(r.rows.length>2000);assert.equal(r.summary.ter.total,Object.keys(AUTOMATED_ETF).length);
assert(r.rows.some(x=>x.type==='equity'&&x.field==='monthly'));
assert(r.rows.some(x=>x.id==='IE00BM8R0J59'&&x.field==='holdings'&&typeof x.state==='string'));
for(const s of Object.values(r.summary))assert.equal(Object.values(s.states).reduce((a,b)=>a+b,0),s.total);
console.log('Field freshness, missing fields, metadata provenance and all-asset coverage validated.');
