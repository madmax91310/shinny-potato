import fs from 'node:fs'
import { companyCompleteness } from '../src/pages/company-analysis/completeness.js'

const path='src/data/company-profiles.json'
const profiles=JSON.parse(fs.readFileSync(path,'utf8'))
const observations=JSON.parse(fs.readFileSync('src/data/company-analysis.json','utf8'))
const minimumArg=process.argv.find(a=>a.startsWith('--minimum='))?.slice(10)
const minimum=minimumArg===undefined?60:Number(minimumArg)
if(!Number.isInteger(minimum)||minimum<1)throw Error('Le minimum doit être un entier positif.')
const usableArg=process.argv.find(a=>a.startsWith('--minimum-usable='))?.slice(17)
const minimumUsable=usableArg===undefined?0:Number(usableArg)
if(!Number.isInteger(minimumUsable)||minimumUsable<0)throw Error('Minimum exploitable invalide.')
const enforce=minimumArg!==undefined||process.argv.includes('--require-60')
const now=new Date(),rows=profiles.map(p=>({...companyCompleteness({...p,...observations.companies[p.id]},now),candidate:Boolean(p.candidateOnly)}))
const promoted=[]
if(process.argv.includes('--promote'))for(const p of profiles){
  if(p.candidateOnly&&p.collectionAdapter==='sec-companyfacts'&&rows.find(r=>r.id===p.id).complete){
    delete p.candidateOnly;p.qualifiedAt=now.toISOString().slice(0,10);promoted.push(p.id)
  }
}
const complete=rows.filter(r=>r.complete&&(!r.candidate||promoted.includes(r.id)))
const activeRows=rows.filter(r=>!r.candidate||promoted.includes(r.id))
const usable=activeRows.filter(r=>r.methods.length>0).length
const report={usable,minimumUsable,checkedAt:now.toISOString(),minimum,complete:complete.length,active:profiles.filter(p=>!p.candidateOnly).length,promoted,companies:rows}
if(process.argv.includes('--promote'))fs.writeFileSync(path,JSON.stringify(profiles,null,2)+'\n')
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9)
if(output)fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({complete:report.complete,usable,active:report.active,promoted,missing:rows.filter(r=>!r.complete).map(r=>({id:r.id,missing:r.missing}))},null,2))
if(enforce&&complete.length<minimum)throw Error(`Réception refusée : ${complete.length}/${minimum} entreprises complètes.`)

if(usable<minimumUsable)throw Error(`Réception refusée : ${usable}/${minimumUsable} entreprises avec une méthode disponible.`)
