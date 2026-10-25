import assert from 'node:assert/strict'
import {ALL_PROFILES,PROFILES,CONTROVERSIAL_PROFILES} from '../src/pages/dca-profiles/data.js'
import {prepareProfile,validateProfile,references,analyzeProfile} from '../src/pages/dca-profiles/engine.js'
import {filterProfiles,profileSelection,readSaved,writeSaved,SAVED_KEY} from '../src/pages/dca-profiles/management.js'
import {buildTweetText,pickUnseenProfile} from '../src/pages/dca-profiles/lib.js'
assert.equal(PROFILES.length,100)
assert.equal(CONTROVERSIAL_PROFILES.length,50)
assert.equal(ALL_PROFILES.length,150)
assert.equal(new Set(ALL_PROFILES.map(p=>p.id)).size,150)
const prepared=ALL_PROFILES.map(prepareProfile)
assert.deepEqual(filterProfiles(prepared,{}).map(p=>p.id),PROFILES.map(p=>p.id))
assert.equal(CONTROVERSIAL_PROFILES.filter(p=>p.age>=19&&p.age<=30).length,40)
let differentFlows=0
const banned=/polémique|controversial|problématique|risqué|provocat|fictif|simulé|inventé|profil pédagogique|abonné.*envoy|concentr|recouvrement|diversification|ETF principal/i
for(const raw of CONTROVERSIAL_PROFILES){
 const p=prepareProfile(raw)
 assert.deepEqual(validateProfile(p),[],p.id)
 assert.equal(p.lines.reduce((s,l)=>s+l.weight,0),100,p.id)
 assert.equal(p.lines.reduce((s,l)=>s+l.amount,0),raw.monthly,p.id)
 assert(p.monthly>0&&p.monthly<=p.income,p.id)
 assert(p.lines.every(l=>Number.isInteger(l.amount)&&l.amount>0&&references[l.asset]?.isin===l.isin),p.id)
 assert(!p.lines.some(l=>/leveraged|daily.*2x|CFD|short/i.test(references[l.asset].name)),p.id)
 assert.equal(new Set(p.lines.map(l=>l.isin)).size,p.lines.length,p.id)
 assert(!p.family&&!p.location,p.id)
 if(p.lines.some(l=>Math.abs(l.weight-l.amount/p.monthly*100)>.01))differentFlows++
 const tweet=buildTweetText(p)
 assert(!banned.test(tweet),`${p.id}: public category or commentary`)
 assert(tweet.includes(p.job)&&tweet.includes(`${p.age} ans`)&&tweet.includes('💼 Son portefeuille'),p.id)
 assert(tweet.endsWith('Pas un conseil financier'))
 assert(tweet.includes('Que pensez-vous du DCA'))
 const analysis=analyzeProfile(p)
 assert.deepEqual(analysis.errors,[],p.id)
 for(const field of ['countries','sectors']){
  const neutral=p.lines.filter(l=>['btc','eth','gold','silver'].includes(l.asset)).reduce((s,l)=>s+l.weight,0)
  assert(analysis[field].neutralWeight>=neutral-1e-6,p.id)
 }
}
assert(differentFlows>=45)
assert(new Set(CONTROVERSIAL_PROFILES.map(p=>p.lines.map(l=>l.asset).sort().join('|'))).size>=48)
assert.equal(new Set(CONTROVERSIAL_PROFILES.map(p=>p.lines.map((l,i)=>`${l.asset}:${p.holdings[i]}:${l.amount}`).sort().join('|'))).size,50)
// Every combination of filters stays within its selected bank, including empty results.
for(const selection of ['classic','controversial'])for(const budget of ['','small','medium','large','high'])for(const lines of ['',2,3,4,5])for(const kind of ['','equity','crypto','metal','thematic'])for(const unused of [false,true]){
 const used=prepared.filter((_,i)=>i%2===0).map(p=>p.id)
 const filters={selection,budget,lines,kind,unused}
 const pool=filterProfiles(prepared,filters,used)
 assert(pool.every(p=>profileSelection(p)===selection))
 if(unused)assert(pool.every(p=>!used.includes(p.id)))
 const next=pickUnseenProfile(pool,'absent',new Set(),()=>0)
 assert(!next||pool.includes(next))
}
assert.deepEqual(filterProfiles(prepared,{selection:'controversial',unused:true},CONTROVERSIAL_PROFILES.map(p=>p.id)),[])
const storage={value:null,getItem(){return this.value},setItem(_k,v){this.value=v}}
const legacy=prepareProfile(PROFILES[0]);delete legacy.selection
storage.setItem(SAVED_KEY,JSON.stringify({version:2,items:[{id:'legacy',title:'Ancienne sauvegarde',profile:legacy,draft:'Texte conservé',field:'countries'}]}))
assert.equal(readSaved(storage)[0].profile.selection,'classic')
assert.equal(readSaved(storage)[0].draft,'Texte conservé')
const item={id:'new',title:'Nouvelle sauvegarde',profile:prepareProfile(CONTROVERSIAL_PROFILES[0]),draft:'Texte édité',field:'sectors'}
writeSaved(storage,[item]);assert.deepEqual(readSaved(storage),[item])
console.log('50 nouveaux profils : chiffres, supports, exports neutres, 500 combinaisons de filtres/tirages et anciennes sauvegardes validés.')
