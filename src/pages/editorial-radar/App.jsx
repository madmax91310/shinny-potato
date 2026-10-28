import {editorialTreatments,treatmentFor,saveTreatment,EDITORIAL_EVENT} from '../../lib/radar-workflow-state.js'
import PublicationCard from './PublicationCard.jsx'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { fetchRadar, markRead, readIds, READ_EVENT, staleFeed, cacheSignalGroups } from './client.js'
import './style.css'
import {useSearchParams} from 'react-router-dom'

const RadarSourceDetails = lazy(() => import('./RadarSourceDetails.jsx'))
const CalendarDetails = lazy(() => import('./CalendarDetails.jsx'))
const PurchasingNews = lazy(() => import('./PurchasingNews.jsx'))
const RadarFilters = lazy(() => import('./RadarFilters.jsx'))
const date=value=>value?new Intl.DateTimeFormat('fr-FR',{dateStyle:'short',timeStyle:'short',timeZone:'Europe/Paris'}).format(new Date(value)):'Non documenté'
export default function App() {
  const [treatments,setTreatments]=useState(editorialTreatments)
  const [params]=useSearchParams()
  const subject=params.get('subject')
  const [sourceOpen,setSourceOpen] = useState(false), [filtersOpen,setFiltersOpen]=useState(false), [calendarOpen,setCalendarOpen]=useState(false), [coverageOpen,setCoverageOpen]=useState(false)
  const [view, setView] = useState(subject ? 'history' : 'selection')
  const [feed, setFeed] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true)
  const [family, setFamily] = useState('all'), [topic, setTopic] = useState('all'), [mode, setMode] = useState('all'), [search, setSearch] = useState(''), [read, setRead] = useState(readIds), [message, setMessage] = useState('')
  const refresh = useCallback(async (signal) => {
    try {
      const next = await fetchRadar(signal)
      cacheSignalGroups(next.selection.ready.map(group=>group.readIds))
      setFeed(next); setError('')
    }
    catch (e) { if (e.name !== 'AbortError') setError(e.message) }
    finally { if (!signal?.aborted) setLoading(false) }
  }, [])
  useEffect(() => {
    let controller
    function poll() { controller?.abort(); controller = new AbortController(); refresh(controller.signal) }
    const updateRead = () => {setRead(readIds());setTreatments(editorialTreatments())}
    poll(); const timer = setInterval(poll, 300000)
    window.addEventListener(EDITORIAL_EVENT,updateRead); window.addEventListener(READ_EVENT, updateRead); window.addEventListener('storage', updateRead)
    return () => { clearInterval(timer); controller?.abort(); window.removeEventListener(EDITORIAL_EVENT,updateRead); window.removeEventListener(READ_EVENT, updateRead); window.removeEventListener('storage', updateRead) }
  }, [refresh])
  useEffect(() => {
    if (!subject || !feed) return
    const frame=requestAnimationFrame(()=>{
      const group=feed.selection.groups.find(g=>g.events.some(e=>e.id===subject))
      const target=document.getElementById(`subject-${subject}`)??(group&&document.getElementById(`subject-${group.event.id}`))
      if(!target)return
      for(let node=target.parentElement;node;node=node.parentElement)if(node.tagName==='DETAILS')node.open=true
      target.scrollIntoView({block:'start'})
    })
    return()=>cancelAnimationFrame(frame)
  },[feed,subject])
  function onRead(ids) { if (!markRead(Array.isArray(ids) ? ids : [ids])) setMessage('La mémorisation sur cet appareil est indisponible.') }
  const events = feed?.events ?? []
  const {groups,ready,selected}=feed?.selection??{groups:[],ready:[],selected:[]}
  function onTreatment(group,status){if(!saveTreatment(group.events.map(e=>e.id),status))setMessage('Sauvegarde impossible : le traitement du sujet n’a pas été modifié. Les données existantes sont conservées.');else setMessage(status==='active'?'Sujet remis dans les sujets à traiter.':status==='used'?'Sujet marqué comme exploité.':'Sujet écarté. Tu peux le retrouver et annuler cette action.')}
  const statusOf=group=>treatmentFor(group.events.map(e=>e.id),treatments)
  const selectionIds=new Set(selected.map(group=>group.id))
  const unread = ready.filter(group => statusOf(group)==='active' && group.readIds.some(id=>!read.includes(id))).length
  const watches = groups.filter(group => group.state === 'watch' && group.recent).length
  const secondary = groups.filter(group => group.state === 'secondary' && group.recent).length
  const matchesNews = item => (topic === 'all' || item.topic === topic) && `${item.label} ${item.summary} ${item.status}`.toLocaleLowerCase('fr-FR').includes(search.toLocaleLowerCase('fr-FR'))
  const newsItems = (feed?.purchasingPower?.items ?? []).filter(matchesNews)
  const filtered = groups.filter(group => group.events.some(event =>
    (family === 'all' || family === event.family) && (topic === 'all' || (event.topic ?? (event.family === 'economie' ? 'statistiques' : event.family === 'etf' ? 'etf' : null)) === topic) &&
    (mode !== 'unread' || !read.includes(event.id)) &&
    `${event.title} ${event.label} ${event.entity} ${event.angle} ${event.summary ?? ''}`.toLocaleLowerCase('fr-FR').includes(search.toLocaleLowerCase('fr-FR'))
  )).filter(group =>
    view === 'dismissed' || view === 'used' ? statusOf(group)===view : (view === 'history' || statusOf(group)==='active') && (view === 'history' || group.recent && (view === 'selection' ? selectionIds.has(group.id) : view === 'other' ? group.state === 'ready' && group.assessment.reliability.usable && !selectionIds.has(group.id) : group.state === view))
  )
  const displayed = filtered
  const displayedIds = displayed.flatMap(group => group.events.map(event => event.id))
  return <div className="radar-page">
    <PageHeader title="Radar éditorial" subtitle="Les changements concrets qui méritent un post." />

    <div className="radar-status"><p>Dernier contrôle : {date(feed?.checkedAt)}. Veille toutes les 30 minutes de 8 h à 20 h (Europe/Paris), selon les délais du planificateur, et après les collectes raccordées.</p><Button onClick={() => refresh()}>Actualiser</Button></div>
    {loading && <p role="status">Chargement des derniers signaux…</p>}
    {error && <p role="alert" className="radar-warning">{error}{feed ? ' Les derniers signaux chargés restent affichés.' : ''}</p>}
    {feed && staleFeed(feed) && <p role="status" className="radar-warning">Le dernier contrôle date de plus de 36 heures. Le radar ne peut pas confirmer l’absence de nouveautés.</p>}
    <div className="radar-choices radar-views" role="group" aria-label="Vue du radar">{Object.entries({ selection: 'Prioritaires', other: 'Autres sujets exploitables', watch: 'À suivre', secondary: 'Variations secondaires', dismissed:'Sujets écartés',used:'Sujets exploités',history: 'Historique complet' }).map(([id, label]) => <button key={id} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</div>
    <p className="radar-selection-note">{view === 'selection' ? `Jusqu’à 5 sujets à exploiter parmi les 14 derniers jours. Tous les autres sujets exploitables restent accessibles dans leur onglet. La sélection limite la place d’une même source.` : view === 'watch' ? 'Annonces à compléter et lancements annoncés. Un lancement ne garantit pas une disponibilité chez ton courtier.' : view === 'secondary' ? 'Variations techniques, révisions et extensions de couverture. Les évolutions majeures de composition peuvent être prioritaires.' : view === 'other' ? 'Les autres faits fiables et exploitables, classés avec les mêmes critères. Aucun sujet utile n’est caché derrière les cinq premières cartes.' : view==='dismissed'?'Les sujets écartés restent retrouvables. Annuler leur traitement les remet dans les sujets à traiter, sans modifier la lecture.':view==='used'?'Les sujets déjà exploités restent consultables. Leur traitement peut être annulé séparément de la lecture.':'Tous les signaux conservés dans le flux, y compris les anciens sujets.'}</p>
    <details className="radar-filter-panel" onToggle={e=>setFiltersOpen(e.currentTarget.open)}><summary>Filtrer les sujets</summary>{filtersOpen&&<Suspense fallback={<p>Chargement…</p>}><RadarFilters {...{family,setFamily,topic,setTopic,mode,setMode,search,setSearch,displayedIds,onRead,read}}/></Suspense>}</details>
    <p role="status">{message}</p>
    {feed && !filtered.length && <section className="radar-empty"><h2>{events.length ? 'Aucun signal pour cette sélection' : 'Le radar est en veille'}</h2><p>{events.length ? 'Aucun sujet ne correspond à cette vue et à ces filtres. Les annonces à compléter et les variations secondaires restent accessibles dans leurs onglets.' : 'Le premier relevé sert de référence. Les prochains changements pertinents apparaîtront ici automatiquement.'}</p></section>}
    {subject && <p><a href={`#subject-${subject}`}>Aller au sujet de la notification</a> · Les filtres permettent de retrouver les autres sujets.</p>}
    {feed?.calendar?.length > 0 && <details className="radar-coverage" onToggle={e=>setCalendarOpen(e.currentTarget.open)}><summary>Calendrier des dates annoncées</summary>{calendarOpen&&<Suspense fallback={<p>Chargement…</p>}><CalendarDetails feed={feed}/></Suspense>}</details>}
    <div className="radar-list">{displayed.map(group => <PublicationCard key={group.id} group={group} read={read} onRead={onRead} treatment={statusOf(group)} onTreatment={onTreatment} />)}</div>
    {family === 'pouvoir-achat' && view !== 'selection' && feed?.purchasingPower && <Suspense fallback={<p>Chargement de la veille…</p>}><PurchasingNews {...{feed,newsItems}}/></Suspense>}
    {view === 'selection' && ready.length > displayed.length && <Button onClick={() => setView('other')}>Voir les autres sujets exploitables ({ready.length - displayed.length})</Button>}
    <details className="radar-coverage"><summary>Vue d’ensemble et diagnostics</summary>
    {feed?.observationReviews?.length>0&&<details><summary>Photographies de composition en attente ou réexaminées ({feed.observationReviews.length})</summary><ul>{feed.observationReviews.map((r,i)=><li key={r.id??i}>{r.entity} · photographie du {r.period} · {r.reason} · {r.resolvedAt?'Reprise effectuée, preuve historique conservée':'En attente'}{r.sourceUrl&&<> · <a href={r.sourceUrl} target="_blank" rel="noreferrer">Source de l’observation</a></>}</li>)}</ul></details>}
    <section className="radar-overview" aria-label="État du radar"><div><strong>{unread}</strong><span>sujets à exploiter non lus</span></div><div><strong>{watches}</strong><span>sujets à suivre</span></div><div><strong>{secondary}</strong><span>variations secondaires</span></div></section>
    </details>
    {feed?.sources && <details className="radar-coverage" onToggle={e=>setSourceOpen(e.currentTarget.open)}><summary>Sources de publications et file de traitement</summary>{sourceOpen&&<Suspense fallback={<p>Chargement…</p>}><RadarSourceDetails feed={feed}/></Suspense>}</details>}
    {feed?.notifications && <p className={feed.notifications.status === 'error' ? 'radar-warning' : 'radar-scope'}>Notifications GitHub : {feed.notifications.status === 'error' ? 'en échec, reprise au prochain passage' : 'contrôle terminé'} · {feed.notifications.pending ?? 0} sujet(s) en attente. {feed.notifications.reason ?? ''} La réception sur téléphone dépend des réglages GitHub.</p>}
    <details className="radar-coverage" onToggle={e=>setCoverageOpen(e.currentTarget.open)}><summary>Ce que surveille le radar</summary>{coverageOpen&&<Suspense fallback={<p>Chargement…</p>}><RadarSourceDetails feed={feed} variant="coverage"/></Suspense>}</details>
    {feed?.errors.length > 0 && <details className="radar-coverage"><summary>{feed.errors.length} observations non exploitables · collecte à réparer</summary><ul>{feed.errors.slice(0, 30).map((issue, index) => <li key={index}>{issue.entity} : {issue.reason}</li>)}</ul><p>Ces observations ne produisent pas d’alerte éditoriale.</p></details>}
    <p className="radar-footnote">Lecture, sujets écartés et sujets exploités sont mémorisés séparément sur cet appareil. Ces choix restent locaux et ne modifient pas les notifications GitHub. Les brouillons restent à relire avant publication.</p>
  </div>
}
