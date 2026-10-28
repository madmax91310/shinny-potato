import {createHash} from 'node:crypto'
import {compositionField,compositionIssue,comparisonIssue,compositionEventIssue,confirmedComposition,COMPOSITION_REVIEW_POINTS} from '../../src/lib/radar-composition.js'
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,24)
const groupKey=row=>JSON.stringify([row.family,row.entity,row.scope,row.field.split(':')[0]])
export function reviewCompositions(state,observations,stamp,issues,keyOf) {
  state.compositionReviews??={}
  state.compositionSnapshots??={}
  // Repair only a traceable contaminated reference. Never invent its dates or
  // erase old IDs/receipts. An unavailable prior observation stays unavailable.
  for(const event of state.events) {
    const confirmed=observations.find(row=>row.entity===event.entity&&row.field===event.field&&row.period===event.period&&row.value===event.after&&confirmedComposition(row.compositionEvidence))
    if(confirmed&&event.observationStatus==='pending'){event.compositionEvidence=confirmed.compositionEvidence;event.observationStatus='qualified';event.comparisonCompatible=true;event.compositionReview={...event.compositionReview,resolvedAt:stamp};continue}
    const reason=compositionEventIssue(event)
    if(!reason)continue
    event.observationStatus='pending';event.comparisonCompatible=false
    event.compositionReview??={reason,firstSeenAt:stamp}
    const key=keyOf(event)
    for(const records of [state.current,state.anchors]) {
      const current=records[key]
      if(!current || current.period!==event.period || current.value!==event.after)continue
      const checkedAt=event.financialChangeEvidence?.beforeCheckedAt
      const recovery=(!event.beforeScope||event.beforeScope===event.scope)&&(!event.beforeUnit||event.beforeUnit===event.unit)&&checkedAt && typeof event.before==='number' && Math.abs(event.before)<COMPOSITION_REVIEW_POINTS && event.beforePeriod ? {...current,value:event.before,period:event.beforePeriod,checkedAt,sourceUrl:event.previousSourceUrl??current.sourceUrl,recoveredFromEvent:event.id} : null
      if(recovery){for(const field of ['compositionEvidence','compositionEventKey','sourceHash','completeComposition','absenceEvidence'])delete recovery[field];records[key]=recovery}
      else {state.compositionReviews['legacy-'+event.id]??={reason,firstSeenAt:stamp,observation:current};delete records[key]}
    }
  }
  const groups=new Map(),accepted=[]
  for(const row of observations) {
    if(!['etf','indices'].includes(row.family)||!compositionField(row)){accepted.push(row);continue}
    const key=groupKey(row)
    if(!groups.has(key))groups.set(key,[])
    groups.get(key).push(row)
  }
  for(const [key,rows]of groups) {
    const sample=rows[0],evidence=sample.compositionEvidence,prior=state.compositionSnapshots[key]
    let reason=rows.some(r=>r.period!==sample.period||evidence&&r.compositionEvidence?.sourceHash!==evidence.sourceHash)?'Lignes de photographies ou de couvertures différentes ; comparaison suspendue.':compositionIssue(evidence,prior)
    if(!reason && evidence && rows.some(row=>{const before=state.current[keyOf(row)];return before&&typeof before.value==='number'&&Math.abs(row.value-before.value)>=COMPOSITION_REVIEW_POINTS}) && !confirmedComposition(evidence))reason='Variation extrême : confirmation du périmètre et de la couverture nécessaire.'
    if(!reason && !evidence)reason=rows.map(row=>compositionEventIssue({...row,kind:'change',before:state.current[keyOf(row)]?.value,after:row.value})).find(Boolean)
    if(reason) {
      const id=hash([key,sample.period,evidence?.sourceHash??sample.sourceHash,rows.map(r=>[r.field,r.value])])
      const review=state.compositionReviews[id]??={id,reason,firstSeenAt:stamp,observations:rows}
      if(review.resolvedAt){review.resolutions??=[];review.resolutions.push(review.resolvedAt);delete review.resolvedAt}
      review.lastAttemptAt=stamp
      for(const row of rows)for(const records of [state.current,state.anchors]){const prior=records[keyOf(row)];if(prior&&prior.period===row.period&&prior.value===row.value&&!confirmedComposition(prior.compositionEvidence))delete records[keyOf(row)]}
      issues.push({family:sample.family,entity:sample.entity,reason:`Composition en attente : ${reason}`,reviewId:id})
      continue
    }
    if(evidence&&(!prior||evidence.asOf>=prior.asOf)&&rows.every(row=>!state.current[keyOf(row)]||row.period>=state.current[keyOf(row)].period))state.compositionSnapshots[key]=evidence
    for(const row of rows) {
      const before=state.anchors[keyOf(row)],changed=comparisonIssue(before,row)
      if(changed){state.comparisonReviews??={};state.comparisonReviews[keyOf(row)]={reason:changed,before,after:row,recordedAt:stamp};state.anchors[keyOf(row)]=row}
      accepted.push(row)
    }
    for(const review of Object.values(state.compositionReviews))if(!review.resolvedAt&&review.observations?.some(r=>groupKey(r)===key)&&sample.period>=review.observations[0].period)review.resolvedAt=stamp
  }
  return accepted
}
