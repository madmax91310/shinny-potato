import { readableSignal } from './presentation.js'
import { EDITORIAL_STATES, EDITORIAL_LIMIT, EDITORIAL_DAYS, FACT_LABELS, factType, editorialAssessment, selectEditorial, editorialState, editorialAudience, etfAnnouncement, groupSignals, recentEditorial, investorFilingType } from '../../lib/radar-editorial.js'
import { notifyPublication, copyPublicationText } from '../../design-system/publicationActions.js'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { fetchRadar, FAMILIES, markRead, readIds, READ_EVENT, staleFeed, cacheSignalGroups } from './client.js'
import './style.css'

const date = value => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(value)) : 'Non documenté'
function Signal({ event, read, onRead }) {
  const announcement = event.announcementEvidence ?? etfAnnouncement(event.label)
  const filing = investorFilingType(event), canPublish = !filing || filing === 'publication'
  const [draft, setDraft] = useState(event.draft), [message, setMessage] = useState('')
  async function copy() {
    try { await copyPublicationText(draft); setMessage('Brouillon copié.') } catch { setMessage('Copie indisponible : sélectionne le texte du brouillon.') }
  }
  return <article className={`radar-card ${read ? 'radar-card--read' : ''}`}>
    <div className="radar-card-top"><span className="radar-label">{FAMILIES[event.family]}</span>{!read && <span className="radar-unread">Non lu</span>}<time dateTime={event.detectedAt}>{date(event.detectedAt)}</time></div>
    <span className={`radar-maturity radar-maturity--${editorialState(event)}`}>{EDITORIAL_STATES[editorialState(event)]}</span>
    <h2>{event.title}</h2>
    <p className="radar-scope">{FACT_LABELS[factType(event)]} · Publication : {event.publishedAt ?? 'date non documentée'} · Collecte : {date(event.checkedAt)}</p>
    <details className="radar-score"><summary>Intérêt éditorial : {editorialAssessment(event).score}/100</summary><ul>{editorialAssessment(event).criteria.map(row => <li key={row.key}>{row.reason} : {row.points}/{row.maximum}{row.unknown ? ' · inconnu' : ''}</li>)}</ul><p>La fiabilité du fait est vérifiée séparément. Ce score ne prédit pas les vues.</p></details>
    <p className="radar-audience"><strong>Qui est concerné ?</strong> {editorialAudience(event)}</p>
    {event.family === 'etf' && event.field === 'announcement' && announcement && <div className="radar-launch"><strong>{announcement.label}</strong><p>{event.products?.length ? `${event.products.length} produits ou parts nommés dans le communiqué.` : event.label}</p>{event.calendarEvidence && <blockquote>{event.calendarEvidence}</blockquote>}<p>Annonce officielle du {event.period}. La disponibilité en France et chez ton courtier reste à vérifier dans le document émetteur.</p><dl>{Object.entries({ ISIN: event.launchDetails?.isin, Indice: event.launchDetails?.index, 'Frais annuels': event.launchDetails?.fees, PEA: event.launchDetails?.pea, Revenus: event.launchDetails?.distribution, 'Date de négociation': event.launchDetails?.tradingDate }).filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p className="radar-scope">Seules les caractéristiques explicitement récupérées sont affichées.</p></div>}
    {event.products?.length > 0 && <div className="radar-products">{event.products.map((product, index) => <details key={`${product.isin ?? product.name}-${index}`}><summary>{product.name}</summary><dl>{Object.entries({ ISIN: product.isin, Indice: product.index, Gestion: product.management, Frais: product.fees, Revenus: product.distribution, PEA: product.pea, 'Première cotation': product.tradingDate, 'Disponibilité commerciale': product.availability }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value ?? 'Non documenté'}</dd></div>)}</dl><blockquote>{product.evidence}</blockquote></details>)}</div>}
    <p className="radar-entity">{event.family !== 'pouvoir-achat' && event.field !== 'announcement' && event.label} {/^[A-Z]{2}[A-Z0-9]{10}$/.test(event.entity) && <small>{event.entity}</small>}</p>
    {event.family === 'etf' && event.field === 'announcement' ? null : event.factType === 'statistical-publication' && event.summary ? <div className="radar-news-detail"><p><strong>Période des données : {event.referencePeriod ?? 'voir le résumé officiel'}</strong></p><blockquote>{event.summary}</blockquote></div> : event.family === 'pouvoir-achat' ? <div className="radar-news-detail"><p><strong>{event.topicLabel} · {event.status}</strong></p><p>{event.summary}</p>{event.originalLabel ? <details><summary>Lire le texte officiel</summary><p>{event.originalLabel}</p><p>{event.originalSummary}</p><p>{event.statusEvidence}</p></details> : event.statusEvidence && <p className="radar-scope">Formulation de la source : {event.statusEvidence}</p>}<p className="radar-scope">{event.publisher} · publié le {event.period}</p></div> : <div className="radar-comparison"><div><span>Avant · {event.beforePeriod ?? 'premier relevé'}</span><strong>{event.beforeText}</strong></div><div><span>Après · {event.period}</span><strong>{event.afterText}</strong></div></div>}
    {event.family !== 'pouvoir-achat' && <><p className="radar-scope">{event.scope}</p><p>{event.reason}</p></>}
    {event.evidence?.excerpt && <details className="radar-proof"><summary>Preuves de l’extraction</summary><blockquote>{event.evidence.excerpt}</blockquote><p className="radar-scope">{event.evidence.method} · Empreinte de la source : {event.evidence.sourceHash}</p></details>}
    <div className="radar-angle"><strong>{canPublish ? 'Une piste pour ton post' : 'Point à vérifier'}</strong><p>{event.angle}</p></div>
    <div className="radar-actions"><a href={event.sourceUrl} target="_blank" rel="noreferrer">Voir la source ↗</a>{event.documentUrl && event.documentUrl !== event.sourceUrl && <a href={event.documentUrl} target="_blank" rel="noreferrer">Communiqué émetteur ↗</a>}{event.previousSourceUrl && event.previousSourceUrl !== event.sourceUrl && <a href={event.previousSourceUrl} target="_blank" rel="noreferrer">Source précédente ↗</a>}{event.tool && <Link to={event.tool}>Ouvrir l’outil</Link>}<Button onClick={() => onRead(event.id)} disabled={read}>{read ? 'Lu' : 'Marquer comme lu'}</Button></div>
    {canPublish && <details className="radar-draft"><summary>Préparer une publication</summary><label>Brouillon de publication<textarea aria-label={`Brouillon ${event.id}`} value={draft} onChange={e => setDraft(e.target.value)} rows={8} /></label><div className="radar-actions"><Button onClick={copy}>Copier le brouillon</Button><Button onClick={() => { setDraft(event.draft); notifyPublication('Texte d’origine rétabli.') }}>Rétablir le texte</Button></div><p>{message}</p></details>}
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
    <p>{group.event.publicationId ? 'Même publication officielle' : 'Même produit et même période'} : {group.event.period}. Chaque fait conserve sa source, son périmètre et son état de lecture.</p>
    {group.events.map(event => <details className="radar-related" key={event.id}><summary>{event.title}</summary><Signal event={event} read={read.includes(event.id)} onRead={onRead} /></details>)}
    <Button onClick={() => onRead(group.events.map(event => event.id))} disabled={allRead}>{allRead ? 'Lu' : 'Marquer le sujet comme lu'}</Button>
  </article>
}
export default function App() {
  const [view, setView] = useState('selection')
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
  function onRead(ids) { if (!markRead(Array.isArray(ids) ? ids : [ids])) setMessage('La mémorisation sur cet appareil est indisponible.') }
  const events = (feed?.events ?? []).map(readableSignal)
  const groups = groupSignals(events)
  const ready = groups.filter(group => group.state === 'ready' && group.assessment.reliability.usable && recentEditorial(group.event))
  const selection = selectEditorial(ready.filter(group => group.assessment.priority))
  const selectionIds = new Set(selection.selected.map(group => group.id))
  const unread = ready.filter(group => group.events.some(event => !read.includes(event.id))).length
  const watches = groups.filter(group => group.state === 'watch' && recentEditorial(group.event)).length
  const secondary = groups.filter(group => group.state === 'secondary' && recentEditorial(group.event)).length
  const matchesNews = item => (topic === 'all' || item.topic === topic) && `${item.label} ${item.summary} ${item.status}`.toLocaleLowerCase('fr-FR').includes(search.toLocaleLowerCase('fr-FR'))
  const newsItems = (feed?.purchasingPower?.items ?? []).filter(matchesNews)
  const filtered = groups.map(group => ({ ...group, events: group.events.filter(event =>
    (family === 'all' || family === event.family) && (event.family !== 'pouvoir-achat' || topic === 'all' || event.topic === topic) &&
    (mode !== 'unread' || !read.includes(event.id)) &&
    `${event.title} ${event.label} ${event.entity} ${event.angle} ${event.summary ?? ''}`.toLocaleLowerCase('fr-FR').includes(search.toLocaleLowerCase('fr-FR'))
  ) })).filter(group => group.events.length).map(group => ({ ...group, event: group.events[0] })).filter(group =>
    view === 'history' || recentEditorial(group.event) && (view === 'selection' ? selectionIds.has(group.id) : view === 'other' ? group.state === 'ready' && group.assessment.reliability.usable && !selectionIds.has(group.id) : group.state === view)
  )
  const displayed = filtered
  const displayedIds = displayed.flatMap(group => group.events.map(event => event.id))
  return <div className="radar-page">
    <PageHeader title="Radar éditorial" subtitle="Les changements concrets qui méritent un post." />
    <section className="radar-overview" aria-label="État du radar"><div><strong>{unread}</strong><span>sujets à exploiter non lus</span></div><div><strong>{watches}</strong><span>sujets à suivre</span></div><div><strong>{secondary}</strong><span>variations secondaires</span></div></section>
    <div className="radar-status"><p>Dernier contrôle : {date(feed?.checkedAt)}. Veille horaire de 8 h à 20 h (Europe/Paris), selon les délais du planificateur, et après les collectes raccordées.</p><Button onClick={() => refresh()}>Actualiser</Button></div>
    {loading && <p role="status">Chargement des derniers signaux…</p>}
    {error && <p role="alert" className="radar-warning">{error}{feed ? ' Les derniers signaux chargés restent affichés.' : ''}</p>}
    {feed && staleFeed(feed) && <p role="status" className="radar-warning">Le dernier contrôle date de plus de 36 heures. Le radar ne peut pas confirmer l’absence de nouveautés.</p>}
    <div className="radar-choices radar-views" role="group" aria-label="Vue du radar">{Object.entries({ selection: 'Prioritaires', other: 'Autres sujets exploitables', watch: 'À suivre', secondary: 'Variations secondaires', history: 'Historique complet' }).map(([id, label]) => <button key={id} aria-pressed={view === id} onClick={() => setView(id)}>{label}</button>)}</div>
    <p className="radar-selection-note">{view === 'selection' ? `Jusqu’à ${EDITORIAL_LIMIT} sujets à exploiter parmi les ${EDITORIAL_DAYS} derniers jours. Tous les autres sujets exploitables restent accessibles dans leur onglet. La sélection limite la place d’une même source.` : view === 'watch' ? 'Annonces à compléter et lancements annoncés. Un lancement ne garantit pas une disponibilité chez ton courtier.' : view === 'secondary' ? 'Variations techniques, révisions et extensions de couverture. Les évolutions majeures de composition peuvent être prioritaires.' : view === 'other' ? 'Les autres faits fiables et exploitables, classés avec les mêmes critères. Aucun sujet utile n’est caché derrière les cinq premières cartes.' : 'Tous les signaux conservés dans le flux, y compris les anciens sujets.'}</p>
    <details className="radar-filter-panel"><summary>Filtrer les sujets</summary><div className="radar-filters"><div className="radar-choices" role="group" aria-label="Catégorie"><button aria-pressed={family === 'all'} onClick={() => setFamily('all')}>Tout</button>{Object.entries(FAMILIES).map(([id, label]) => <button key={id} aria-pressed={family === id} onClick={() => setFamily(id)}>{label}</button>)}</div>{family === 'pouvoir-achat' && <div className="radar-choices" role="group" aria-label="Thème pouvoir d’achat">{Object.entries({ all: 'Tous les thèmes', logement: 'Logement', fiscalite: 'Épargne et fiscalité', depenses: 'Dépenses courantes', revenus: 'Revenus et aides' }).map(([id, label]) => <button key={id} aria-pressed={topic === id} onClick={() => setTopic(id)}>{label}</button>)}</div>}<div className="radar-choices" role="group" aria-label="Lecture"><button aria-pressed={mode === 'all'} onClick={() => setMode('all')}>Tous les signaux</button><button aria-pressed={mode === 'unread'} onClick={() => setMode('unread')}>Non lus</button></div><label>Rechercher<input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Un ETF, un courtier, un sujet…" /></label><Button onClick={() => onRead(displayedIds)} disabled={!displayedIds.some(id => !read.includes(id))}>Marquer la sélection comme lue</Button></div></details>
    <p role="status">{message}</p>
    {feed && !filtered.length && <section className="radar-empty"><h2>{events.length ? 'Aucun signal pour cette sélection' : 'Le radar est en veille'}</h2><p>{events.length ? 'Aucun sujet ne correspond à cette vue et à ces filtres. Les annonces à compléter et les variations secondaires restent accessibles dans leurs onglets.' : 'Le premier relevé sert de référence. Les prochains changements pertinents apparaîtront ici automatiquement.'}</p></section>}
    <div className="radar-list">{displayed.map(group => <SignalGroup key={group.id} group={group} read={read} onRead={onRead} />)}</div>
    {family === 'pouvoir-achat' && view !== 'selection' && feed?.purchasingPower && <section className="radar-news" aria-label="Veille pouvoir d’achat">
      <h2>Les informations récupérées</h2><p>Les dernières actualités officielles restent disponibles ici, y compris celles du premier relevé silencieux.</p>
      <div className="radar-list">{newsItems.map(item => <article className="radar-card" key={item.entity}><div className="radar-card-top"><span className="radar-label">{item.topicLabel}</span><time>{item.period}</time></div><h3>{item.label}</h3><p><strong>{item.status}</strong></p><p>{item.summary}</p>{item.originalLabel ? <details><summary>Lire le texte officiel</summary><p>{item.originalLabel}</p><p>{item.originalSummary}</p><p>{item.statusEvidence}</p></details> : item.statusEvidence && <p className="radar-scope">Formulation de la source : {item.statusEvidence}</p>}<p className="radar-scope">Dernier relevé de cet article : {date(item.checkedAt)}</p><div className="radar-actions"><a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.publisher} ↗</a>{item.tool && <Link to={item.tool}>Ouvrir l’outil</Link>}</div></article>)}</div>
      {!newsItems.length && <p>Aucune information pour ce thème et cette recherche.</p>}
      <details className="radar-coverage"><summary>État des sources de la veille</summary><ul>{feed.purchasingPower.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.name}</a> : {source.status === 'ok' ? 'contrôle réussi' : source.status === 'partial' ? 'contrôle partiel' : 'collecte en échec'} · {source.relevant} actualités retenues · {date(source.checkedAt)}</li>)}</ul><p>Les articles ne sont pas assimilés à des mesures applicables. Un vote peut concerner une seule étape du parcours législatif. Les montants et les conditions restent ceux indiqués dans la source.</p></details>
    </section>}
    {view === 'selection' && ready.length > displayed.length && <Button onClick={() => setView('other')}>Voir les {ready.length - displayed.length} autres sujets exploitables</Button>}
    {feed?.sources && <details className="radar-coverage"><summary>Sources de publications et file de traitement</summary><ul>{feed.sources.map(source => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.name}</a> : {source.status === 'ok' ? 'source saine' : source.status === 'unqualified' ? 'accès vérifié, raccordement non qualifié' : 'en panne'} · dernier succès : {date(source.lastSuccessAt)} · {source.error ?? source.reason ?? ''} · {source.queue?.pending ?? 0} en attente, {source.queue?.error ?? 0} extractions en échec, {source.queue?.rejected ?? 0} rejetées. {source.depth}</li>)}</ul><p>Un contrôle réussi sans nouvelle publication est distinct d’un échec. Les dernières extractions valides restent conservées avec leurs dates.</p></details>}
    {feed?.notifications && <p className={feed.notifications.status === 'error' ? 'radar-warning' : 'radar-scope'}>Notifications GitHub : {feed.notifications.status === 'error' ? 'en échec, reprise au prochain passage' : 'contrôle terminé'} · {feed.notifications.pending ?? 0} sujet(s) en attente. {feed.notifications.reason ?? ''} La réception sur téléphone dépend des réglages GitHub.</p>}
    <details className="radar-coverage"><summary>Ce que surveille le radar</summary><ul>{Object.entries(FAMILIES).map(([id, label]) => <li key={id}>{label} : {feed?.coverage[id] ?? '—'} sujets</li>)}</ul><p>Frais : toute modification confirmée. Compositions : au moins 2 points cumulés. Encours : au moins 20 % cumulés, sans les assimiler à des flux. Déclarations 13F : nouvelles périodes et mouvements déclarés, sans déduire les achats des poids.</p><p>{feed?.scopeNote ?? 'Le radar surveille les sources et produits raccordés à l’application.'}</p><p>Une collecte en échec conserve les dernières données validées. Un changement de format de la source peut nécessiter une réparation du collecteur.</p><Link to="/donnees-a-revoir">Voir les échecs de collecte</Link></details>
    {feed?.errors.length > 0 && <details className="radar-coverage"><summary>{feed.errors.length} observations non exploitables · collecte à réparer</summary><ul>{feed.errors.slice(0, 30).map((issue, index) => <li key={index}>{issue.entity} : {issue.reason}</li>)}</ul><p>Ces observations ne produisent pas d’alerte éditoriale.</p></details>}
    <p className="radar-footnote">Les états lus sont mémorisés sur cet appareil. Les brouillons restent à relire avant publication.</p>
  </div>
}
