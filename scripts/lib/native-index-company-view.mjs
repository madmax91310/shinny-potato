// A local projection of an already qualified complete economic index.
// No network control, stock-price change or guessed issuer-name join occurs here.
import {createHash} from 'node:crypto'
import contracts from '../../src/data/native-index-composition-contracts.json' with {type:'json'}
import policy from '../../src/data/freshness-policy.json' with {type:'json'}
import {qualifiedNativeIndexComposition} from '../../src/data/native-index-composition.js'
import {aggregateCompanies,calculateConcentration,retainQualifiedComposition} from '../../src/data/index-concentration-core.js'

const basis='qualified-native-index'
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex')
const unavailable=reason=>({available:false,sourceBasis:basis,reason})
const vector=rows=>[...rows].sort((a,b)=>a.isin.localeCompare(b.isin)).map(r=>[r.isin,r.weightPct])

export function nativeIndexCompanyView(definition,route,holdings,statuses,identities,now=new Date()) {
 try {
  const index=contracts.indices[route?.indexId]
  if(!index||definition.index!==route.targetIndexName||
      (index.benchmarkName??'TOPIX')!==route.sourceIndexName)throw Error('Identité de la référence économique incompatible avec la fiche')
  const rule=policy.fields['index.facts'],age=date=>(+now-Date.parse(date))/86400000
  const candidates=Object.entries(holdings).filter(([isin,h])=>h.indexId===route.indexId&&h.index===route.sourceIndexName&&
   h.complete===true&&h.unidentifiedSecurityCount===0&&h.unidentifiedWeightPct===0&&h.approximation!==true&&
   qualifiedNativeIndexComposition(h,isin,now)&&
   age(h.asOf)>=0&&age(h.asOf)<=rule.dataDays&&age(h.checkedAt)>=0&&age(h.checkedAt)<=rule.checkDays)
   .sort(([a,x],[b,y])=>y.asOf.localeCompare(x.asOf)||a.localeCompare(b))
  if(!candidates.length)throw Error('Référence intégrale exacte absente, non qualifiée, périmée ou comportant des titres non identifiés')
  const [isin,h]=candidates[0],rows=[...h.rows].sort((a,b)=>a.isin.localeCompare(b.isin))
  const weightVectorSha256=digest(vector(rows))
  if(candidates.some(([,other])=>other.asOf===h.asOf&&digest(vector(other.rows))!==weightVectorSha256))
   throw Error('Références du même indice contradictoires à la même date; aucun arbitrage par majorité ou dernière valeur')
  if(rows.some(r=>!Number.isFinite(r.weightPct)||r.weightPct<0||r.weightPct>100||!r.name?.trim())||
      new Set(rows.map(r=>r.isin)).size!==rows.length)throw Error('Identité ou poids incomplet dans la référence intégrale')
  const total=rows.reduce((sum,r)=>sum+r.weightPct,0)
  // These are the existing native-source precision bounds, not the unrelated
  // generic fund-book tolerance. The published four-decimal rows are retained.
  const roundingBound=rows.length*.00005+(index.methodCode==='invesco-published-economic-index-v1' ? .0001 : 1e-8)
  if(Math.abs(total-100)>roundingBound)throw Error('Somme hors du contrat de précision publié de l’indice')
  const companies=aggregateCompanies(rows,identities),top=companies.slice(0,10)
  // Certification comes from validating and aggregating the entire native
  // book above. The existing concentration calculator receives a ten-company
  // view, never a partial provider top ten masquerading as a complete book.
  const view=calculateConcentration({asOf:h.asOf,checkedAt:h.checkedAt,sourceUrl:h.sourceUrl,sha256:h.sha256,
   rows:top.map(c=>({isin:c.securities[0],name:c.name,weightPct:c.weightPct})),
   complete:false,topCompaniesCertified:true},identities)
  if(!view.available)throw Error(view.reason)
  const issuerGroupingSha256=digest([...companies].sort((a,b)=>a.id.localeCompare(b.id)).map(c=>[c.id,c.weightPct,[...c.securities].sort()]))
  return {...view,top,identifiedWeight:total,asOf:h.asOf,checkedAt:h.checkedAt,sourceUrl:h.sourceUrl,sha256:h.sha256,
   sourceBasis:basis,sourceIndexId:route.indexId,sourceIndexName:h.index,indexProofSubjectIsin:isin,
   sourceLabel:route.indexId==='topix'?'JPX · TOPIX':`Invesco · ${h.index}`,approximation:false,
   sourceRowCount:rows.length,sourceCompanyCount:companies.length,sourceComplete:true,
   publishedWeightSum:total,publishedRoundingResidualPct:100-total,normalizationApplied:false,
   weightVectorSha256,issuerGroupingSha256,coverageProof:h.coverageProof,
   identitySourceUrl:h.identitySourceUrl,identityCheckedAt:h.checkedAt,
   refresh:statuses[isin],capabilities:{companyComposition:true,mainFactsheet:false},
   method:'Référence économique intégrale de l’indice déjà qualifiée, distincte des actifs du fonds et des paniers de substitution. Regroupements par les liens ISIN revus; aucune jointure par nom. Dix entreprises sélectionnées après agrégation de toutes les lignes. Poids publiés conservés sans renormalisation; le résidu de précision du fichier intégral reste enregistré. Les pays, secteurs, rendements et la fiche classique ne sont pas remplacés.'}
 } catch(error) {return unavailable(error.message)}
}

export function retainIndexCompanyView(candidate,previous) {
 const native=candidate.sourceBasis===basis,wasNative=previous?.sourceBasis===basis
 if(candidate.available&&native&&previous?.available&&previous.approximation===true)
  return {...candidate,sourcePromotion:{from:'physical-fund-approximation',previousAsOf:previous.asOf,
   previousSourceUrl:previous.sourceUrl,to:basis,reason:'Référence exacte qualifiée; photographie du proxy distincte et conservée dans son historique.'}}
 if(candidate.available&&native&&wasNative&&previous.available&&Date.parse(candidate.checkedAt)<Date.parse(previous.checkedAt))
  return {...previous,retained:true,refresh:{...previous.refresh,status:'failed',error:'Contrôle source en recul; dernière preuve native valide conservée.'}}
 if(candidate.available&&native&&wasNative&&previous.available&&
     (candidate.sourceIndexId!==previous.sourceIndexId||candidate.asOf===previous.asOf&&
      (candidate.weightVectorSha256!==previous.weightVectorSha256||candidate.issuerGroupingSha256!==previous.issuerGroupingSha256)))
  return {...previous,retained:true,refresh:{...previous.refresh,status:'failed',error:'Composition exacte ou regroupements en conflit à date identique; preuve de révision explicite requise.'}}
 return retainQualifiedComposition(candidate,previous)
}
