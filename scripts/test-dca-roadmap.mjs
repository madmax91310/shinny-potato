import assert from 'node:assert/strict'
import { equalWeights, assignRemainder } from '../src/pages/dca-profiles/allocation-actions.js'
import { exportPortfolio, importPortfolio } from '../src/pages/dca-profiles/portable-portfolios.js'
import { PROFILES, ASSETS } from '../src/pages/dca-profiles/data.js'
import { prepareProfile, references } from '../src/pages/dca-profiles/engine.js'
import { qualifyHoldings } from '../src/pages/dca-profiles/holdings-qualification.js'
import { sharedPositions } from '../src/pages/dca-profiles/verification.js'
import { buildTweetText } from '../src/pages/dca-profiles/lib.js'

for (const n of [1,2,3,8,50]) {
  const original = Object.keys(ASSETS).slice(0,n).map((asset,i)=>({asset,isin:references[asset]?.isin,weight:NaN,amount:i+1,label:asset}))
  const snapshot = structuredClone(original), equal = equalWeights(original)
  assert.equal(Math.round(equal.reduce((s,l)=>s+l.weight,0)*100),10000)
  assert.deepEqual(equal.map(l=>l.amount),original.map(l=>l.amount))
  assert.deepEqual(original,snapshot,'Explicit action does not mutate the original draft')
  assert(Math.max(...equal.map(l=>l.weight))-Math.min(...equal.map(l=>l.weight))<.01000001)
}
const lines = [{asset:'world',weight:35.25,amount:200},{asset:'sp500',weight:NaN,amount:50},{asset:'nasdaq',weight:20.125,amount:80}]
assert.equal(assignRemainder(lines,1)[1].weight,44.625)
assert.deepEqual(assignRemainder(lines,1).map(l=>l.amount),[200,50,80])
assert.throws(()=>assignRemainder(lines,0));assert.throws(()=>equalWeights([lines[0],lines[0]]))
assert.throws(()=>assignRemainder([{asset:'world',weight:101},{asset:'sp500',weight:0}],1))

for(const imageOnly of [false,true]){
  const profile={...prepareProfile(PROFILES[0]),imageOnly,mode:'participant',approved:true,exposureLimit:6,showCompanies:true,
    analysisView:{mode:'future',capital:'34567',months:'18',groupKey:'fund:2026-10-01'}}
  const record={id:'portable',title:'Mon portefeuille',profile,field:'overlap',draft:'Mon texte exact\n\n🟡 Épargnant Libre'}
  const before=structuredClone(record),restored=importPortfolio(exportPortfolio(record))
  assert.deepEqual(restored,{...record,profile:{...profile,approved:false}})
  assert.deepEqual(record,before)
  assert.equal(buildTweetText(restored.profile),buildTweetText(profile),'Export does not alter tweet structure')
  const legacy=JSON.parse(exportPortfolio(record));delete legacy.portfolio.profile.selection
  assert.equal(importPortfolio(JSON.stringify(legacy)).profile.selection,'classic')
  for(const alter of [p=>{p.version=2},p=>{p.portfolio.profile.lines[0].weight=-1},p=>{p.portfolio.profile.lines.push(p.portfolio.profile.lines[0])},p=>{p.portfolio.field='bad'},p=>{p.portfolio.profile.lines[0].isin='US0000000000'},p=>{p.portfolio.profile.exposureLimit=50}]){
    const bad=JSON.parse(exportPortfolio(record));alter(bad);assert.throws(()=>importPortfolio(JSON.stringify(bad)))
  }
}
assert.throws(()=>importPortfolio('broken'));assert.throws(()=>importPortfolio('a'.repeat(1_000_001)))

const now=new Date('2026-10-30'),line={asset:'a',label:'A',isin:'IE00B4L5Y983',weight:50},reference={isin:line.isin}
const h={basis:'fund',complete:true,asOf:'2026-10-28',sourceUrl:'https://issuer.example',rows:[{isin:'US0378331005',name:'Apple',weightPct:100}]}
assert.equal(qualifyHoldings(h,line,reference,now).complete,true)
for(const [patch,pattern]of [[{asOf:'2026-01-01'},/périmée/],[{asOf:'2026-11-01'},/future/],[{asOf:'2026-02-30'},/invalide/],
  [{synthetic:true},/substitution/],[{rows:[{isin:'US0378331005',weightPct:100.6}]},/invalides|bruts/]]){
  const q=qualifyHoldings({...h,...patch},line,reference,now);assert.equal(q.valid,false);assert.match(q.reasons.join(' '),pattern)
}
for(const [rows,pattern] of [
  [[{isin:'US0378331005',weightPct:99.4}],/insuffisant/],
  [[{isin:'US0378331005',weightPct:99.9},{isin:null,weightPct:.1}],/identifiant/],
  [[{isin:'US0378331005',weightPct:60},{isin:'US5949181045',weightPct:40.0004}],/dépasse/],
]){
  const q=qualifyHoldings({...h,rows},line,reference,now)
  assert(q.valid);assert(!q.complete);assert.match(q.reasons.join(' '),pattern)
  assert.equal(q.sourceCoverage,rows.reduce((s,r)=>s+r.weightPct,0))
}
const b={...line,asset:'b',label:'B'},refs={a:reference,b:reference}
const mixed=sharedPositions([line,b],refs,now,{a:h,b:{...h,basis:'index',complete:false}})
assert.equal(mixed.pairs.length,0);assert.match(mixed.incompatiblePairs[0].reasons[0],/périmètres distincts/)
const dated=sharedPositions([line,b],refs,now,{a:h,b:{...h,asOf:'2026-08-01'}})
assert.equal(dated.pairs.length,0);assert.match(dated.incompatiblePairs[0].reasons[0],/éloignées/)
console.log('DCA roadmap: 1/2/3/8/50-line actions, versioned lossless transport, legacy selection, invalid imports and consent revocation; shared precise partial/stale/scope qualification verified.')
