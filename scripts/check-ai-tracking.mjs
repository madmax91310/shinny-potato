import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
export function trackingStatus(book,state){
 const reports=book.competitions.filter(c=>c.status==='launched').map(comp=>{const current=state.current?.[comp.id],last=(state.daily?.[comp.id]??[]).filter(p=>p.complete).at(-1);return {competitionId:comp.id,date:state.asOf,lastUsable:last?.date??null,awaitingLaunch:comp.startDate>state.asOf,complete:current?.complete===true,missing:current?.rows.filter(r=>!r.complete).map(r=>({participant:r.id,reason:r.error}))??[],pending:comp.decisions.filter(d=>['recorded','pending','failed'].includes(d.status)&&d.executionDate<=state.asOf).map(d=>({id:d.id,reason:d.error??'Opération attendue non exécutée'}))}})
 return {asOf:state.asOf,ok:reports.every(r=>r.awaitingLaunch||r.complete),competitions:reports}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const folder=path.resolve('data/ai-portfolios'),report=trackingStatus(JSON.parse(fs.readFileSync(path.join(folder,'book.json'))),JSON.parse(fs.readFileSync(path.join(folder,'state.json'))));if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(!report.ok)process.exitCode=1
}
