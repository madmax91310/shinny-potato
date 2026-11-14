import assert from 'node:assert/strict'
import {validateProfile,profilePositionLimit} from '../src/pages/dca-profiles/engine.js'
import {newManualLine} from '../src/pages/dca-profiles/placements.js'
import {exportPortfolio,importPortfolio} from '../src/pages/dca-profiles/portable-portfolios.js'
const profile={id:'subscriber:series',name:'Élodie',mode:'participant',scope:'Portefeuille investi',multiImage:true,lines:Array.from({length:50},(_,i)=>newManualLine({label:`Fonds euros épargne ${i}`,category:'Fonds en euros',weight:2,amount:i?0:100}))}
assert.equal(profilePositionLimit(profile),50)
assert.deepEqual(validateProfile(profile),[])
assert.deepEqual(validateProfile({...profile,multiImage:false}),[])
assert.ok(validateProfile({...profile,lines:[...profile.lines,newManualLine()]}).some(e=>e.includes('50 positions')))
const record={id:'series',title:'Élodie',profile,draft:'Mon texte',field:'all'}
const restored=importPortfolio(exportPortfolio(record))
assert.equal(restored.profile.multiImage,true)
assert.deepEqual(restored.profile.lines,profile.lines)
assert.equal(new Set(restored.profile.lines.map(l=>l.asset)).size,50)
console.log('Image series: 50 lines, single mode capacity, stable manual identities and lossless transport passed.')

const {imageFields}=await import('../src/pages/dca-profiles/image-series.js')
const {radialDonutLayout}=await import('../src/pages/dca-profiles/donut-layout.js')
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
