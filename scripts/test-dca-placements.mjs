import assert from 'node:assert/strict'
import { SAVINGS, newManualLine, validManualIdentity } from '../src/pages/dca-profiles/placements.js'
import { ASSETS, PROFILES } from '../src/pages/dca-profiles/data.js'
import { references, validateProfile, prepareProfile, MAX_EXPOSURE_POSITIONS } from '../src/pages/dca-profiles/engine.js'
import { searchAssets, writeSaved, readSaved, migrateProfile } from '../src/pages/dca-profiles/management.js'
import { importPortfolio, exportPortfolio } from '../src/pages/dca-profiles/portable-portfolios.js'
import { publishedExposure, exposureView, exposureDisplay } from '../src/pages/dca-profiles/exposure.js'
import { portfolioAnalytics, flowAllocation } from '../src/pages/dca-profiles/analytics.js'
import { buildTweetText } from '../src/pages/dca-profiles/lib.js'
import { allocationRows } from '../src/pages/dca-profiles/image.js'
const now=new Date('2026-11-14'),asOf='2026-11-13'
const observation={asOf,sourceUrl:'https://example.com/fixture',basis:'fund',compatibility:'fixture',rows:[{name:'France',weightPct:100}]}
const refs={...references,world:{...references.world,countries:observation,sectors:observation}}
const euro=newManualLine({label:'Fonds euros Mutavie',category:'Fonds en euros',weight:25,amount:100})
const second=newManualLine({label:'Fonds euros Mutavie',category:'Fonds en euros',weight:.01})
const unknown=newManualLine({label:'Actions privées — Élodie',category:'Actions',weight:0,amount:50})
const lines=[{asset:'world',label:'ETF Monde',isin:refs.world.isin,weight:49.99,amount:200},
 {asset:'livret-a',label:'Livret A',isin:'',weight:25,amount:0},euro,second,unknown]
const profile={...prepareProfile(PROFILES[0]),lines}
assert.notEqual(euro.asset,second.asset)
assert(validManualIdentity(euro));assert(!validManualIdentity({...euro,isin:refs.world.isin}))
assert.deepEqual(validateProfile(profile),[])
for(const id of Object.keys(SAVINGS)){
 assert(ASSETS[id]);assert(!references[id].isin)
 assert(searchAssets(SAVINGS[id].name).includes(id))
 const e=publishedExposure([{asset:id,label:SAVINGS[id].name,weight:100,isin:''}],refs,'countries',now)
 assert.equal(e.neutralWeight,100);assert.equal(exposureView(e).eligible,0)
}
assert(searchAssets('developpement durable').includes('ldds'))
assert(searchAssets('liquidites').includes('liquidites'))
for(const field of ['countries','sectors']){
 const e=publishedExposure(lines,refs,field,now),v=exposureView(e)
 assert.equal(e.coverage,49.99);assert.equal(e.neutralWeight,50.01)
 assert(Math.abs(v.rows[0].weight-100)<1e-9)
 const withUnknown=lines.map(l=>l.asset===unknown.asset?{...l,weight:10}:l.asset==='world'?{...l,weight:39.99}:l)
 const u=publishedExposure(withUnknown,refs,field,now),d=exposureDisplay(u),uv=exposureView(u)
 assert(Math.abs(d.missing-10)<1e-9);assert.equal(u.excluded[0].reason,'Composition inconnue (placement manuel)')
 assert(Math.abs(uv.rows[0].weight+uv.missing-100)<1e-9)
 // Even fabricated matching records may not grant a manual line a composition.
 const injected={...refs,[unknown.asset]:{countries:observation,sectors:observation,kind:'equity',isin:'',equitySleeve:{asOf,sourceUrl:observation.sourceUrl,weightPct:50}}}
 assert.equal(publishedExposure(withUnknown,injected,field,now).coverage,39.99)
}
const holdings={world:{...observation,complete:true,rows:[{isin:'US0378331005',name:'Apple',weightPct:100}]},[unknown.asset]:{...observation,complete:true,rows:[{isin:'US0378331005',name:'Apple',weightPct:100}]}}
const result=portfolioAnalytics(lines.map(l=>l.asset===unknown.asset?{...l,weight:10}:l),refs,holdings,now)
assert.equal(result.groups[0].coverage,49.99);assert.equal(result.pairs.length,0)
assert(result.unavailable.includes(unknown.label))
assert(Math.abs(allocationRows(lines).reduce((sum,l)=>sum+l.weight,0)-100)<1e-9)
assert.equal(flowAllocation(lines).find(l=>l.asset===unknown.asset).weight,50/350*100)
const text=buildTweetText(profile)
assert(text.includes('25 % Fonds euros Mutavie'));assert(text.includes('100 € sur Fonds euros Mutavie'))
assert(!text.includes('0 € sur Livret A'));assert(text.includes('25 % Livret A'))
assert(validateProfile({...profile,lines:lines.map(l=>l.asset===euro.asset?{...l,label:'  '}:l)}).length)
assert(validateProfile({...profile,lines:lines.map(l=>l.asset===euro.asset?{...l,category:'Inconnue'}:l)}).length)
assert(validateProfile({...profile,lines:lines.map(l=>l.asset===euro.asset?{...l,weight:24}:l)}).some(e=>e.includes('100')))
assert(validateProfile({...profile,lines:[...lines,euro]}).length)
for(const imageOnly of [true,false]){
 const p={...profile,imageOnly,approved:true,lines:imageOnly?lines.filter(l=>l.weight>0):lines}
 const record={id:'mixed',title:'Épargne et ETF',profile:p,draft:'Texte personnalisé — épargne',field:'all'}
 assert.deepEqual(importPortfolio(exportPortfolio(record)).profile,{...p,approved:false})
 let raw=null;const storage={getItem:()=>raw,setItem:(_,v)=>{raw=v}}
 writeSaved(storage,[record,{...record,id:'copy'}])
 assert.deepEqual(readSaved(storage).map(r=>r.profile.lines),[p.lines,p.lines])
 assert.deepEqual(migrateProfile(p).lines,p.lines)
}
const fifty=Array.from({length:50},(_,i)=>newManualLine({label:`Épargne ${i}`,category:'Liquidités',weight:2}))
const legacy={...profile,lines:fifty}
assert.deepEqual(validateProfile(legacy,MAX_EXPOSURE_POSITIONS),[])
assert(validateProfile(legacy).some(e=>e.includes('conservées')))
assert.deepEqual(importPortfolio(exportPortfolio({id:'50',title:'50',profile:legacy,field:'all',draft:''})).profile.lines,fifty)
console.log('Placements : recherche sans ISIN, identités stables, portefeuille mixte, inconnus/hors périmètre, flux indépendants, textes, transports et 50 lignes sans perte validés.')
