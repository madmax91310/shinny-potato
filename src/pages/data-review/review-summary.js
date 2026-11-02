import {groupReviewIssues} from './review-causes.js'

export const initialIssue = row => ['failure','connection','monitoring'].includes(row.kind)
export const reviewOwner = row => row.kind==='monitoring'||row.stage==='Consommation'?'Supervision':
 ['archive','editorial','not-applicable'].includes(row.kind)?'Revue documentaire':'Automatisation'

// A consumer contract is (tool, asset, field), never another source failure.
export function summarizeInbox(issues){
 const categories={},contracts=new Map(),attempts=new Set()
 let signals=0
 for(const row of issues){
  categories[row.kind]=(categories[row.kind]??0)+1
  for(const s of row.signals){
   signals++
   if(s.consumerContract)contracts.set(s.consumerContract.id,s.consumerContract)
   for(const o of [s,...(s.observations??[])]){
    const run=o.runId??o.runUrl??s.runId??s.runUrl
    if(run)attempts.add(JSON.stringify([s.workflow??'',run,o.attempt??s.attempt??1]))
   }
  }
 }
 const common=[...groupReviewIssues(issues).values()].filter(rs=>rs.length>1)
 return {points:issues.length,categories,signals,attempts:attempts.size,
  commonInterventions:common.length,pointsInCommonInterventions:common.reduce((n,rs)=>n+rs.length,0),
  consumerContracts:contracts.size,consumerStates:[...contracts.values()].reduce((out,c)=>(out[c.state]=(out[c.state]??0)+1,out),{})}
}

export function financialImpact(row){
 const windows=row.currentConsumer?.windows
 if(!Array.isArray(windows))return {state:'unqualified',kind:'qualification',description:'Impact actuel à qualifier : les fenêtres consommées ne sont pas documentées.'}
 const blocked=windows.filter(w=>w.qualification?.qualified===false)
 const valid=windows.filter(w=>w.qualification?.qualified===true)
 if(blocked.length)return {state:valid.length||row.currentConsumer?.annualNav?'partial':'blocked',kind:'qualification',
  description:`${valid.length?'Usage partiel : une voie indépendante est qualifiée.':'Fenêtre actuelle bloquée.'} Fenêtres refusées : ${blocked.map(w=>`${w.id} · ${w.currency} · ${w.convention} · ${w.qualification.reason??w.qualification.code}`).join(' ; ')}. ${row.currentConsumer?.secured??''}`}
 if(valid.length)return {state:'secured',kind:'archive',description:`Usage actuel assuré sur une voie distincte : ${row.currentConsumer.secured??row.currentConsumer.route}. La divergence historique reste à expliquer.`}
 return {state:'unqualified',kind:'qualification',description:'Impact actuel à qualifier : aucune fenêtre qualifiée démontrée. '+(row.currentConsumer?.secured??'')}
}
