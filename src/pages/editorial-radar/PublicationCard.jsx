import {lazy,Suspense,useEffect,useState} from 'react'
import Button from '../../design-system/Button'
import {EDITORIAL_STATES} from '../../lib/radar-editorial.js'
import {publicationMaterial} from '../../lib/radar-material.js'
import {FAMILIES} from './client.js'

const PublicationEvidence=lazy(()=>import('./PublicationEvidence.jsx'))
const PublicationActions=lazy(()=>import('./PublicationActions.jsx'))
export default function PublicationCard({group,read,onRead}) {
  const {event,assessment}=group,material=assessment.material
  const subject=new URLSearchParams(window.location.search).get('subject'),linked=group.events.some(e=>e.id===subject)&&subject!==event.id
  const [proofOpen,setProofOpen]=useState(linked),[draftOpen,setDraftOpen]=useState(false)
  useEffect(()=>{if(linked)setProofOpen(true)},[linked])
  const allRead=group.readIds.every(id=>read.includes(id)),facts=[...material.facts]
  for(const related of group.events.slice(1))for(const fact of publicationMaterial(related).facts)if(!facts.some(f=>f.text===fact.text))facts.push(fact)
  const useful=facts.filter(f=>f.text!==material.mainFact).slice(0,3)

  return <article id={`subject-${event.id}`} className={`radar-card ${group.events.length>1?'radar-group ':''}${allRead?'radar-card--read':''}`}>
    <div className="radar-card-top"><span className="radar-label">{FAMILIES[event.family]}</span><span className={`radar-maturity radar-maturity--${group.state}`}>{EDITORIAL_STATES[group.state]}</span>{!allRead&&<span className="radar-unread">Non lu</span>}</div>
    <h2>{event.title}</h2>
    <p className="radar-main-fact"><strong>{material.mainFact}</strong></p>
    <p className="radar-scope">{assessment.qualification.label} · Publication originale : {event.originalPublishedAt??event.publishedAt??'non documentée'}{event.originalPublishedAt&&event.publishedAt!==event.originalPublishedAt?` · Reprise : ${event.publishedAt}`:''} · Période : {event.referencePeriod??event.period}</p>
    {(event.financialChangeEvidence??event.changeEvidence)&&<p>Changement constaté entre {(event.financialChangeEvidence??event.changeEvidence).beforeCheckedAt} et {(event.financialChangeEvidence??event.changeEvidence).observedAt} ; date d’annonce inconnue.</p>}
    {event.effectiveAt&&<p>Entrée en vigueur documentée : {event.effectiveAt}.</p>}
    <p className="radar-now-reason"><strong>Pourquoi maintenant ?</strong> {material.nowReason}</p>
    {useful.length>0&&<ul className="radar-tweet-facts" aria-label="Faits utiles pour le tweet">{useful.map(fact=><li key={fact.id}>{fact.text}</li>)}</ul>}
    <p><strong>Public et périmètre :</strong> {material.population??event.scope}</p>
    {material.angle&&<p><strong>Angle :</strong> {material.angle}</p>}
    {material.question&&material.status==='sufficient'&&<p><strong>Discussion possible :</strong> {material.question}</p>}
    {material.status!=='sufficient'&&<p className="radar-warning">{material.status==='generic'?'Contenu général sans nouveauté établie.':'Matière à vérifier avant de préparer un tweet factuel.'}</p>}

    {event.publicationDateNote&&<p className="radar-warning">{event.publicationDateNote}</p>}
    {event.extraction?.status==='partial'&&<p className="radar-warning">Extraction partielle : les lignes non qualifiées restent en file.</p>}
    <div className="radar-actions"><a href={event.sourceUrl} target="_blank" rel="noreferrer">Voir la source principale ↗</a><Button onClick={()=>onRead(group.events.map(e=>e.id))} disabled={allRead}>{allRead?'Lu':group.events.length>1?'Marquer le sujet comme lu':'Marquer comme lu'}</Button></div>
    {material.status==='sufficient'&&<details className="radar-draft" onToggle={e=>{if(e.currentTarget.open)setDraftOpen(true)}}><summary>Préparer une publication</summary>{draftOpen&&<Suspense fallback={<p>Chargement de l’éditeur…</p>}><PublicationActions event={event} material={material} facts={useful}/></Suspense>}</details>}
    <details className="radar-proof" open={proofOpen} onToggle={e=>setProofOpen(e.currentTarget.open)}><summary>Sources, conditions et classement · {group.events.length} fait(s)</summary>{proofOpen&&<Suspense fallback={<p>Chargement des preuves…</p>}><PublicationEvidence group={group} read={read} onRead={onRead} subject={subject}/></Suspense>}</details>
  </article>
}
