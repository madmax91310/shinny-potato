import assert from 'node:assert/strict';
import {applyAutomatedCharacteristics} from '../src/data/automated-characteristics.js';
const previous={domicile:'Ireland',replicationMethod:'Physical (Full replication)',location:'Irlande, réplication physique intégrale, couverture en euros',currencyHedge:'EUR'};
const record=method=>({sourceUrl:'https://issuer.test',characteristics:{replicationMethod:method,checkedAt:'2026-10-16'}});
for(const raw of ['Direct(Physical)','Direct Replication (physically)','Physical']) {
 const next=applyAutomatedCharacteristics(previous,record(raw));
 assert.equal(next.replicationMethod,raw);
 assert.doesNotMatch(next.location,/intégrale/,'A generic new physical method cannot retain an older full-replication claim');
 assert.match(next.location,/physique/);
 assert.match(next.location,/couverture en euros/);
 assert.equal(next.currencyHedge,'EUR');
 assert.equal(next.automatedFields.replicationMethod.url,'https://issuer.test');
}
const swap=applyAutomatedCharacteristics(previous,record('Indirect(Swap Based)'));
assert.match(swap.location,/synthétique par swap/);assert.doesNotMatch(swap.location,/physique/);
const full=applyAutomatedCharacteristics(previous,record('Replicated'));
assert.equal(full.replicationMethod,'Physical (Full replication)');assert.match(full.location,/intégrale/);
assert.deepEqual(applyAutomatedCharacteristics(previous,{}),previous);
assert.equal(previous.location,'Irlande, réplication physique intégrale, couverture en euros');
for(const [raw,incomePolicy] of [['Capitalizing','accumulating'],['Capitalisation and/or distribution','capitalisation-and-or-distribution'],['distribution','distributing']]) {
 const next=applyAutomatedCharacteristics(previous,{sourceUrl:'https://issuer.test',characteristics:{distribution:raw,currencyHedge:false,checkedAt:'2026-10-19'}});
 assert.equal(next.incomePolicy,incomePolicy);
 assert.equal(next.currencyHedge,false);assert.match(next.location,/sans couverture de change/);assert.doesNotMatch(next.location,/couverture en euros/);
}
const newlyHedged=applyAutomatedCharacteristics({...previous,location:'Irlande, sans couverture de change'},{sourceUrl:'https://issuer.test',characteristics:{currencyHedge:true,checkedAt:'2026-10-19'}});
assert.match(newlyHedged.location,/couverture de change/);assert.doesNotMatch(newlyHedged.location,/sans|euros/);
console.log('Collected replication wording, generic/full distinction, hedge annotations and immutable source facts verified.');


// A previously listing-only owner ignored an explicit usable hedging source.
import {restrictedMetadataRoute} from './lib/metadata-field-routing.mjs';
const exact='IE00BZ048462',primary='https://issuer.test/key-facts?isin='+exact,profile='https://www.justetf.com/fr/etf-profile.html?isin='+exact;
assert.deepEqual(restrictedMetadataRoute(exact,primary,['listings'],{urls:[profile]}),{fields:['listings'],urls:[primary]},'An undeclared supplemental URL cannot certify every metadata field');
const supplied={fields:['currencyHedge'],urls:[profile]},copy=structuredClone(supplied);
assert.deepEqual(restrictedMetadataRoute(exact,primary,['listings'],supplied),{fields:['listings','currencyHedge'],urls:[primary,profile]});
assert.deepEqual(supplied,copy);assert(!restrictedMetadataRoute(exact,primary,['listings'],supplied).fields.includes('pea'));
assert.deepEqual(restrictedMetadataRoute(exact,primary,['listings','currencyHedge'],{fields:['currencyHedge'],urls:[profile,profile]}).fields,['listings','currencyHedge']);
assert.throws(()=>restrictedMetadataRoute(exact,primary,['listings'],{fields:['aum'],urls:[profile]}),/Unsupported/);
assert.throws(()=>restrictedMetadataRoute(exact,primary,['listings'],{fields:['currencyHedge'],urls:[]}),/no source/);
assert.throws(()=>restrictedMetadataRoute(exact,primary,['listings'],{fields:['currencyHedge'],urls:[profile.replace(exact,'IE00B4L5Y983')]}),/another share/);
console.log('Restricted metadata: explicit supplemental field only, unchanged legacy URL ownership, no PEA inference, exact-share URL and source invariants verified.');
