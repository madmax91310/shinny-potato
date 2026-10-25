import {FAMILIES} from './client.js'
import {EDITORIAL_STATES,editorialAudience} from '../../lib/radar-editorial.js'
import {formatRadarDate as date} from './presentation.js'
import Button from '../../design-system/Button'
export default function GroupDetails({group,read,onRead,renderSignal}){
  const allRead = group.events.every(event => read.includes(event.id))
  return <article className={`radar-card radar-group ${allRead ? 'radar-card--read' : ''}`}>
    <div className="radar-card-top"><span className="radar-label">{FAMILIES[group.event.family]}</span><span className={`radar-maturity radar-maturity--${group.state}`}>{EDITORIAL_STATES[group.state]}</span></div>
    <h2>{group.event.publicationId ? group.event.title : `${group.event.label} : ${group.events.length} changements regroupés`}</h2>
    <p>{group.event.reason}</p><p className="radar-scope">Intérêt éditorial : {group.assessment.score}/100 · {group.assessment.qualification.label}</p>{group.event.publicationDateNote&&<p className="radar-warning">{group.event.publicationDateNote}</p>}
    {group.event.publicationId && <><p className="radar-scope">Période des données : {group.event.referencePeriod ?? group.event.period} · Publication : {group.event.publishedAt ?? 'non documentée'} · Collecte : {date(group.event.checkedAt)}</p><p>{editorialAudience(group.event)}</p><a href={group.event.sourceUrl} target="_blank" rel="noreferrer">Voir la source principale ↗</a></>}
    <p>{group.event.eventKey ? 'Même événement, sources rapprochées sur une référence explicite' : group.event.publicationId ? 'Même publication officielle' : 'Même produit et même période'} : {group.event.period}. Chaque fait conserve sa source, son périmètre et son état de lecture.</p>
    {group.events.map(event => <details className="radar-related" key={event.id}><summary>{event.title}</summary>{renderSignal(event.id===group.event.id?group.event:event,read.includes(event.id))}</details>)}
    <Button onClick={() => onRead(group.events.map(event => event.id))} disabled={allRead}>{allRead ? 'Lu' : 'Marquer le sujet comme lu'}</Button>
  </article>
}
