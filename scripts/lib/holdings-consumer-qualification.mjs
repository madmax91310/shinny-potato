import {qualifyHoldings} from '../../src/pages/dca-profiles/holdings-qualification.js'

const signature=h=>!Array.isArray(h?.rows)||h.rows.some(r=>!r||typeof r!=='object')?null:JSON.stringify({
 asOf:h.asOf,checkedAt:h.checkedAt,sourceUrl:h.sourceUrl,sha256:h.sha256,basis:h.basis,
 complete:h.complete===true,approximation:h.approximation===true,
 scope:h.scope,subjectIsin:h.subjectIsin,navReconciliation:h.navReconciliation,coverageProof:h.coverageProof,
 positions:h.rows.map(r=>JSON.stringify([r.isin??null,r.weightPct])).sort(),
})

// Reuse the actual full-overlap admission rule, not source-file completeness.
// This is a derived consumer check; it never renews a source-control date.
export function holdingsConsumerQualifications({references,assets=references,holdings,sourceRecords,now=new Date()}) {
 const expected=Object.entries(references).filter(([asset,r])=>Object.hasOwn(assets,asset)&&r.isin&&Object.hasOwn(sourceRecords,r.isin)&&sourceRecords[r.isin]&&!r.outsideClassification)
 const result={}
 for(const [asset,reference]of expected){
  const isin=reference.isin,source=sourceRecords[isin],h=holdings[asset]
  const row=result[isin]??={kind:'actual-dca-full-overlap-v1',stage:'consumer-validation',sourceContacted:false,expectedAssetIds:expected.filter(([,r])=>r.isin===isin).map(([id])=>id),outcomes:[]}
  const snapshotMatches=h&&/^[a-f0-9]{64}$/.test(source.sha256||'')&&Boolean(h.synthetic)===Boolean(source.synthetic||reference.synthetic)&&signature(h)!==null&&signature(h)===signature(source)
  if(!snapshotMatches){
   row.outcomes.push({asset,status:'deferred',complete:false,reasons:['Projection absente ou différente du registre source (identités, poids, périmètre ou dates) ; admission consommateur non certifiée.'],sourceSha256:source.sha256??null,projectionSha256:h?.sha256??null})
   continue
  }
  const q=qualifyHoldings(h,{asset,isin},reference,now)
  row.outcomes.push({asset,status:'evaluated',...q,asOf:h.asOf,sourceCheckedAt:h.checkedAt,sourceSha256:h.sha256,sourceUrl:h.sourceUrl})
 }
 return result
}

export function applyHoldingsConsumerQualification(connection,qualification) {
 if(connection.field!=='completeHoldings'||!qualification)return connection
 const result={...connection,consumerQualification:{...qualification,priorActionState:connection.actionState}}
 // Source failures, conflicts, excluded scopes and pre-existing qualifications
 // retain their own cause and clocks. A complete alternative cannot erase them.
 if(connection.actionState!=='current')return result
 const limited=qualification.outcomes.filter(r=>r.status!=='evaluated'||!r.complete)
 if(!limited.length)return result
 const reasons=[...new Set(limited.flatMap(r=>r.reasons))]
 return {...result,actionState:'unqualified',requiresAction:true,priority:3,
  reason:'Composition présente ; certains usages de recouvrement intégral restent refusés par le moteur : '+reasons.join(' '),
  nextAction:'Qualifier les pièces et périmètres requis par le moteur ; conserver les analyses partielles, les poids originaux et les autres usages. Aucun seuil ou poids ne doit être ajusté pour clôturer ce diagnostic.'}
}
