// Qualification is a local validation, never a new issuer request.
export function indexQualificationReport(output,failures,validatedAt,expectedIds=null){
 const failed=new Map(failures.map(r=>[r.id,r])),idOf=id=>'qualification:'+id
 const ids=expectedIds??Object.keys(output); if(new Set(ids).size!==ids.length)throw Error('Duplicate expected index');
 const absent=ids.filter(id=>!Object.hasOwn(output,id)); failures=[...failures,...absent.map(id=>({id,error:'Résultat attendu absent de la qualification',field:'company-composition'}))]; for(const r of failures)failed.set(r.id,r);
 const outcomes=ids.map(id=>{const row=output[id]??{available:false};return ({id:idOf(id),sourceId:id,phase:'qualification',sourceAttempted:false,qualificationStatus:failed.has(id)?'failed':row.available?row.retained||!row.checkedAt?'retained-or-unproven':'qualified':'not-admitted',status:failed.has(id)?'failed':row.available&&!row.retained&&row.checkedAt?'succeeded':'not-attempted',checkedAt:row.checkedAt??null,asOf:row.asOf??null,validatedAt,reason:failed.get(id)?.error??row.reason??'Qualification non disponible'});})
 return {phase:'qualification',sourceAttempted:false,checkedAt:validatedAt,scope:{kind:'qualification',requestedIds:outcomes.map(r=>r.id),expectedIds:outcomes.map(r=>r.id),networkRequestedIds:[]},
  outcomes,successes:outcomes.filter(r=>r.status==='succeeded'&&r.checkedAt).map(r=>({...r,field:'Qualification de la composition'})),
  errors:failures.map(r=>({...r,id:idOf(r.id),sourceId:r.id,field:'Qualification de la composition',phase:'qualification',sourceAttempted:false,validatedAt})),
  qualifications:outcomes.map(r=>({id:r.sourceId,available:!!output[r.sourceId]?.available,retained:!!output[r.sourceId]?.retained,sourceCheckedAt:r.checkedAt,asOf:r.asOf,status:r.qualificationStatus}))}
}
