import assert from 'node:assert/strict'
import {dcaExposure} from '../src/pages/dca-profiles/exposure.js'
import {donutData,integerPercentages} from '../src/pages/dca-profiles/image.js'
import {PROFILES} from '../src/pages/dca-profiles/data.js'
import {prepareProfile,analyzeProfile,references} from '../src/pages/dca-profiles/engine.js'
import {validSaved, filterProfiles,searchAssets,readSaved,writeSaved,SAVED_KEY} from '../src/pages/dca-profiles/management.js'
import {selectDcaCountryObservation} from './select-dca-country-observation.mjs'
const published={asOf:'2026-10-16',method:'Published geography'}
const source={provider:'iShares',countriesRisk:{asOf:'2026-10-15',sourceUrl:'https://www.ishares.com/data',method:'Country of risk, all published holdings including cash/derivatives, no renormalisation',rows:[{name:'United States',weightPct:100}]}}
const selectionDate=new Date('2026-10-18T12:00:00Z')
const selected=selectDcaCountryObservation(published,source,selectionDate)
assert.equal(selected.classificationMetadata.id,'ishares-risk-net')
assert.equal(selected.asOf,'2026-10-15','A newer, different geography contract must not discard current risk-country data')
assert.deepEqual(selected.rows,source.countriesRisk.rows)
for(const change of [{asOf:'2020-01-01'},{asOf:'2026-10-19'},{asOf:'2026-02-31'},{method:'Unqualified geography'},{rows:[{name:'US',weightPct:90}]},{rows:[{name:'US',weightPct:101},{name:'Cash',weightPct:-1}]}]){
 assert.equal(selectDcaCountryObservation(published,{...source,countriesRisk:{...source.countriesRisk,...change}},selectionDate),published,'Invalid, stale, incomplete or incompatible observations retain the published fallback')
}
const now=new Date('2026-10-15T12:00:00Z')
const record=(asOf,compatibility='country-risk',rows=[{name:'United States',weightPct:100}])=>({countries:{asOf,compatibility,rows,basis:'fund',sourceUrl:'https://example.com/data'}})
const lines=[{asset:'world',isin:'one',weight:60,label:'World'},{asset:'acwi',isin:'two',weight:30,label:'ACWI'},{asset:'gold',weight:10,label:'Or'}]
let result=dcaExposure(lines,{world:record('2026-10-13'),acwi:record('2026-09-30')},'countries',now)
assert.equal(result.groups.length,1);assert.equal(result.groups[0].coverage,90);assert.equal(result.neutralWeight,10)
assert.equal(result.groups[0].oldest,'2026-09-30');assert.equal(result.groups[0].observations.length,2)
const donut=donutData({countries:result});assert(!donut.rows.some(r=>r.name==='Or'));assert.equal(donut.eligible,90);assert(!donut.rows.some(r=>r.color==='#57718e'))
result=dcaExposure(lines,{world:record('2026-10-13'),acwi:record('2026-09-30','country-registration')},'countries',now)
assert.equal(result.groups.length,2);assert(Math.abs(donutData({countries:result}).rows.find(r=>r.name==='Non ventilé ici').weight-100/3)<1e-8)
for(const date of ['2026-06-01','2026-10-16','2026-02-31']){
 result=dcaExposure(lines,{world:record(date),acwi:record('2026-09-30')},'countries',now)
 assert.equal(result.excluded[0].asset,'world')
}
result=dcaExposure(lines,{world:record('2026-10-13'),acwi:record('2026-08-01')},'countries',now)
assert.equal(result.groups.length,2,'Do not chain incompatible observation dates')
result=dcaExposure(lines,{world:record('2026-10-13','country-risk',[{name:'US',weightPct:50}]),acwi:record('2026-10-13')},'countries',now)
assert.equal(result.coverage,60,'Incomplete tables never inflate coverage')
assert.notEqual(references.reit.sectors.compatibility,references.water.sectors.compatibility,'Undocumented taxonomies stay separate even for the same provider')
assert.equal(references.world.countries.compatibility,'ishares-risk-net:fund')
assert.equal(references.world.sectors.compatibility,'ishares-published-sectors:fund')
assert.match(references.airliquide.countries.method,/Country of risk/)
assert.equal(references.nasdaq.isin,'IE00B53SZB19');assert.match(references.nasdaq.name,/Nasdaq/i)
assert(Object.values(references).filter(r=>r.kind==='equity').length>=220)
assert.equal(references.airliquide.countries.rows[0].name,'France')
assert.equal(references.airliquide.sectors.rows[0].name,'Materials')
for(const raw of PROFILES){
 const p=prepareProfile(raw),a=analyzeProfile(p)
 for(const field of ['countries','sectors']){
  const {rows}=donutData(a,field)
  assert(Math.abs(rows.reduce((s,r)=>s+r.weight,0)-100)<1e-6)
  assert(rows.length<=6)
  assert.equal(integerPercentages(rows).reduce((s,n)=>s+n,0),100)
 }
}
const prepared=PROFILES.map(prepareProfile)
assert(filterProfiles(prepared,{budget:'small'}).every(p=>p.monthly<=200))
assert(filterProfiles(prepared,{kind:'equity'}).every(p=>p.lines.some(l=>references[l.asset]?.kind==='equity')))
assert.equal(filterProfiles(prepared,{unused:true},prepared.map(p=>p.id)).length,0)
assert(filterProfiles(prepared,{lines:'2'}).every(p=>p.lines.length===2))
assert(searchAssets('FR0000120073').includes('airliquide'));assert(searchAssets('liquide').includes('airliquide'))
assert.equal(searchAssets('ZZZZZnotfound').length,0)
const map=new Map(),storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}
const one={id:'one',title:'Premier',profile:prepared[0],draft:'Texte personnalisé conservé',field:'sectors'}
const two={...one,id:'two',title:'Second',field:'countries'}
writeSaved(storage,[one,two]);assert.deepEqual(readSaved(storage),[one,two])
writeSaved(storage,[{...one,title:'Renommé'},two]);assert.equal(readSaved(storage)[1].title,'Second')
writeSaved(storage,[two]);assert.equal(readSaved(storage).length,1)
storage.setItem(SAVED_KEY,'broken');assert.throws(()=>readSaved(storage))
assert.throws(()=>writeSaved(storage,Array.from({length:51},(_,i)=>({...one,id:String(i)}))))
console.log('DCA upgrade: recency, compatibility, stocks, neutral assets, both donuts, filters and multiple saves verified.')

