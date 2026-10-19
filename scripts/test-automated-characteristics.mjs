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

