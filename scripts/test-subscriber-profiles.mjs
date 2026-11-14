import assert from 'node:assert/strict'
import {newSubscriberProfile,subscriberId,subscriberSignature,saveSubscriberProfile,removeSubscriberProfile,filterSubscriberProfiles} from '../src/pages/dca-profiles/subscriber-profiles.js'
import {SAVED_KEY,readSavedState,writeSaved} from '../src/pages/dca-profiles/management.js'
import {PROFILES} from '../src/pages/dca-profiles/data.js'
import {prepareProfile} from '../src/pages/dca-profiles/engine.js'
import {newManualLine} from '../src/pages/dca-profiles/placements.js'
import {exportPortfolio,importPortfolio} from '../src/pages/dca-profiles/portable-portfolios.js'
const memory=()=>{const map=new Map();return{map,getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)}}
const storage=memory(),blank=newSubscriberProfile(),other=newSubscriberProfile()
assert.notEqual(blank.id,other.id);assert.equal(blank.mode,'participant');assert.deepEqual(blank.lines,[]);assert.equal(blank.name,'')
const profile={...blank,name:'Élodie',job:'Médecin',lines:[{asset:'livret-a',label:'Livret A',weight:75,amount:0,isin:''},newManualLine({label:'Fonds euros Mutavie',category:'Fonds en euros',weight:25,amount:100})],approved:true}
const input={profile,draft:'Mon texte personnel — à conserver',field:'sectors'}
const item=saveSubscriberProfile(storage,input,null)
assert.equal(item.profile.id,profile.id);assert.equal(item.profile.approved,false);assert.equal(item.draft,input.draft)
const session={id:item.id,source:JSON.stringify(item),baseline:subscriberSignature(item)}
assert.equal(subscriberSignature(input),session.baseline,'Consent is not an editorial change')
const updated=saveSubscriberProfile(storage,{...input,profile:{...profile,name:'Élodie — édition 2'}},session)
assert.equal(updated.id,item.id);assert.equal(updated.profile.id,item.profile.id);assert.equal(readSavedState(storage).items.length,1)
assert.throws(()=>saveSubscriberProfile(storage,input,session),/autre onglet/)
assert.throws(()=>removeSubscriberProfile(storage,item),/autre onglet/)
const second=saveSubscriberProfile(storage,{...input,profile:{...profile,id:other.id}},null)
assert.notEqual(second.id,item.id);assert.notEqual(second.profile.id,item.profile.id)
assert.equal(filterSubscriberProfiles(readSavedState(storage).items,'elodie medecin').length,2)
assert.equal(filterSubscriberProfiles(readSavedState(storage).items,'inexistant').length,0)
const prepared={id:'prepared',title:'Scénario préparé',profile:prepareProfile(PROFILES[0]),draft:'',field:'all'}
const exposure={...prepared,id:'anonymous',title:'Allocation sans identité',profile:{...prepared.profile,imageOnly:true}}
const legacy={...prepared,id:'legacy',title:'Participation historique',profile:{...prepared.profile,mode:'participant'}}
writeSaved(storage,[...readSavedState(storage).items,prepared,exposure,legacy])
assert.equal(filterSubscriberProfiles(readSavedState(storage).items).length,3)
assert.equal(subscriberId(legacy),'subscriber:legacy');assert.notEqual(subscriberId(legacy),legacy.profile.id)
const migrated=saveSubscriberProfile(storage,{...legacy,profile:{...legacy.profile,id:subscriberId(legacy)}},{id:legacy.id,source:JSON.stringify(legacy)})
assert.equal(migrated.profile.id,'subscriber:legacy');assert.equal(migrated.id,legacy.id);assert.equal(migrated.title,legacy.title,'Keep an existing custom save title')
assert.deepEqual(importPortfolio(exportPortfolio(migrated)).profile,migrated.profile)
assert.throws(()=>saveSubscriberProfile(storage,prepared,null),/participation/)
removeSubscriberProfile(storage,second)
assert(readSavedState(storage).items.some(row=>row.id==='prepared'))
assert(readSavedState(storage).items.some(row=>row.id==='anonymous'))
assert.throws(()=>saveSubscriberProfile(storage,input,{id:second.id,source:JSON.stringify(second)}),/supprimé/)
const damaged=memory();damaged.setItem(SAVED_KEY,'not JSON')
assert.throws(()=>saveSubscriberProfile(damaged,input,null));assert.equal(damaged.getItem(SAVED_KEY),'not JSON')
const quota={getItem:storage.getItem,setItem:()=>{throw Error('quota')}}
const before=storage.getItem(SAVED_KEY)
assert.throws(()=>saveSubscriberProfile(quota,input,null),/quota/);assert.equal(storage.getItem(SAVED_KEY),before)
const full=memory()
writeSaved(full,Array.from({length:50},(_,i)=>({...prepared,id:`existing-${i}`})))
assert.throws(()=>saveSubscriberProfile(full,input,null),/50/);assert.equal(readSavedState(full).items.length,50)
assert.throws(()=>saveSubscriberProfile(storage,{...input,profile:{...profile,name:''}},null),/pseudonyme/)
assert.throws(()=>saveSubscriberProfile(storage,{...input,profile:{...profile,lines:[]}},null),/Corrige/)
console.log('Profils abonnés : identité propre, création sans scénario, mises à jour, recherche, héritage, fichiers, protection des conflits/corruptions/quotas et limite commune validés.')
