import assert from 'node:assert/strict'
import {groupPeaStatus,refreshPeaStatusNotes} from '../src/data/pea-group-status.js'
for(const values of [[],[null],[false,null]])assert.equal(groupPeaStatus(values),undefined,'Unknown never becomes non-eligible')
assert.equal(groupPeaStatus([false,false]),false)
assert.equal(groupPeaStatus([false,true,null]),true,'A documented eligible option may coexist with other shares')
const source={choiceNote:'Statut PEA non documenté. Rendements de l’indice distincts du fonds.',funds:[{isin:'one'}]}
const negative=refreshPeaStatusNotes(source,()=>false)
assert.equal(negative.pea,false);assert.match(negative.choiceNote,/Part citée non éligible au PEA/);assert.match(negative.choiceNote,/Rendements de l’indice distincts du fonds/)
const unknown=refreshPeaStatusNotes(source,()=>null)
assert.equal(unknown.pea,undefined);assert.equal(unknown.choiceNote,source.choiceNote)
const mixed=refreshPeaStatusNotes({...source,funds:[{isin:'one'},{isin:'two'}]},isin=>isin==='one'?false:null)
assert.equal(mixed.pea,undefined)
assert.equal(source.pea,undefined,'The historical input is immutable')
for(const value of [true,false,null]) {
 const refreshed=refreshPeaStatusNotes({funds:[{isin:'one',note:'(PEA non confirmé ; TER le plus bas)'}]},()=>value)
 assert.equal(refreshed.funds[0].pea,value)
 assert.match(refreshed.funds[0].note,/TER le plus bas/)
 assert.equal(/non confirmé/.test(refreshed.funds[0].note),false)
 assert.equal(/non documenté/.test(refreshed.funds[0].note),value===null)
}
console.log('Publication metadata notes: fresh PEA evidence, unknowns, mixed groups and unchanged index/fund scope verified.')
