import { useState } from 'react'
import { prioritizeIncidents, groupIncidents } from './incident-priority.js'
import { INCIDENT_LABELS as labels, incidentAction, incidentDiagnostic } from './incident-diagnostic.js'
import retired from '../../data/retired-automations.json' with {type:'json'}

const date = value => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(value)) : 'Non documenté'
const safeLink = value => typeof value === 'string' && /^https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/runs\/\d+$/.test(value)
export default function MonitoringIncidents({ monitor }) {
  const [copied, setCopied] = useState(null)
  const [manual, setManual] = useState(null)
  async function copy(row) {
    const diagnostic = incidentDiagnostic(row, monitor)
    setCopied(null); setManual(null)
    try { await navigator.clipboard.writeText(diagnostic); setCopied(row.id) }
    catch { setManual({ id: row.id, text: diagnostic }) }
  }
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')
  const [grouped,setGrouped] = useState(true)
  if (!monitor || monitor.schemaVersion !== 1 || !monitor.active || typeof monitor.active !== 'object' || Array.isArray(monitor.active) || !Array.isArray(monitor.resolved)) return null
  const removed = Object.values(monitor.active).filter(row=>Object.hasOwn(retired.workflows,row.workflow??''))
  const retiredRows = [...(monitor.retired??[]),...removed.map(row=>({...row,retirementReason:retired.workflows[row.workflow].reason}))]
  const active = prioritizeIncidents(Object.values(monitor.active).filter(row=>!Object.hasOwn(retired.workflows,row.workflow??'')))
  const rows = active.filter(row => (kind === 'all' || row.kind === kind) && `${row.name} ${row.dataId ?? ''} ${row.field} ${row.cause} ${(row.tools ?? []).join(' ')}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')))
  const groups=groupIncidents(rows)
  const age = Date.now() - Date.parse(monitor.checkedAt)
  const renderIncident=row=><article className="dr-item" key={row.id}>
      <span className={`dr-badge ${['overdue', 'unobserved', 'freshness', 'review', 'checks'].includes(row.kind) ? 'dr-undated' : 'dr-expired'}`}>{labels[row.kind] ?? 'À vérifier'}</span><h3>{row.name}</h3>
      <p>{row.field} — {row.cause}</p><p>{row.impactScope === 'collector' ? 'Périmètre du collecteur' : row.impactScope === 'catalog' ? 'Bibliothèque de données' : 'Outils utilisant cet actif'} : {(row.tools ?? []).join(', ') || 'Raccordement non documenté'}.</p>
      <dl><dt>Détecté depuis</dt><dd>{date(row.firstSeenAt)}</dd><dt>Dernier contrôle de collecte réussi</dt><dd>{date(row.lastSuccessAt ?? row.checkedAt)}</dd><dt>Période conservée</dt><dd>{row.asOf ?? 'Non documentée'}</dd>{row.dataId && <><dt>Identifiant</dt><dd>{row.dataId}</dd></>}{row.dueAt && <><dt>Échéance</dt><dd>{row.dueAt}</dd></>}</dl>
      <p><strong>Action à mener :</strong> {incidentAction(row.kind)}</p>
      <div className="dr-links"><button type="button" onClick={() => copy(row)}>Copier le diagnostic</button>
      {typeof row.to === 'string' && /^\/(bibliotheque-donnees\?|portefeuilles-investisseurs|fiches-pratiques)/.test(row.to) && <a href={`/shinny-potato${row.to}`}>Voir la donnée et ses sources ↗</a>}
      {safeLink(row.runUrl) && <a href={row.runUrl} target="_blank" rel="noreferrer">Voir l’exécution ↗</a>}</div>
      {copied === row.id && <p role="status">Diagnostic copié.</p>}
      {manual?.id === row.id && <label className="dr-copy-fallback">La copie automatique est indisponible. Sélectionne ce diagnostic pour le copier.<textarea aria-label="Diagnostic à copier" readOnly value={manual.text} onFocus={event => event.target.select()} /></label>}
    </article>
  return <section className="dr-automation" aria-label="Surveillance des données">
    <h2>Alertes des données automatisées</h2>
    <p>{active.length} point(s) à examiner · dernier contrôle : {date(monitor.checkedAt)}.</p>
    {retiredRows.length>0&&<details><summary>Retirés du périmètre · {retiredRows.length}</summary><p>{retiredRows[0].retirementReason}</p><p>Ces incidents ne sont pas comptés comme des données réparées.</p></details>}
    {(!Number.isFinite(age) || age < 0 || age > 2 * 3600000) && <p role="status">Le contrôle horaire n’est plus à jour. Ce bilan ne confirme pas l’état actuel des sources.</p>}
    <p className="dr-note">Un retard demande une vérification, sans prouver une erreur de valeur. Les contradictions restent à examiner dans les sources. Les dernières données validées sont conservées. Les incidents qui touchent une publication ou un calcul passent en premier, puis ceux qui concernent le plus d’outils.</p>
    <p className="dr-note"><a href="https://github.com/madmax91310/shinny-potato/issues/583" target="_blank" rel="noreferrer">Suivre les alertes sur GitHub ↗</a> · Les notifications sur téléphone dépendent de ton abonnement à cette issue et des réglages GitHub.</p>
    <label className="dr-incident-search">Rechercher un incident <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Actif, champ ou outil" /></label>
    <div className="dr-automation-filters">{[['all', 'Tous'], ...Object.entries(labels)].filter(([value]) => value === 'all' || value === kind || active.some(row => row.kind === value)).map(([value, label]) => <button type="button" key={value} aria-pressed={kind === value} onClick={() => setKind(value)}>{label} · {active.filter(row => value === 'all' || row.kind === value).length}</button>)}</div>
    <label><input type="checkbox" checked={grouped} onChange={e=>setGrouped(e.target.checked)}/>Regrouper les incidents par cause</label>
    <p>{groups.length} cause(s) pour {rows.length} incident(s) correspondant aux filtres. Les détails de chaque actif restent conservés.</p>
    <div className="dr-list">{grouped?groups.map(group=><details key={group.id} open={groups.length===1}><summary>{labels[group.kind]??group.kind} · {group.field} · {group.rows.length} incident(s)</summary><p>{group.cause}</p><p>Outils concernés : {group.tools.join(', ')||'À raccorder'}.</p>{group.rows.map(renderIncident)}</details>):rows.map(renderIncident)}</div>
    {!rows.length && <p>Aucun incident pour cette sélection.</p>}
    {monitor.resolved.length > 0 && <details><summary>Retours à la normale · {monitor.resolved.length}</summary><ul>{monitor.resolved.map((row, i) => <li key={`${row.id}:${row.resolvedAt}:${i}`}>{row.name} · {row.field} — résolu le {date(row.resolvedAt)}</li>)}</ul></details>}
  </section>
}
