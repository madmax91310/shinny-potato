import assert from 'node:assert/strict'
import {equalWeights} from '../src/pages/dca-profiles/allocation-actions.js'
import {validateProfile} from '../src/pages/dca-profiles/engine.js'
import {newManualLine} from '../src/pages/dca-profiles/placements.js'
import {readSaved,writeSaved,savedRecord,restoreSavedProfile} from '../src/pages/dca-profiles/management.js'
import {exportPortfolio,importPortfolio} from '../src/pages/dca-profiles/portable-portfolios.js'
import {fitImageCanvas} from '../src/pages/dca-profiles/image-canvas.js'
import {balancedDonutRows} from '../src/pages/dca-profiles/donut-layout.js'
import {polygonIndex} from '../src/pages/dca-profiles/image-collisions.js'

const draft='Texte personnalisé conservé. '.repeat(1000)
const template={id:'subscriber:unlimited',mode:'participant',selection:'classic',name:'Épargne',scope:'Portefeuille investi'}
for(const count of [51,200,1000,20001]){
 const input=Array.from({length:count},(_,i)=>newManualLine({label:`Placement ${i}`,category:'Fonds en euros',amount:i===0?100:0}))
 const lines=equalWeights(input),profile={...template,lines}
 assert(lines.every(line=>line.weight>0))
 assert(Math.abs(lines.reduce((sum,line)=>sum+line.weight,0)-100)<1e-8)
 assert.deepEqual(lines.map(({weight:_weight,...line})=>line),input.map(({weight:_weight,...line})=>line))
 assert.deepEqual(validateProfile(profile),[])
 assert(validateProfile(profile,50).some(error=>error.includes('50 positions')))
 const record={id:'large',title:'Grande allocation',profile,draft,field:'all'}
 let raw=null
 const storage={getItem:()=>raw,setItem:(_,value)=>{raw=value}}
 writeSaved(storage,[record]);assert.deepEqual(readSaved(storage),[record])
 const incomplete=savedRecord({...record,profile:{...profile,lines:lines.map((line,i)=>i?line:{...line,weight:NaN,amount:NaN})}})
 assert.equal(incomplete.status,'draft')
 writeSaved(storage,[incomplete]);assert.deepEqual(readSaved(storage),[incomplete])
 const restored=restoreSavedProfile(readSaved(storage)[0].profile)
 assert(Number.isNaN(restored.lines[0].weight));assert(Number.isNaN(restored.lines[0].amount))
 assert.deepEqual(restored.lines.slice(1),lines.slice(1))
 if(count<=1000){
  assert.deepEqual(importPortfolio(exportPortfolio(record)),{...record,profile:{...profile,approved:false}})
  assert.equal(importPortfolio(exportPortfolio(incomplete)).status,'draft')
 }else assert.throws(()=>exportPortfolio(record),/trop volumineux/)
 const original=raw
 assert.throws(()=>writeSaved({...storage,setItem(){throw Error('QuotaExceededError')}},[record]),/Quota/)
 assert.equal(raw,original)
 const ordered=balancedDonutRows(lines)
 assert.equal(ordered.length,count);assert.equal(new Set(ordered.map(l=>l.asset)).size,count)
 assert.deepEqual(lines,input.map((line,i)=>({...line,weight:lines[i].weight})))
}
for(const [w,h] of [[1600,1000],[1600,81155],[1600,500000],[500000,1600],[1000000,1000000]]){
 const fit=fitImageCanvas(w,h)
 assert(fit.width>=1&&fit.height>=1&&fit.width<=16000&&fit.height<=16000&&fit.width*fit.height<=32000000)
 if(w===1600&&h===1000)assert.deepEqual(fit,{width:w,height:h,scale:1})
}
assert.throws(()=>fitImageCanvas(NaN,1000),/invalides/)
// Compare spatial queries with exhaustive intersection across cells and boundaries.
const rectangle=(x,y,w,h)=>[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}]
const intersects=(a,b)=>a[0].x<=b[2].x&&a[2].x>=b[0].x&&a[0].y<=b[2].y&&a[2].y>=b[0].y
const index=polygonIndex(intersects),placed=[]
for(let i=0;i<1000;i++){
 const points=rectangle((i*97)%3000-500,(i*193)%3000-500,40+i%400,50+i%200)
 assert.equal(index.overlaps(points),placed.some(other=>intersects(points,other)))
 index.add(points);placed.push(points)
}
console.log('Unlimited: 51/200/1000/20001, complete/partial saves, long text, quotas, JSON limits, positive weights, canvas budgets and spatial query parity passed.')