const anonymous={...prepared[0],name:'',imageOnly:true}
assert.deepEqual(analyzeProfile(anonymous).errors,[])
assert(analyzeProfile({...anonymous,imageOnly:false}).errors.length)
assert(searchAssets('Nasdaq').includes('nasdaq'))
assert(searchAssets('Nasdaq').includes('FR0011871110'))
assert.deepEqual(searchAssets('IE00B53SZB19'),['nasdaq'])
assert(!searchAssets('IE00B53L3W79').includes('nasdaq'))

const percentagesOnly={...anonymous,lines:anonymous.lines.map(({amount:_amount,...line})=>line)}
assert.deepEqual(analyzeProfile(percentagesOnly).errors,[])
assert.equal(analyzeProfile(percentagesOnly).monthly,0)
const {buildTweetText}=await import('../src/pages/dca-profiles/lib.js')
const percentageTweet=buildTweetText(percentagesOnly)
assert(percentageTweet.startsWith('📊 Voilà la répartition de ce portefeuille'))
assert(!/DCA|€|Salaire|Julien|versement/.test(percentageTweet))
assert(validSaved({...one,profile:percentagesOnly,field:'all'}))

// User regression: 34% World + 33% Nasdaq + 33% S&P 500 must include all three.
const trio=percentagesOnly.lines.slice(0,0).concat([['world',34],['nasdaq',33],['sp500',33]].map(([asset,weight])=>({asset,label:asset,weight,isin:references[asset].isin})))
const geography=dcaExposure(trio,references,'countries',new Date())
assert.equal(geography.groups.length,1)
assert.equal(geography.groups[0].observations.length,3)
assert(geography.groups[0].coverage>99.5)
const manualUs=trio.reduce((sum,l)=>{
 const source=references[l.asset].countries.rows
 const total=source.reduce((s,r)=>s+r.weightPct,0)
 return sum+l.weight*source.find(r=>r.name==='United States').weightPct/Math.max(100,total)
},0)
assert(Math.abs(geography.groups[0].rows.find(r=>r.name==='États-Unis').weight-manualUs)<1e-8)
const {exposureDisplay}=await import('../src/pages/dca-profiles/exposure.js')
const incompatible=dcaExposure(lines,{world:record('2026-10-13'),acwi:record('2026-09-30','country-registration')},'countries',now)
assert.equal(exposureDisplay(incompatible).coverage,60)
assert.equal(exposureDisplay(incompatible).omitted[0].asset,'acwi')
assert.equal(exposureDisplay(incompatible).missing,30)
const {exposurePercentage}=await import('../src/pages/dca-profiles/image.js')
assert.equal(exposurePercentage(.35,1),'< 1 %')
assert.equal(exposurePercentage(.2,0),'< 1 %')
console.log('34/33/33: all three positions included, weighted countries and partial-coverage warning verified.')
