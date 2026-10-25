// Native reports remain readable by existing consumers. Expected work is frozen
// before collection/validation; Python owns the shared omission/validation rules.
import {execFileSync} from 'node:child_process'
import {writeFileSync} from 'node:fs'
const bridge=value=>JSON.parse(execFileSync('python',['scripts/producer_report_contract.py'],{input:JSON.stringify(value),encoding:'utf8',maxBuffer:128*1024*1024}))
export function producerContract(producer,reportStem,items,{mode='full',emptyReason=null,retainNativeFailuresOnly=false}={}){
 const {plan,placeholder}=bridge({action:'prepare',plan:{producer,reportStem,items:structuredClone(items),mode,emptyReason,retainNativeFailuresOnly}})
 return {plan,placeholder,start(path){writeFileSync(path,JSON.stringify(placeholder)+'\n')},finish(report){return bridge({action:'finish',plan,report})}}
}

// Checking a publication listing/access is distinct from certifying its financial
// documents. Only this invocation's source control dates establish a success.
export function sourceResults(plan,rows,http=[]){
 const successes=[],errors=[],skipped=[],seen=new Set(),issues=[]
 for(const row of rows??[]){
  const id='radar-source:'+row.id
  if(seen.has(id)){issues.push({id,error:'Résultat source dupliqué : '+id});continue}seen.add(id)
  const fresh=Date.parse(row.checkedAt??row.lastSuccessAt??'')>=Date.parse(plan.declaredAt)
  const attempted=Date.parse(row.attemptedAt??'')>=Date.parse(plan.declaredAt)
  const common={id,sourceUrl:row.url,checkedAt:row.checkedAt,attemptedAt:row.attemptedAt,asOf:row.asOf}
  if((row.status==='error'||row.status==='partial')&&(fresh||attempted))errors.push({...common,error:row.error??row.archiveWarning??row.reason??'Source partielle',sourceAttempted:true})
  else if(fresh)successes.push({...common,status:http.some(r=>r.url===row.url&&r.status===304)?'unchanged-verified':'succeeded',sourceAttempted:true})
  else skipped.push({...common,status:row.nextCheckAt?'waiting':'cached',sourceAttempted:false,reason:row.nextCheckAt?'Prochain contrôle différé jusqu’au '+row.nextCheckAt:'Aucun contrôle source frais dans cette exécution'})
 }
 return {successes,errors:[...errors,...issues],skipped}
}

export const refreshProducerContract=report=>report.resultContract?.inputPlan?bridge({action:'finish',plan:report.resultContract.inputPlan,report}):report
