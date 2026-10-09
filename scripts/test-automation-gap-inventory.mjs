import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildGapInventory, classifyInstrumentGap, recent, calendarEligibility } from './automation-gap-inventory.mjs';
const r=buildGapInventory();
assert.equal(classifyInstrumentGap('new-instrument','performance').status,'unqualified');
assert.equal(classifyInstrumentGap('IE00BM8R0J59','performance').status,'source-conflict');
assert.equal(classifyInstrumentGap('IE000QDFFK00','countries').status,'unqualified');
assert.equal(classifyInstrumentGap('IE00B4ND3602','sectors').status,'not-applicable');
assert.equal(classifyInstrumentGap('IE00B4ND3602','ter').status,'unqualified');
assert.equal(classifyInstrumentGap('IE00B4ND3602','aum').status,'unqualified');
assert.equal(classifyInstrumentGap('FR0014017NX3','performance','2026-10-09').status,'waiting-first-year');
for(const [field,count]of Object.entries(r.covered))assert.equal(count+r.gaps.filter(g=>g.type==='instrument'&&g.field===field).length,r.instruments);
const data=JSON.parse(readFileSync('src/data/automated-etf.json'));
data['IE00BM8R0J59'].performance={years:{2024:22}};
assert(!buildGapInventory({etf:data}).gaps.some(g=>g.id==='IE00BM8R0J59'&&g.field==='performance'));
const indices=JSON.parse(readFileSync('src/data/automated-indices.json'));
for(const id of ['sp-global-dividend-aristocrats','sp-euro-dividend-aristocrats']) {
  assert.equal(indices[id].facts.holdings.length,10);
  assert(!r.gaps.some(g=>g.id===id&&g.field==='holdings'));
  indices[id].facts.holdings=[];
}
const missing=buildGapInventory({indices});
assert(missing.gaps.some(g=>g.id==='sp-global-dividend-aristocrats'&&g.field==='holdings'&&g.status==='access-blocked'));
assert(missing.gaps.some(g=>g.id==='sp-euro-dividend-aristocrats'&&g.field==='holdings'&&g.status==='access-blocked'));
console.log('Missing-field inventory: unknown products, exact-share conflicts, non-applicable fields and newly qualified calendars checked.');

assert.equal(r.recentCalendars.length,11);
assert(r.recentCalendars.every(s=>s.configured));
for(const id of recent) {
  const pending=buildGapInventory({etf:{},now:'2028-02-01'});
  assert.equal(pending.recentCalendars.find(s=>s.id===id).status,'waiting-publication');
  const active=buildGapInventory({etf:{[id]:{performance:{years:{2027:6.61},sourceUrl:'https://issuer.test/exact-share'}}},now:'2028-02-01'});
  assert.equal(active.recentCalendars.find(s=>s.id===id).firstYear,2027);
  assert.equal(active.recentCalendars.find(s=>s.id===id).status,'integrated');
  assert(!active.gaps.some(g=>g.id===id&&g.field==='performance'));
}

// Crossing a year boundary changes availability without claiming successful collection.
for (const id of recent) {
  const eligibility=calendarEligibility(id,'2026-10-09');
  assert.equal(eligibility.status,'waiting-first-year');
  assert(eligibility.launchSourceUrl.startsWith('https://'));
  assert.equal(calendarEligibility(id,eligibility.earliestPublicationDate).status,'waiting-publication');
  assert.equal(buildGapInventory({etf:{},now:eligibility.earliestPublicationDate}).recentCalendars.find(s=>s.id===id).firstYear,null);
}
assert.equal([...recent].filter(id=>calendarEligibility(id,'2026-10-09').earliestPublicationDate==='2027-01-01').length,8);
assert.equal([...recent].filter(id=>calendarEligibility(id,'2026-10-09').earliestPublicationDate==='2028-01-01').length,3);
assert.deepEqual(calendarEligibility('unknown','2026-10-09'),{});
assert(!r.insuranceGaps.some(g=>g.id==='lucya-cardif'&&g.field==='maxAllocation'));
const missingAllocation=[{id:'test-missing',name:'Test',checkedAt:'2026-10-09',euroFunds:[{name:'Fonds',maxAllocation:null,ceiling:1000000,allocationEvidence:{status:'not-published',reason:'Maximum absent de la source'}}]}];
assert.deepEqual(buildGapInventory({insurance:missingAllocation}).insuranceGaps.map(({field,status})=>({field,status})),[{field:'maxAllocation',status:'not-published'}]);
assert(r.insuranceGaps.some(g=>g.id==='placement-direct-vie'&&g.field==='ceiling'));
assert(!r.insuranceGaps.some(g=>g.id==='linxea-spirit-2'));
const completeInsurance=[{id:'test',name:'Test',checkedAt:'2026-10-09',euroFunds:[{name:'Fonds',maxAllocation:100,ceiling:1000000}]}];
assert.deepEqual(buildGapInventory({insurance:completeInsurance}).insuranceGaps,[]);
