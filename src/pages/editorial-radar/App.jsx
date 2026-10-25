import { editorialExclusion } from '../../lib/radar-policy.js'
import { readableSignal, formatRadarDate } from './presentation.js'
import { EDITORIAL_STATES, EDITORIAL_LIMIT, EDITORIAL_DAYS, FACT_LABELS, factType, editorialAssessment, selectEditorial, editorialState, editorialAudience, etfAnnouncement, groupSignals, recentEditorial, investorFilingType } from '../../lib/radar-editorial.js'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { fetchRadar, FAMILIES, markRead, readIds, READ_EVENT, staleFeed, cacheSignalGroups } from './client.js'
import './style.css'

const RadarSourceDetails = lazy(() => import('./RadarSourceDetails.jsx'))
const DraftEditor = lazy(() => import('./DraftEditor.jsx'))
const CalendarDetails = lazy(() => import('./CalendarDetails.jsx'))
const PurchasingNews = lazy(() => import('./PurchasingNews.jsx'))
const RadarFilters = lazy(() => import('./RadarFilters.jsx'))
const ScoreDetails = lazy(() => import('./ScoreDetails.jsx'))
const EtfAnnouncement = lazy(() => import('./EtfAnnouncement.jsx'))
const ConditionsDetails = lazy(() => import('./ConditionsDetails.jsx'))
const HousingDetails = lazy(() => import('./HousingDetails.jsx'))
const date = formatRadarDate
function Signal({ event, read, onRead }) {
  const announcement = event.announcementEvidence ?? etfAnnouncement(event.label)
  const filing = investorFilingType(event), canPublish = !filing || filing === 'publication'
  const [housingOpen,setHousingOpen]=useState(false), [scoreOpen,setScoreOpen]=useState(false)
  const [draftOpen,setDraftOpen]=useState(false)
  return <article id={`subject-${event.id}`} className={`radar-card ${read ? 'radar-card--read' : ''}`}>
    <div className="radar-card-top"><span className="radar-label">{FAMILIES[event.family]}</span>{!read && <span className="radar-unread">Non lu</span>}<time dateTime={event.detectedAt}>{date(event.detectedAt)}</time></div>
    <span className={`radar-maturity radar-maturity--${editorialState(event)}`}>{EDITORIAL_STATES[editorialState(event)]}</span>
    <h2>{event.title}</h2>
    {event.correctionPublishedAt&&<p>Correction sourcée : {event.correctionPublishedAt}</p>}
    {event.publicationDateNote&&<p className="radar-warning">{event.publicationDateNote}</p>}
    <p className="radar-scope">{FACT_LABELS[factType(event)]} · Publication : {event.publishedAt ?? 'date non documentée'} · Collecte : {date(event.checkedAt)}</p>
    <details className="radar-score" onToggle={e=>setScoreOpen(e.currentTarget.open)}><summary>Intérêt éditorial : {editorialAssessment(event).score}/100</summary>{scoreOpen&&<Suspense fallback={<p>Chargement…</p>}><ScoreDetails assessment={editorialAssessment(event)}/></Suspense>}</details>
    {event.evidenceLevel && <p className="radar-scope">Preuve : {({official:'Source officielle', 'professional-association':'Organisme professionnel identifié',journalistic:'Information journalistique attribuée ; confirmation officielle non établie'})[event.evidenceLevel]}</p>}
    {event.effectiveAt && <p><strong>Application annoncée : {event.effectiveAt}</strong> · La date de publication reste {event.publishedAt}.</p>}
    {event.promotionEndsAt && <p>Promotion temporaire jusqu’au {event.promotionEndsAt} ; conditions dans la source.</p>}
    {event.sources?.length > 1 && <details><summary>Sources et documents cités</summary><ul>{event.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a> · {source.role}</li>)}</ul></details>}
    <p className="radar-audience"><strong>Qui est concerné ?</strong> {editorialAudience(event)}</p>
    {(announcement||event.products?.length>0)&&<Suspense fallback={<p>Chargement…</p>}><EtfAnnouncement event={event} announcement={announcement}/></Suspense>}
    <p className="radar-entity">{event.family !== 'pouvoir-achat' && event.field !== 'announcement' && event.label} {/^[A-Z]{2}[A-Z0-9]{10}$/.test(event.entity) && <small>{event.entity}</small>}</p>
    {event.family === 'etf' && event.field === 'announcement' ? null : event.factType === 'statistical-publication' && event.summary ? <div className="radar-news-detail"><p><strong>Période des données : {event.referencePeriod ?? 'voir le résumé officiel'}</strong></p><blockquote>{event.summary}</blockquote></div> : event.family === 'pouvoir-achat' ? <div className="radar-news-detail"><p><strong>{event.topicLabel} · {event.status}</strong></p><p>{event.summary}</p>{event.originalLabel ? <details><summary>Lire le texte officiel</summary><p>{event.originalLabel}</p><p>{event.originalSummary}</p><p>{event.statusEvidence}</p></details> : event.statusEvidence && <p className="radar-scope">Formulation de la source : {event.statusEvidence}</p>}<p className="radar-scope">{event.publisher} · publié le {event.period}</p></div> : <div className="radar-comparison"><div><span>Avant · {event.beforePeriod ?? 'premier relevé'}</span><strong>{event.beforeText}</strong></div><div><span>Après · {event.period}</span><strong>{event.afterText}</strong></div></div>}
    {event.family !== 'pouvoir-achat' && <><p className="radar-scope">{event.scope}</p><p>{event.reason}</p></>}
    {event.conditions && <Suspense fallback={null}><ConditionsDetails conditions={event.conditions}/></Suspense>}
    {event.housing && <details onToggle={e=>setHousingOpen(e.currentTarget.open)}><summary>Conventions immobilières et scénario</summary>{housingOpen&&<Suspense fallback={<p>Chargement…</p>}><HousingDetails housing={event.housing}/></Suspense>}</details>}
    {event.evidence?.excerpt && <details className="radar-proof"><summary>Preuves de l’extraction</summary><blockquote>{event.evidence.excerpt}</blockquote><p className="radar-scope">{event.evidence.method} · Empreinte de la source : {event.evidence.sourceHash}</p></details>}
    <div className="radar-angle"><strong>{canPublish ? 'Une piste pour ton post' : 'Point à vérifier'}</strong><p>{event.angle}</p></div>
    <div className="radar-actions"><a href={event.sourceUrl} target="_blank" rel="noreferrer">Voir la source ↗</a>{event.documentUrl && event.documentUrl !== event.sourceUrl && <a href={event.documentUrl} target="_blank" rel="noreferrer">Communiqué émetteur ↗</a>}{event.previousSourceUrl && event.previousSourceUrl !== event.sourceUrl && <a href={event.previousSourceUrl} target="_blank" rel="noreferrer">Source précédente ↗</a>}{event.tool && <Link to={event.tool}>Ouvrir l’outil</Link>}<Button onClick={() => onRead(event.id)} disabled={read}>{read ? 'Lu' : 'Marquer comme lu'}</Button></div>
    {canPublish && <details className="radar-draft" onToggle={e=>{if(e.currentTarget.open)setDraftOpen(true)}}><summary>Préparer une publication</summary>{draftOpen&&<Suspense fallback={<p>Chargement…</p>}><DraftEditor event={event}/></Suspense>}</details>}
  </article>
}
function SignalGroup({ group, read, onRead }) {
  if (group.events.length === 1) return <Signal event={group.event} read={read.includes(group.event.id)} onRead={onRead} />
  const allRead = group.events.every(event => read.includes(event.id))
  return <article className={`radar-card radar-group ${allRead ? 'radar-card--read' : ''}`}>
    <div className="radar-card-top"><span className="radar-label">{FAMILIES[group.event.family]}</span><span className={`radar-maturity radar-maturity--${group.state}`}>{EDITORIAL_STATES[group.state]}</span></div>
    <h2>{group.event.publicationId ? group.event.title : `${group.event.label} : ${group.events.length} changements regroupés`}</h2>
    <p>{group.event.reason}</p>
    {group.event.publicationId && <><p className="radar-scope">Période des données : {group.event.referencePeriod ?? group.event.period} · Publication : {group.event.publishedAt ?? 'non documentée'} · Collecte : {date(group.event.checkedAt)}</p><p>{editorialAudience(group.event)}</p><a href={group.event.sourceUrl} target="_blank" rel="noreferrer">Voir la publication officielle ↗</a></>}
    <p>{group.event.eventKey ? 'Même événement, sources rapprochées sur une référence explicite' : group.event.publicationId ? 'Même publication officielle' : 'Même produit et même période'} : {group.event.period}. Chaque fait conserve sa source, son périmètre et son état de lecture.</p>
    {group.events.map(event => <details className="radar-related" key={event.id}><summary>{event.title}</summary><Signal event={event} read={read.includes(event.id)} onRead={onRead} /></details>)}
    <Button onClick={() => onRead(group.events.map(event => event.id))} disabled={allRead}>{allRead ? 'Lu' : 'Marquer le sujet comme lu'}</Button>
  </article>
}
export default function App() {
  const subject = new URLSearchParams(window.location.search).get('subject')
  const [sourceOpen,setSourceOpen] = useState(false), [filtersOpen,setFiltersOpen]=useState(false), [calendarOpen,setCalendarOpen]=useState(false), [coverageOpen,setCoverageOpen]=useState(false)
  const [view, setView] = useState(subject ? 'history' : 'selection')
  const [feed, setFeed] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true)
  const [family, setFamily] = useState('all'), [topic, setTopic] = useState('all'), [mode, setMode] = useState('all'), [search, setSearch] = useState(''), [read, setRead] = useState(readIds), [message, setMessage] = useState('')
  const refresh = useCallback(async (signal) => {
    try {
      const next = await fetchRadar(signal)
      cacheSignalGroups(groupSignals(next.events.filter(event => editorialState(event) === 'ready' && recentEditorial(event))).map(group => group.events.map(event => event.id)))
      setFeed(next); setError('')
    }
    catch (e) { if (e.name !== 'AbortError') setError(e.message) }
    finally { if (!signal?.aborted) setLoading(false) }
  }, [])
  useEffect(() => {
    let controller
    function poll() { controller?.abort(); controller = new AbortController(); refresh(controller.signal) }
    const updateRead = () => setRead(readIds())
    poll(); const timer = setInterval(poll, 300000)
    window.addEventListener(READ_EVENT, updateRead); window.addEventListener('storage', updateRead)
    return () => { clearInterval(timer); controller?.abort(); window.removeEventListener(READ_EVENT, updateRead); window.removeEventListener('storage', updateRead) }
  }, [refresh])
  useEffect(() => {
    if (!subject || !feed) return
    const frame=requestAnimationFrame(()=>{
      const target=document.getElementById(`subject-${subject}`)
      if(!target)return
      for(let node=target.parentElement;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true
      target.scrollIntoView({block:'start'})
    })
    return()=>cancelAnimationFrame(frame)
  },[feed,subject])
  function onRead(ids) { if (!markRead(Array.isArray(ids) ? ids : [ids])) setMessage('La mémorisation sur cet appareil est indisponible.') }
  const events = (feed?.events ?? []).filter(event => !event.editorialExcluded && !editorialExclusion(event)).map(readableSignal)
  const groups = groupSignals(events)
  const ready = groups.filter(group => group.state === 'ready' && group.assessment.reliability.usable && recentEditorial(group.event))
  const selection = selectEditorial(ready.filter(group => group.assessment.priority))
  const selectionIds = new Set(selection.selected.map(group => group.id))
  const unread = ready.filter(group => group.events.some(event => !read.includes(event.id))).length
  const watches = groups.filter(group => group.state === 'watch' && recentEditorial(group.event)).length
  const secondary = groups.filter(group => group.state === 'secondary' && recentEditorial(group.event)).length
  const matchesNews = item => (topic === 'all' || item.topic === topic) && `${item.label} ${item.summary} ${item.status}`.toLocaleLowerCase('fr-FR').includes(search.toLocaleLowerCase('fr-FR'))
  const newsItems = (feed?.purchasingPower?.items ?? []).filter(item=>!editorialExclusion(item)).filter(matchesNews)
  const filtered = groups.filter(group => group.events.some(event =>
    (family === 'all' || family === event.family) && (topic === 'all' || (event.topic ?? (event.family === 'economie' ? 'statistiques' : event.family === 'etf' ? 'etf' : null)) === topic) &&
    (mode !== 'unread' || !read.includes(event.id)) &&
    `${event.title} ${event.label} ${event.entity} ${event.angle} ${event.summary ?? ''}`.toLocaleLowerCase('fr-FR').includes(search.toLocaleLowerCase('fr-FR'))
  )).filter(group =>
    view === 'history' || recentEditorial(group.event) && (view === 'selection' ? selectionIds.has(group.id) : view === 'other' ? group.state === 'ready' && group.assessment.reliability.usable && !selectionIds.has(group.id) : group.state === view)
  )
  const displayed = filtered
  const displayedIds = displayed.flatMap(group => group.events.map(event => event.id))
  return <div className="radar-page">
    <PageHeader title="Radar éditorial" subtitle="Les changements concrets qui méritent un post." />
    <section className="radar-overview" aria-label="État du radar"><div><strong>{unread}</strong><span>sujets à exploiter non lus</span></div><div><strong>{watches}</strong><span>sujets à suivre</span></div><div><strong>{secondary}</strong><span>variations secondaires</span></div></section>
    <div className="radar-status"><p>Dernier contrôle : {date(feed?.checkedAt)}. Veille toutes les 30 minutes de 8 h à 20 h (Europe/Paris), selon les délais du planificateur, et après les collectes raccordées.</p><Button onClick={() => refresh()}>Actualiser</Button></div>
    {loading && <p role="status">Chargement des derniers signaux…</p>}
    {error && <p role="alert" className="radar-warning">{error}{feed ? ' Les derniers signaux chargés restent affichés.' : ''}</p>}
    {feed && staleFeed(feed) && <p role="status" className="radar-warning">Le dernier contrôle date de plus de 36 heures. Le radar ne peut pas confirmer l’absence de nouveautés.</p>}
    <div className="radar-choices radar-views" role="group" aria-label="Vue du radar">{Object.entries({ selection: 'Prioritaires', other: 'Autres sujets exploitables', watch: 'À suivre', secondary: 'Variations secondaires', history: 'Historique complet' }).map(([id, label]) => <button key={id} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</div>
    <p className="radar-selection-note">{view === 'selection' ? `Jusqu’à ${EDITORIAL_LIMIT} sujets à exploiter parmi les ${EDITORIAL_DAYS} derniers jours. Tous les autres sujets exploitables restent accessibles dans leur onglet. La sélection limite la place d’une même source.` : view === 'watch' ? 'Annonces à compléter et lancements annoncés. Un lancement ne garantit pas une disponibilité chez ton courtier.' : view === 'secondary' ? 'Variations techniques, révisions et extensions de couverture. Les évolutions majeures de composition peuvent être prioritaires.' : view === 'other' ? 'Les autres faits fiables et exploitables, classés avec les mêmes critères. Aucun sujet utile n’est caché derrière les cinq premières cartes.' : 'Tous les signaux conservés dans le flux, y compris les anciens sujets.'}</p>
    <details className="radar-filter-panel" onToggle={e=>setFiltersOpen(e.currentTarget.open)}><summary>Filtrer les sujets</summary>{filtersOpen&&<Suspense fallback={<p>Chargement…</p>}><RadarFilters {...{family,setFamily,topic,setTopic,mode,setMode,search,setSearch,displayedIds,onRead,read}}/></Suspense>}</details>
    <p role="status">{message}</p>
    {feed && !filtered.length && <section className="radar-empty"><h2>{events.length ? 'Aucun signal pour cette sélection' : 'Le radar est en veille'}</h2><p>{events.length ? 'Aucun sujet ne correspond à cette vue et à ces filtres. Les annonces à compléter et les variations secondaires restent accessibles dans leurs onglets.' : 'Le premier relevé sert de référence. Les prochains changements pertinents apparaîtront ici automatiquement.'}</p></section>}
    {subject && <p><a href={`#subject-${subject}`}>Aller au sujet de la notification</a> · Les filtres permettent de retrouver les autres sujets.</p>}
    {feed?.calendar?.length > 0 && <details className="radar-coverage" onToggle={e=>setCalendarOpen(e.currentTarget.open)}><summary>Calendrier des dates annoncées</summary>{calendarOpen&&<Suspense fallback={<p>Chargement…</p>}><CalendarDetails feed={feed}/></Suspense>}</details>}
    <div className="radar-list">{displayed.map(group => <SignalGroup key={group.id} group={group} read={read} onRead={onRead} />)}</div>
    {family === 'pouvoir-achat' && view !== 'selection' && feed?.purchasingPower && <Suspense fallback={<p>Chargement de la veille…</p>}><PurchasingNews {...{feed,newsItems}}/></Suspense>}
    {view === 'selection' && ready.length > displayed.length && <Button onClick={() => setView('other')}>Voir les autres sujets exploitables ({ready.length - displayed.length})</Button>}
    {feed?.sources && <details className="radar-coverage" onToggle={e=>setSourceOpen(e.currentTarget.open)}><summary>Sources de publications et file de traitement</summary>{sourceOpen&&<Suspense fallback={<p>Chargement…</p>}><RadarSourceDetails feed={feed}/></Suspense>}</details>}
    {feed?.notifications && <p className={feed.notifications.status === 'error' ? 'radar-warning' : 'radar-scope'}>Notifications GitHub : {feed.notifications.status === 'error' ? 'en échec, reprise au prochain passage' : 'contrôle terminé'} · {feed.notifications.pending ?? 0} sujet(s) en attente. {feed.notifications.reason ?? ''} La réception sur téléphone dépend des réglages GitHub.</p>}
    <details className="radar-coverage" onToggle={e=>setCoverageOpen(e.currentTarget.open)}><summary>Ce que surveille le radar</summary>{coverageOpen&&<Suspense fallback={<p>Chargement…</p>}><RadarSourceDetails feed={feed} variant="coverage"/></Suspense>}</details>
    {feed?.errors.length > 0 && <details className="radar-coverage"><summary>{feed.errors.length} observations non exploitables · collecte à réparer</summary><ul>{feed.errors.slice(0, 30).map((issue, index) => <li key={index}>{issue.entity} : {issue.reason}</li>)}</ul><p>Ces observations ne produisent pas d’alerte éditoriale.</p></details>}
    <p className="radar-footnote">Les états lus sont mémorisés sur cet appareil. Les brouillons restent à relire avant publication.</p>
  </div>
}
