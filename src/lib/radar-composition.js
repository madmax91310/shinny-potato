// A large move requests evidence; it is never labelled false on size alone.
export const COMPOSITION_REVIEW_POINTS = 40
export const compositionField = row => /^(countries|sectors):/.test(row.field ?? '') || row.field === 'top10'
export const residualCategory = field => /cash|liquidit|deriv|other|autres|non ventil/i.test(field ?? '')
export function confirmedComposition(evidence) {
  const proof=evidence?.confirmation
  return Boolean(proof && ['issuer-explanation','complete-positions'].includes(proof.kind) && proof.asOf===evidence.asOf && proof.identity===evidence.identity && proof.basis===evidence.basis && proof.unit===evidence.unit && proof.sourceHash && /^https:\/\//.test(proof.sourceUrl??'') && proof.method && proof.coverage==='complete' && (proof.kind!=='complete-positions'||proof.matchesAllocation===true))
}
export function compositionIssue(evidence, previous) {
  if(!evidence)return null
  if(evidence.status==='pending')return evidence.reason??'Photographie en attente de qualification.'
  if(!evidence.rowCount || evidence.rowCount!==evidence.categoryCount || !Number.isFinite(evidence.total)||!Array.isArray(evidence.categories)||evidence.categories.some(c=>typeof c.weightPct!=='number'||!Number.isFinite(c.weightPct)))return 'Ventilation incomplète ou catégories dupliquées.'
  if(confirmedComposition(evidence))return null
  if(evidence.onlyResidual)return 'Ventilation limitée aux liquidités/dérivés ou au non ventilé ; couverture économique non prouvée.'
  if(evidence.weightConvention==='net-asset-value' && Math.abs(evidence.total-100)>1)return 'Couverture de la ventilation en actif net non établie ; aucun redimensionnement.'
  if(!['net-asset-value','documented-gross-exposure'].includes(evidence.weightConvention))return 'Convention des poids non documentée.'
  if(evidence.weightConvention==='documented-gross-exposure'&&!evidence.method)return 'Méthode d’exposition brute manquante.'
  if(previous?.categories?.some(c=>c.weightPct!==0&&!evidence.categories.some(n=>n.name===c.name)) && !evidence.complete)return 'Catégories absentes : une disparition de ligne ne prouve pas une réallocation.'
  return null
}
export function comparisonIssue(before,after) {
  if(!before)return null
  for(const key of ['entity','scope','unit','currency','shareClass','basis','method'])if((before[key]??null)!==(after[key]??null))return `Conventions différentes : ${key}. Nouvelle référence silencieuse.`
  const a=before.compositionEvidence,b=after.compositionEvidence
  if(b && !a)return 'Ancienne ventilation sans preuve de couverture ; nouvelle référence silencieuse.'
  if(a&&b)for(const key of ['identity','basis','currency','unit','method','classification','weightConvention'])if((a[key]??null)!==(b[key]??null))return `Conventions de composition différentes : ${key}. Nouvelle référence silencieuse.`
  return null
}
export function compositionEventIssue(event) {
  if(!compositionField(event))return null
  if(event.observationStatus==='pending')return event.compositionReview?.reason??'Observation en attente de qualification.'
  const evidence=event.compositionEvidence
  const issue=compositionIssue(evidence)
  if(issue)return issue
  if(event.kind==='change' && typeof event.before==='number' && typeof event.after==='number' && Math.abs(event.after-event.before)>=COMPOSITION_REVIEW_POINTS && !confirmedComposition(evidence))return 'Variation extrême : confirmation du périmètre et de la couverture nécessaire.'
  return null
}

// Detection remains at two points. Editorial prominence requires a documented
// structural move (10 points), or crossing the majority/concentration threshold.
export function importantComposition(event){if(!compositionField(event)||residualCategory(event.field)||event.beforePeriod===event.period||typeof event.before!=='number'||typeof event.after!=='number')return false;return Math.abs(event.after-event.before)>=10 || Math.min(event.before,event.after)<50&&Math.max(event.before,event.after)>=50}
