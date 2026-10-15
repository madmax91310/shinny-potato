import assert from 'node:assert/strict'
import {dcaExposure} from '../src/pages/dca-profiles/exposure.js'
import {donutData,integerPercentages} from '../src/pages/dca-profiles/image.js'
import {PROFILES} from '../src/pages/dca-profiles/data.js'
import {prepareProfile,analyzeProfile,references} from '../src/pages/dca-profiles/engine.js'
import {filterProfiles,searchAssets,readSaved,writeSaved,SAVED_KEY} from '../src/pages/dca-profiles/management.js'
const now=new Date('2026-10-15T12:00:00Z')
const record=(asOf,compatibility='country-risk',rows=[{name:'United States',weightPct:100}])=>({countries:{asOf,compatibility,rows,basis:'fund',sourceUrl:'https://example.com/data'}})
const lines=[{asset:'world',isin:'one',weight:60,label:'World'},{asset:'acwi',isin:'two',weight:30,label:'ACWI'},{asset:'gold',weight:10,label:'Or'}]
let result=dcaExposure(lines,{world:record('2026-10-13'),acwi:record('2026-09-30')},'countries',now)
assert.equal(result.groups.length,1);assert.equal(result.groups[0].coverage,90);assert.equal(result.neutralWeight,10)
assert.equal(result.groups[0].oldest,'2026-09-30');assert.equal(result.groups[0].observations.length,2)
const donut=donutData({countries:result});assert(donut.rows.some(r=>r.name==='Or'&&r.weight===10));assert(!donut.rows.some(r=>r.color==='#57718e'))
result=dcaExposure(lines,{world:record('2026-10-13'),acwi:record('2026-09-30','country-registration')},'countries',now)
assert.equal(result.groups.length,2);assert.equal(donutData({countries:result}).rows.find(r=>r.name==='Non ventilé ici').weight,30)
for(const date of ['2026-06-01','2026-10-16','2026-02-31']){
 result=dcaExposure(lines,{world:record(date),acwi:record('2026-09-30')},'countries',now)
 assert.equal(result.excluded[0].asset,'world')
}
result=dcaExposure(lines,{world:record('2026-10-13'),acwi:record('2026-08-01')},'countries',now)
assert.equal(result.groups.length,2,'Do not chain incompatible observation dates')
result=dcaExposure(lines,{world:record('2026-10-13','country-risk',[{name:'US',weightPct:50}]),acwi:record('2026-10-13')},'countries',now)
assert.equal(result.coverage,60,'Incomplete tables never inflate coverage')
assert.notEqual(references.reit.sectors.compatibility,references.water.sectors.compatibility,'Undocumented taxonomies stay separate even for the same provider')
assert.equal(references.nasdaq.isin,'IE00B53SZB19');assert.match(references.nasdaq.name,/Nasdaq/i)
assert.equal(Object.values(references).filter(r=>r.kind==='equity').length,37)
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
assert.deepEqual(searchAssets('Nasdaq'),['nasdaq'])
assert.deepEqual(searchAssets('IE00B53SZB19'),['nasdaq'])
assert(!searchAssets('IE00B53L3W79').includes('nasdaq'))
