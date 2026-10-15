import fs from 'node:fs'
import path from 'node:path'
import { companyCompleteness } from '../src/pages/company-analysis/completeness.js'
const profiles=JSON.parse(fs.readFileSync('src/data/company-profiles.json','utf8'))
const data=JSON.parse(fs.readFileSync('src/data/company-analysis.json','utf8'))
const now=new Date()
const rows=profiles.filter(p=>!p.candidateOnly).map(p=>companyCompleteness({...p,...data.companies[p.id]},now))
const usable=rows.filter(r=>r.methods.length>0).length
const earnings=rows.filter(r=>r.methods.includes('earnings')).length
const cash=rows.filter(r=>r.methods.includes('cash')).length
const partial=rows.filter(r=>!r.complete)
let report=`## Réception Analyse d’entreprise\n\n${rows.length-partial.length}/${rows.length} dossiers actifs complets. Minimum de livraison : 140.\n\n${usable} entreprises avec au moins une méthode ; ${earnings} bénéfices, ${cash} FCF. Minimum exploitable : 150.\n\n`
if(partial.length)report+='### Dossiers à compléter\n\n| Entreprise | Données manquantes ou non qualifiées |\n|---|---|\n'+partial.map(r=>`| ${r.name} | ${r.missing.join(' ; ').replaceAll('|','/')} |`).join('\n')+'\n'
for(const filename of process.argv.slice(2)) {
  if(!fs.existsSync(filename))continue
  const observation=JSON.parse(fs.readFileSync(filename,'utf8'))
  const failures=Object.entries(observation.companies??{}).flatMap(([id,status])=>{
    if(!profiles.some(p=>p.id===id&&!p.candidateOnly))return []
    return Object.entries(status).filter(([key,value])=>!key.endsWith('Detail')&&!(key==='primarySource'&&status.accounts==='updated')&&!(key==='quarter'&&status.accounts==='updated')&&typeof value==='string'&&!['updated','qualified','cached','cached-with-original-observation-date','public-finviz-estimates','published-accounts-only','not-applicable-ifrs'].includes(value)).map(([key,value])=>`- ${id} · ${key} : ${(status[key+'Detail']??value).replace(/[\r\n]/g,' ')}`)
  })
  if(failures.length)report+=`\n### Collecte ${path.basename(filename)}\n\n${failures.join('\n')}\n`
}
report+='\nLes échecs de collecte ne renouvellent pas les dates des observations conservées. Les données périmées sont écartées des modèles concernés.\n'
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,report)
console.log(report)
