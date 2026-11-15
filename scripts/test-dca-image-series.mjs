import assert from 'node:assert/strict'
import {validateProfile,profilePositionLimit} from '../src/pages/dca-profiles/engine.js'
import {newManualLine} from '../src/pages/dca-profiles/placements.js'
import {exportPortfolio,importPortfolio} from '../src/pages/dca-profiles/portable-portfolios.js'
const profile={id:'subscriber:series',name:'Élodie',mode:'participant',scope:'Portefeuille investi',multiImage:true,lines:Array.from({length:50},(_,i)=>newManualLine({label:`Fonds euros épargne ${i}`,category:'Fonds en euros',weight:2,amount:i?0:100}))}
assert.equal(profilePositionLimit(profile),Infinity)
assert.deepEqual(validateProfile(profile),[])
assert.deepEqual(validateProfile({...profile,multiImage:false}),[])
assert.deepEqual(validateProfile({...profile,lines:[...profile.lines,newManualLine({label:'Placement supplémentaire',amount:1})]}),[])
const record={id:'series',title:'Élodie',profile,draft:'Mon texte',field:'all'}
const restored=importPortfolio(exportPortfolio(record))
assert.equal(restored.profile.multiImage,true)
assert.deepEqual(restored.profile.lines,profile.lines)
assert.equal(new Set(restored.profile.lines.map(l=>l.asset)).size,50)
console.log('Image series: 50 lines, single mode capacity, stable manual identities and lossless transport passed.')

const {imageFields}=await import('../src/pages/dca-profiles/image-series.js')
const {radialDonutLayout,shortDonutName}=await import('../src/pages/dca-profiles/donut-layout.js')
assert.deepEqual(imageFields('all'),['complete','allocation','countries','sectors'])
for(const count of [9,15,50]){
 const rows=Array.from({length:count},(_,i)=>({name:`Placement ${i}`,weight:100/count}))
 const plan=radialDonutLayout(rows,value=>value.length*16)
 assert.equal(plan.labels.length,count)
 assert(Math.abs(plan.rows.reduce((sum,row)=>sum+row.weight,0)-100)<1e-8)
 for(const [i,a] of plan.labels.entries()){
  assert(a.left>=0&&a.right<=plan.width&&a.top>=220&&a.bottom<plan.height)
  for(const b of plan.labels.slice(i+1))assert(!(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top),`${count}: ${a.name} / ${b.name}`)
 }
}
console.log('Complete + individual choices, unchanged weights, all labels and collision-free 9/15/50 position layouts passed.')
// Real provider names must stay outside the ring, including long ETF names.
const longNames=['iShares MSCI World Consumer Staples Sector Advanced UCITS ETF','State Street SPDR MSCI Europe Small Cap Value Weighted UCITS ETF','Xtrackers Artificial Intelligence and Big Data UCITS ETF']
const dense=radialDonutLayout(Array.from({length:18},(_,i)=>({name:longNames[i%3],weight:100/18})),v=>v.length*16)
for(const label of dense.labels){
 assert(label.anchor==='left'?label.left>dense.cx+dense.outer:label.right<dense.cx-dense.outer)
 assert(label.lines.length<=4)
 for(const other of dense.labels)if(label!==other)assert(!(label.left<other.right&&label.right>other.left&&label.top<other.bottom&&label.bottom>other.top))
}

assert.equal(shortDonutName('iShares Core S&P 500 UCITS ETF USD (Acc)'), 'ETF S&P 500')
assert.equal(shortDonutName('Xtrackers S&P 500 Equal Weight UCITS ETF 1C'),'ETF S&P 500 Equal Weight')
assert.equal(shortDonutName('Coca-Cola'),'Coca-Cola')
assert.equal(shortDonutName('ETF émergents hors Chine'),'ETF émergents hors Chine')

const {equalWeights}=await import('../src/pages/dca-profiles/allocation-actions.js')
const {writeSaved,readSaved}=await import('../src/pages/dca-profiles/management.js')
const {fitDonutCanvas}=await import('../src/pages/dca-profiles/image-individual.js')
for(const count of [51,200,1000,20001]){
 const lines=equalWeights(Array.from({length:count},(_,i)=>newManualLine({label:`Épargne ${i}`,category:'Fonds en euros',amount:i===0?100:0})))
 assert(lines.every(line=>line.weight>0))
 assert(Math.abs(lines.reduce((sum,line)=>sum+line.weight,0)-100)<1e-8)
 assert.deepEqual(validateProfile({...profile,lines}),[])
 if(count<=1000){
  const large={...record,profile:{...profile,lines},draft:'Texte personnalisé conservé. '.repeat(1000)}
  assert.deepEqual(importPortfolio(exportPortfolio(large)).profile.lines,lines)
  let raw=null;const storage={getItem:()=>raw,setItem:(_,value)=>{raw=value}}
  writeSaved(storage,[large]);assert.deepEqual(readSaved(storage)[0].profile.lines,lines);assert.equal(readSaved(storage)[0].draft,large.draft)
 }
}
const fitted=fitDonutCanvas(1600,500000)
assert(fitted.height<=16000&&fitted.width*fitted.height<=32_000_000)
console.log('Uncapped positions: 51/200/1000/20001 allocations, positive tiny weights, long saved text, transport and scaled canvas passed.')
