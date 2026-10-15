import { useState } from 'react'
import { prioritizeIncidents } from './incident-priority.js'
const labels = { collection: 'Collecte échouée', publication: 'Publication échouée', overdue: 'Collecte en retard', unobserved: 'Contrôle indisponible', freshness: 'Donnée à revérifier', conflict: 'Sources contradictoires' }
const date = value => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(value)) : 'Non documenté'
const safeLink = value => typeof value === 'string' && /^https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/runs\/\d+$/.test(value)
export default function MonitoringIncidents({ monitor }) {
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')
  if (!monitor || monitor.schemaVersion !== 1 || !monitor.active || typeof monitor.active !== 'object' || Array.isArray(monitor.active) || !Array.isArray(monitor.resolved)) return null
  const active = prioritizeIncidents(Object.values(monitor.active))
  const rows = active.filter(row => (kind === 'all' || row.kind === kind) && `${row.name} ${row.field} ${row.cause} ${(row.tools ?? []).join(' ')}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')))
  const age = Date.now() - Date.parse(monitor.checkedAt)
  return <section className="dr-automation" aria-label="Surveillance des données">
    <h2>Surveillance des données</h2>
    <p>{active.length} point(s) à examiner · dernier contrôle : {date(monitor.checkedAt)}.</p>
    {(!Number.isFinite(age) || age < 0 || age > 2 * 3600000) && <p role="status">Le contrôle horaire n’est plus à jour. Ce bilan ne confirme pas l’état actuel des sources.</p>}
    <p className="dr-note">Un retard demande une vérification, sans prouver une erreur de valeur. Les contradictions restent à examiner dans les sources. Les dernières données validées sont conservées. Les incidents qui touchent une publication ou un calcul passent en premier, puis ceux qui concernent le plus d’outils.</p>
    <label>Rechercher un incident <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Actif, champ ou outil" /></label>
    <div className="dr-automation-filters">{[['all', 'Tous'], ...Object.entries(labels)].map(([value, label]) => <button type="button" key={value} aria-pressed={kind === value} onClick={() => setKind(value)}>{label} · {active.filter(row => value === 'all' || row.kind === value).length}</button>)}</div>
    <div className="dr-list">{rows.map(row => <article className="dr-item" key={row.id}>
      <span className="dr-badge dr-expired">{labels[row.kind] ?? 'À vérifier'}</span><h3>{row.name}</h3>
      <p>{row.field} — {row.cause}</p><p>{row.impactScope === 'collector' ? 'Périmètre du collecteur' : 'Outils utilisant cet actif'} : {(row.tools ?? []).join(', ') || 'Périmètre du collecteur à examiner'}.</p>
      <dl><dt>Détecté depuis</dt><dd>{date(row.firstSeenAt)}</dd>{row.dueAt && <><dt>Échéance</dt><dd>{row.dueAt}</dd></>}</dl>
      {typeof row.to === 'string' && /^\/(bibliotheque-donnees\?|portefeuilles-investisseurs|fiches-pratiques)/.test(row.to) && <a href={`/shinny-potato${row.to}`}>Voir la donnée et ses sources ↗</a>}
      {safeLink(row.runUrl) && <a href={row.runUrl} target="_blank" rel="noreferrer">Voir l’exécution ↗</a>}
    </article>)}</div>
    {!rows.length && <p>Aucun incident pour cette sélection.</p>}
    {monitor.resolved.length > 0 && <details><summary>Retours à la normale · {monitor.resolved.length}</summary><ul>{monitor.resolved.map((row, i) => <li key={`${row.id}:${row.resolvedAt}:${i}`}>{row.name} · {row.field} — résolu le {date(row.resolvedAt)}</li>)}</ul></details>}
  </section>
}
