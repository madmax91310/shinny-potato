import { useEffect, useState } from 'react'
import { AUTOMATION_STATUS_URL, automationFailures, automationOverview } from './automation.js'

const date = value => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('fr-FR', {dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris'}).format(new Date(value)) : 'Non documenté'
export default function AutomationFailures() {
  const [alerts, setAlerts] = useState([])
  const [overview, setOverview] = useState(null)
  const [filter, setFilter] = useState('all')
  const [unavailable, setUnavailable] = useState(false)
  useEffect(() => {
    let active = true, controller
    async function refresh() {
      controller?.abort()
      controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 12000)
      try {
        const response = await fetch(AUTOMATION_STATUS_URL, {cache: 'no-store', signal: controller.signal})
        if (!response.ok) throw new Error('Statut indisponible')
        const status = await response.json()
        const rows = automationOverview(status)
        const next = automationFailures(status)
        if (active) { setAlerts(next); setOverview(rows); setUnavailable(false) }
      } catch { if (active) setUnavailable(true) }
      finally { clearTimeout(timeout) }
    }
    refresh()
    const timer = setInterval(refresh, 300000)
    return () => { active = false; clearInterval(timer); controller?.abort() }
  }, [])
  const rows = overview?.filter(row => filter === 'all' || row.state === filter) ?? []
  return <section className="dr-automation" aria-label="Bilan des collectes automatiques">
    <h2>Bilan des collectes automatiques</h2>
    <p className="dr-note">Les dates ci-dessous suivent les exécutions des collecteurs. Une collecte réussie peut conserver une valeur inchangée ; elle ne garantit pas que tous les champs sont publiés. Les champs indisponibles figurent dans les réserves de cette page.</p>
    {!overview && !unavailable && <p role="status" className="dr-note">Chargement du bilan des collectes…</p>}
    {overview && <>
      <div className="dr-automation-filters" aria-label="Filtrer les collectes">{[['all', 'Toutes'], ['success', 'Réussies'], ['failure', 'En échec'], ['unknown', 'État non documenté']].map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label} · {overview.filter(row => value === 'all' || row.state === value).length}</button>)}</div>
      <div className="dr-list">{rows.map(row => <article className="dr-item" key={row.id}>
        <span className={`dr-badge ${row.state === 'success' ? 'dr-current' : row.state === 'failure' ? 'dr-expired' : 'dr-undated'}`}>{row.state === 'success' ? 'Collecte réussie' : row.state === 'failure' ? 'Collecte en échec' : 'État non documenté'}</span>
        <h3>{row.name}</h3>
        {row.state === 'failure' && <p>Les dernières données validées sont conservées.{row.failureCount > 0 && ` ${row.failureCount} donnée(s) en échec documentée(s).`}</p>}
        <dl><dt>Dernière exécution</dt><dd>{date(row.completedAt)}</dd><dt>Dernier succès complet</dt><dd>{date(row.lastSuccessAt)}</dd></dl>
        {row.runUrl && <div className="dr-links"><a href={row.runUrl} target="_blank" rel="noreferrer">Voir l’exécution ↗</a></div>}
      </article>)}</div>
      {!rows.length && <p className="dr-note">Aucune collecte pour cette sélection.</p>}
    </>}
    {alerts.length > 0 && <section aria-label="Échecs des mises à jour automatiques"><h2>Détail des échecs et données conservées</h2>
      <div className="dr-list">{alerts.map(alert => <article className="dr-item" key={alert.id}>
        <span className="dr-badge dr-expired">Mise à jour échouée</span>
        <h3>{alert.name}</h3>
        <p>La dernière mise à jour automatique a échoué. Les dernières données validées restent disponibles.</p>
        {alert.cause && <p>Cause relevée : {alert.cause}</p>}
        <dl><dt>Dernier succès</dt><dd>{date(alert.lastSuccessAt)}</dd><dt>Échec constaté</dt><dd>{date(alert.completedAt)}</dd></dl>
        <div className="dr-links"><a href={alert.runUrl} target="_blank" rel="noreferrer">Voir la cause et le suivi ↗</a></div>
      </article>)}</div></section>}
    {unavailable && <p className="dr-note" role="status">Le suivi des automatisations est momentanément indisponible. Les éventuelles alertes affichées n’ont pas pu être revérifiées.</p>}
  </section>
}
