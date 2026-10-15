import assert from 'node:assert/strict'
import {PROFILES} from '../src/pages/dca-profiles/data.js'
import {prepareProfile,analyzeProfile,validateProfile,publicationReady,observation,references} from '../src/pages/dca-profiles/engine.js'
import {buildTweetText} from '../src/pages/dca-profiles/lib.js'
for(const [i,p] of PROFILES.entries()){
 const prepared=prepareProfile(p,i), a=analyzeProfile(prepared)
 assert.deepEqual(a.errors,[],p.id)
 assert.equal(a.monthly,p.monthly)
 assert.equal(prepared.lines.reduce((s,l)=>s+l.weight,0),100)
 assert(buildTweetText(prepared).includes('💼'))
 assert(!/NaN|undefined|profil fictif/.test(buildTweetText(prepared)))
 for(const field of ['countries','sectors'])assert(a[field].coverage>=0&&a[field].coverage<=100.001)
}
const p={...prepareProfile(PROFILES[0]),lines:[{asset:'world',label:'World',weight:80,amount:50,isin:references.world.isin},{asset:'sp500',label:'S&P 500',weight:20,amount:50,isin:references.sp500.isin}]}
assert.equal(analyzeProfile(p).changes[0].share,50)
assert.equal(analyzeProfile(p).changes[0].delta,-30)
assert.equal(analyzeProfile(p).countries.coverage,100)
const g=analyzeProfile(p).countries.groups.find(g=>g.rows.some(r=>r.name==='États-Unis'))
assert(g)
assert(g.rows.every(r=>r.weight<=g.coverage+0.01))
assert(validateProfile({...p,lines:p.lines.map(l=>({...l,weight:10}))}).length)
assert(validateProfile({...p,lines:[p.lines[0],p.lines[0]]}).length)
assert(validateProfile({...p,lines:[{...p.lines[0],weight:NaN}]}).length)
const noDca={...p,lines:p.lines.map(l=>({...l,amount:0}))}
assert.equal(analyzeProfile(noDca).monthly,0)
assert(observation(noDca).includes('Aucun versement'))
const newPosition={...p,lines:[{...p.lines[0],weight:100,amount:0},{...p.lines[1],weight:0,amount:100}]}
assert.deepEqual(validateProfile(newPosition),[])
assert.equal(analyzeProfile(newPosition).countries.coverage,100)
const unconfirmed={...p,lines:p.lines.map(l=>({...l,isin:''}))}
assert.equal(analyzeProfile(unconfirmed).countries.coverage,0)
assert(!publicationReady({...p,mode:'participant',approved:false}))
assert(publicationReady({...p,mode:'participant',approved:true}))
console.log('DCA moteur : 100 profils, pondérations, couverture, absences, zéro DCA, première position et validation vérifiés.')
