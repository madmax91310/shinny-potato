import assert from 'node:assert/strict'
import {readFileSync}from'node:fs'
import {createHash}from'node:crypto'
const read=p=>JSON.parse(readFileSync(p)),old=read('reports/corrections-2026-10-22/reconciliation-90-ecarts.json').cases,newRows=read('reports/reliquat-2026-10-23/reconciliation-90-ecarts.json').cases
assert.equal(newRows.length,90);assert.equal(new Set(newRows.map(r=>r.isin+'/'+r.year)).size,90)
assert.deepEqual(newRows.map(r=>[r.isin,r.year]),old.map(r=>[r.isin,r.year]))
for(let i=0;i<old.length;i++)for(const key of ['adjustedPriceReturn','navReturn','navConverted','differencePp','alert','marketStartValue','marketEndValue','marketHash'])assert.deepEqual(newRows[i][key],old[i][key],`Original financial alert changed: ${i}/${key}`)
const batch=newRows.filter((r,i)=>old[i].status==='anomalie encore inexpliquée');assert.equal(batch.length,84)
assert.equal(batch.filter(r=>r.status==='erreur corrigée').length,5)
for(const r of batch){
 assert(r.researchPerformed)
 if(r.status==='anomalie encore inexpliquée')assert(r.missingPiece,`${r.isin}/${r.year}`)
 if(r.status==='erreur corrigée'){assert.equal(r.isin,'IE00BLNMYC90');assert(r.year>=2016&&r.year<=2020);assert(r.officialDailyEvidence)}
}
console.log('All 90 original alerts and financial values preserved; 84 follow-ups reconciled, five proven source errors, 79 specific missing pieces, no threshold change.')
