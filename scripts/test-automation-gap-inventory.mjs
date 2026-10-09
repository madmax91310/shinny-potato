import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildGapInventory, classifyInstrumentGap } from './automation-gap-inventory.mjs';
const r=buildGapInventory();
assert.equal(classifyInstrumentGap('new-instrument','performance').status,'unqualified');
assert.equal(classifyInstrumentGap('IE00BM8R0J59','performance').status,'source-conflict');
assert.equal(classifyInstrumentGap('IE000QDFFK00','countries').status,'unqualified');
assert.equal(classifyInstrumentGap('IE00B4ND3602','sectors').status,'not-applicable');
assert.equal(classifyInstrumentGap('IE00B4ND3602','ter').status,'unqualified');
assert.equal(classifyInstrumentGap('IE00B4ND3602','aum').status,'unqualified');
assert.equal(classifyInstrumentGap('FR0014017NX3','performance').status,'waiting-publication');
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
