import {lazy,Suspense} from 'react'
import ScoreDetails from './ScoreDetails.jsx'
import MaterialConditions from './MaterialConditions.jsx'
import RelatedStages from './RelatedStages.jsx'
const SignalDetails=lazy(()=>import('./SignalDetails.jsx'))
export default function PublicationEvidence({group,read,onRead,subject}) {
  const {event,assessment}=group,material=assessment.material
  return <>
    <details className="radar-score"><summary>Pourquoi ce classement ? {assessment.score}/100</summary><ScoreDetails assessment={assessment}/></details>
    {material.missing.length>0&&<details><summary>Conditions et éléments manquants ({material.missing.length})</summary><MaterialConditions material={material} event={event}/></details>}
    {event.relatedStages?.length>0&&<details><summary>Étapes liées et preuves</summary><RelatedStages stages={event.relatedStages}/></details>}
    <p>Chaque fait conserve sa source, son périmètre et son identifiant de lecture.</p>
    {group.events.map(related=><details className="radar-related" open={related.id===subject} id={related.id!==event.id?`subject-${related.id}`:undefined} key={related.id}><summary>{related.title}</summary><Suspense fallback={<p>Chargement des preuves…</p>}><SignalDetails event={related} read={read.includes(related.id)} onRead={onRead}/></Suspense></details>)}
  </>
}
