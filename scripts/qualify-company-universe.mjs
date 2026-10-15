import fs from 'node:fs'
import { companyCompleteness } from '../src/pages/company-analysis/completeness.js'

const path='src/data/company-profiles.json'
const profiles=JSON.parse(fs.readFileSync(path,'utf8'))
const observations=JSON.parse(fs.readFileSync('src/data/company-analysis.json','utf8'))
const now=new Date(),rows=profiles.map(p=>({...companyCompleteness({...p,...observations.companies[p.id]},now),candidate:Boolean(p.candidateOnly)}))
const promoted=[]
if(process.argv.includes('--promote'))for(const p of profiles){
  if(p.candidateOnly&&p.collectionAdapter==='sec-companyfacts'&&rows.find(r=>r.id===p.id).complete){
    delete p.candidateOnly;p.qualifiedAt=now.toISOString().slice(0,10);promoted.push(p.id)
  }
}
const complete=rows.filter(r=>r.complete&&(!r.candidate||promoted.includes(r.id)))
const report={checkedAt:now.toISOString(),minimum:60,complete:complete.length,active:profiles.filter(p=>!p.candidateOnly).length,promoted,companies:rows}
if(process.argv.includes('--promote'))fs.writeFileSync(path,JSON.stringify(profiles,null,2)+'\n')
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)
if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({complete:report.complete,active:report.active,promoted,missing:rows.filter(r=>!r.complete).map(r=>({id:r.id,missing:r.missing}))},null,2))
if(process.argv.includes('--require-60')&&complete.length<60)throw Error(`Réception refusée : ${complete.length}/60 entreprises complètes.`)
