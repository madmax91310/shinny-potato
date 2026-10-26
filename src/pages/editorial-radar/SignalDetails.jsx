import {FACT_LABELS} from './fact-labels.js'
import {editorialAudience} from './audience.js'
import {lazy,Suspense,useState} from 'react'
import Button from '../../design-system/Button'
import {factType,editorialAssessment,editorialState,etfAnnouncement,EDITORIAL_STATES} from '../../lib/radar-editorial.js'
import {FAMILIES} from './client.js'
import {formatRadarDate as date} from './presentation.js'
const RelatedStages=lazy(()=>import('./RelatedStages.jsx'))
const ScoreDetails=lazy(()=>import('./ScoreDetails.jsx'))
const EtfAnnouncement=lazy(()=>import('./EtfAnnouncement.jsx'))
const ConditionsDetails=lazy(()=>import('./ConditionsDetails.jsx'))
const HousingDetails=lazy(()=>import('./HousingDetails.jsx'))
export default function SignalDetails({ event, read, onRead }) {
  const announcement = event.announcementEvidence ?? etfAnnouncement(event.label)
  const [housingOpen,setHousingOpen]=useState(false), [scoreOpen,setScoreOpen]=useState(false)
  const [stagesOpen,setStagesOpen]=useState(false)
  return <article id={`proof-${event.id}`} className={`radar-card ${read ? 'radar-card--read' : ''}`}>
    <div className="radar-card-top"><span className="radar-label">{FAMILIES[event.family]}</span>{!read && <span className="radar-unread">Non lu</span>}<time dateTime={event.detectedAt}>{date(event.detectedAt)}</time></div>
    <span className={`radar-maturity radar-maturity--${editorialState(event)}`}>{EDITORIAL_STATES[editorialState(event)]}</span>
    <h3>{event.fieldLabel??event.title}</h3>
    {event.extraction?.status==='partial'&&<p className="radar-warning">Extraction partielle : {event.extraction.reason} Les lignes non qualifiées restent en file.</p>}
    {event.relatedStages?.length>0&&<details onToggle={e=>setStagesOpen(e.currentTarget.open)}><summary>Étapes liées et preuves</summary>{stagesOpen&&<Suspense fallback={<p>Chargement…</p>}><RelatedStages stages={event.relatedStages}/></Suspense>}</details>}
    {event.correctionPublishedAt&&<p>Correction sourcée : {event.correctionPublishedAt}</p>}
    {event.publicationDateNote&&<p className="radar-warning">{event.publicationDateNote}</p>}
    <p className="radar-scope">{FACT_LABELS[factType(event)]} · {editorialAssessment(event).qualification.label} · Publication : {event.publishedAt ?? 'date non documentée'} · Collecte : {date(event.checkedAt)}</p>
    <details className="radar-score" onToggle={e=>setScoreOpen(e.currentTarget.open)}><summary>Intérêt éditorial : {editorialAssessment(event).score}/100</summary>{scoreOpen&&<Suspense fallback={<p>Chargement…</p>}><ScoreDetails assessment={editorialAssessment(event)}/></Suspense>}</details>
    {event.evidenceLevel && <p className="radar-scope">Preuve : {({official:'Source officielle', 'professional-association':'Organisme professionnel identifié',journalistic:'Information journalistique attribuée ; confirmation officielle non établie'})[event.evidenceLevel]}</p>}
    {event.effectiveAt && <p><strong>Application annoncée : {event.effectiveAt}</strong> · La date de publication reste {event.publishedAt ?? 'inconnue'}.</p>}
    {event.promotionEndsAt && <p>Promotion temporaire jusqu’au {event.promotionEndsAt} ; conditions dans la source.</p>}
    {event.sources?.length > 1 && <details><summary>Sources et documents cités</summary><ul>{event.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a> · {source.role}</li>)}</ul></details>}
    <p className="radar-audience"><strong>Qui est concerné ?</strong> {editorialAudience(event)}</p>
    {(announcement||event.products?.length>0)&&<Suspense fallback={<p>Chargement…</p>}><EtfAnnouncement event={event} announcement={announcement}/></Suspense>}
    <p className="radar-entity">{event.family !== 'pouvoir-achat' && event.field !== 'announcement' && event.label} {/^[A-Z]{2}[A-Z0-9]{10}$/.test(event.entity) && <small>{event.entity}</small>}</p>
    {event.family === 'etf' && event.field === 'announcement' ? null : event.factType === 'statistical-publication' && event.summary ? <div className="radar-news-detail"><p><strong>Période des données : {event.referencePeriod ?? 'voir le résumé officiel'}</strong></p><blockquote>{event.summary}</blockquote></div> : event.family === 'pouvoir-achat' ? <div className="radar-news-detail"><p><strong>{event.topicLabel} · {event.status}</strong></p><p>{event.summary}</p>{event.originalLabel ? <details><summary>Lire le texte officiel</summary><p>{event.originalLabel}</p><p>{event.originalSummary}</p><p>{event.statusEvidence}</p></details> : event.statusEvidence && <p className="radar-scope">Formulation de la source : {event.statusEvidence}</p>}<p className="radar-scope">{event.publisher} · {event.changeEvidence ? `changement observé entre ${date(event.changeEvidence.beforeCheckedAt)} et ${date(event.changeEvidence.observedAt)} ; date d’annonce inconnue` : `publié le ${event.period}`}</p></div> : <div className="radar-comparison"><div><span>Avant · {event.beforePeriod ?? 'premier relevé'}</span><strong>{event.beforeText}</strong></div><div><span>Après · {event.period}</span><strong>{event.afterText}</strong></div></div>}
    {event.family !== 'pouvoir-achat' && <><p className="radar-scope">{event.scope}</p><p>{event.reason}</p></>}
    {event.conditions && <Suspense fallback={null}><ConditionsDetails conditions={event.conditions} changes={event.changeEvidence?.changes}/></Suspense>}
    {event.housing && <details onToggle={e=>setHousingOpen(e.currentTarget.open)}><summary>Conventions immobilières et scénario</summary>{housingOpen&&<Suspense fallback={<p>Chargement…</p>}><HousingDetails housing={event.housing}/></Suspense>}</details>}
    {event.evidence?.excerpt && <details className="radar-proof"><summary>Preuves de l’extraction</summary><blockquote>{event.evidence.excerpt}</blockquote><p className="radar-scope">{event.evidence.method} · Empreinte de la source : {event.evidence.sourceHash}</p></details>}
    <div className="radar-actions"><a href={event.sourceUrl} target="_blank" rel="noreferrer">Voir la source ↗</a>{event.documentUrl && event.documentUrl !== event.sourceUrl && <a href={event.documentUrl} target="_blank" rel="noreferrer">Communiqué émetteur ↗</a>}{event.previousSourceUrl && event.previousSourceUrl !== event.sourceUrl && <a href={event.previousSourceUrl} target="_blank" rel="noreferrer">Source précédente ↗</a>}<Button onClick={() => onRead(event.id)} disabled={read}>{read ? 'Lu' : 'Marquer comme lu'}</Button></div>
  </article>
}
