import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { fetchRadar, FAMILIES, markRead, readIds, READ_EVENT, staleFeed } from './client.js'
import './style.css'

const date = value => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(value)) : 'Non documenté'
function Signal({ event, read, onRead }) {
  const [draft, setDraft] = useState(event.draft), [message, setMessage] = useState('')
  async function copy() {
    try { await navigator.clipboard.writeText(draft); setMessage('Brouillon copié.') } catch { setMessage('Copie indisponible : sélectionne le texte du brouillon.') }
  }
  return <article className={`radar-card ${read ? 'radar-card--read' : ''}`}>
    <div className="radar-card-top"><span className="radar-label">{FAMILIES[event.family]}</span>{!read && <span className="radar-unread">Non lu</span>}<time dateTime={event.detectedAt}>{date(event.detectedAt)}</time></div>
    <h2>{event.title}</h2>
    <p className="radar-entity">{event.label} {/^[A-Z]{2}[A-Z0-9]{10}$/.test(event.entity) && <small>{event.entity}</small>}</p>
    <div className="radar-comparison"><div><span>Avant · {event.beforePeriod ?? 'premier relevé'}</span><strong>{event.beforeText}</strong></div><div><span>Après · {event.period}</span><strong>{event.afterText}</strong></div></div>
    <p className="radar-scope">{event.scope}</p>
    <p>{event.reason}</p>
    <div className="radar-angle"><strong>Une piste pour ton post</strong><p>{event.angle}</p></div>
    <div className="radar-actions"><a href={event.sourceUrl} target="_blank" rel="noreferrer">Voir la source ↗</a>{event.previousSourceUrl && event.previousSourceUrl !== event.sourceUrl && <a href={event.previousSourceUrl} target="_blank" rel="noreferrer">Source précédente ↗</a>}<Link to={event.tool}>Ouvrir l’outil</Link><Button onClick={() => onRead(event.id)} disabled={read}>{read ? 'Lu' : 'Marquer comme lu'}</Button></div>
    <details className="radar-draft"><summary>Préparer une publication</summary><label>Brouillon de publication<textarea aria-label={`Brouillon ${event.id}`} value={draft} onChange={e => setDraft(e.target.value)} rows={8} /></label><div className="radar-actions"><Button onClick={copy}>Copier le brouillon</Button><Button onClick={() => setDraft(event.draft)}>Rétablir le texte</Button></div><p role="status">{message}</p></details>
  </article>
}
export default function App() {
  const [feed, setFeed] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true)
  const [family, setFamily] = useState('all'), [mode, setMode] = useState('all'), [search, setSearch] = useState(''), [read, setRead] = useState(readIds), [message, setMessage] = useState('')
  const refresh = useCallback(async (signal) => {
    try { const next = await fetchRadar(signal); setFeed(next); setError('') }
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
  function onRead(ids) { if (!markRead(Array.isArray(ids) ? ids : [ids])) setMessage('La mémorisation sur cet appareil est indisponible.') }
  const events = feed?.events ?? [], unread = events.filter(event => !read.includes(event.id)).length
  const filtered = events.filter(event => (family === 'all' || family === event.family) && (mode !== 'unread' || !read.includes(event.id)) && `${event.title} ${event.entity} ${event.angle}`.toLocaleLowerCase('fr-FR').includes(search.toLocaleLowerCase('fr-FR')))
  return <div className="radar-page">
    <PageHeader title="Radar éditorial" subtitle="Les changements qui peuvent devenir tes prochains posts." />
    <section className="radar-overview" aria-label="État du radar"><div><strong>{unread}</strong><span>signaux non lus</span></div><div><strong>{events.length}</strong><span>signaux dans l’historique</span></div><div><strong>{feed ? Object.values(feed.coverage).reduce((a, b) => a + b, 0) : '—'}</strong><span>sujets suivis</span></div></section>
    <div className="radar-status"><p>Dernier contrôle : {date(feed?.checkedAt)}. Relevé automatique chaque jour et après les collectes raccordées.</p><Button onClick={() => refresh()}>Actualiser</Button></div>
    {loading && <p role="status">Chargement des derniers signaux…</p>}
    {error && <p role="alert" className="radar-warning">{error}{feed ? ' Les derniers signaux chargés restent affichés.' : ''}</p>}
    {feed && staleFeed(feed) && <p role="status" className="radar-warning">Le dernier contrôle date de plus de 36 heures. Le radar ne peut pas confirmer l’absence de nouveautés.</p>}
    <div className="radar-filters"><div className="radar-choices" role="group" aria-label="Catégorie"><button aria-pressed={family === 'all'} onClick={() => setFamily('all')}>Tout</button>{Object.entries(FAMILIES).map(([id, label]) => <button key={id} aria-pressed={family === id} onClick={() => setFamily(id)}>{label}</button>)}</div><div className="radar-choices" role="group" aria-label="Lecture"><button aria-pressed={mode === 'all'} onClick={() => setMode('all')}>Tous les signaux</button><button aria-pressed={mode === 'unread'} onClick={() => setMode('unread')}>Non lus</button></div><label>Rechercher<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Un ETF, un courtier, un sujet…" /></label><Button onClick={() => onRead(filtered.map(event => event.id))} disabled={!filtered.some(event => !read.includes(event.id))}>Marquer la sélection comme lue</Button></div>
    <p role="status">{message}</p>
    {feed && !filtered.length && <section className="radar-empty"><h2>{events.length ? 'Aucun signal pour cette sélection' : 'Le radar est en veille'}</h2><p>{events.length ? 'Change les filtres pour retrouver les autres signaux.' : 'Le premier relevé sert de référence. Les prochains changements pertinents apparaîtront ici automatiquement.'}</p></section>}
    <div className="radar-list">{filtered.map(event => <Signal key={event.id} event={event} read={read.includes(event.id)} onRead={onRead} />)}</div>
    <details className="radar-coverage"><summary>Ce que surveille le radar</summary><ul>{Object.entries(FAMILIES).map(([id, label]) => <li key={id}>{label} : {feed?.coverage[id] ?? '—'} sujets</li>)}</ul><p>Frais : toute modification confirmée. Compositions : au moins 2 points cumulés. Encours : au moins 20 % cumulés, sans les assimiler à des flux. Déclarations 13F : nouvelles périodes et mouvements déclarés, sans déduire les achats des poids.</p><p>{feed?.scopeNote ?? 'Le radar surveille les sources et produits raccordés à l’application.'}</p><p>Une collecte en échec conserve les dernières données validées. Un changement de format de la source peut nécessiter une réparation du collecteur.</p><Link to="/donnees-a-revoir">Voir les échecs de collecte</Link></details>
    {feed?.errors.length > 0 && <details className="radar-coverage"><summary>{feed.errors.length} observations non exploitables</summary><ul>{feed.errors.slice(0, 30).map((issue, index) => <li key={index}>{issue.entity} : {issue.reason}</li>)}</ul><p>Ces observations ne produisent pas d’alerte éditoriale.</p></details>}
    <p className="radar-footnote">Les états lus sont mémorisés sur cet appareil. Les brouillons restent à relire avant publication.</p>
  </div>
}
