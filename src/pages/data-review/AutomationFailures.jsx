import ReviewBoundary from './ReviewBoundary.jsx'
import {MONITOR_RUNS_URL,monitorExecutionHealth,monitorHealth} from './review-inbox.js'
import ReviewInbox from './ReviewInbox.jsx'
import AssetFieldCoverage from './AssetFieldCoverage.jsx'
import { useEffect, useState } from 'react'
import MonitoringIncidents from './MonitoringIncidents.jsx'
import { Link } from 'react-router-dom'
import { TOOLS } from '../../tools.js'
import { AUTOMATION_STATUS_URL, automationFailures, automationOverview } from './automation.js'
import { decodeMonitorStorage } from '../../lib/monitor-storage.js'
const toolTitle = path => TOOLS.find(tool => tool.to === path)?.navLabel ?? path

const recoveryLabel = value => ({ reserved: 'Relance réservée', dispatched: 'Relance demandée', waiting: 'Nouvelle tentative programmée', 'awaiting-current-run': 'Une exécution est déjà en cours ou attend son bilan', 'budget-exhausted': 'Limite de relances atteinte pour 24 heures', 'dispatch-failed': 'Demande de relance échouée ; nouvelle tentative différée' }[value] ?? null)
const publicationLabel = value => ({ success: 'Réussie', unverified:'Non démontrée', failure: 'En échec', 'not-run': 'Non exécutée' }[value] ?? 'Non documentée')
const date = value => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('fr-FR', {dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris'}).format(new Date(value)) : 'Non documenté'
export default function AutomationFailures({review}) {
  const [monitorExecutionError,setMonitorExecutionError]=useState('Vérification indépendante du moniteur en cours.')
  const [fullStatus,setFullStatus]=useState(null)
  const [monitor, setMonitor] = useState(null)
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
        const status = await decodeMonitorStorage(await response.json())
        const rows = automationOverview(status)
        const next = automationFailures(status)
        if (active) { setFullStatus(status); setAlerts(next); setOverview(rows); setMonitor(status.monitoring ?? null); setUnavailable(false) }
      } catch { if (active) setUnavailable(true) }
      finally { clearTimeout(timeout) }
    }
    async function checkMonitor(){try{const r=await fetch(MONITOR_RUNS_URL,{cache:'no-store',signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('HTTP '+r.status);const error=monitorExecutionHealth(await r.json());if(active)setMonitorExecutionError(error)}catch{if(active)setMonitorExecutionError('Contrôle indépendant du moniteur indisponible ; son bon fonctionnement reste à démontrer.')}}
    checkMonitor()
    refresh()
    const timer = setInterval(()=>{refresh();checkMonitor()}, 300000)
    return () => { active = false; clearInterval(timer); controller?.abort() }
  }, [])
  const observed = overview?.map(row=>(unavailable||monitorExecutionError||!monitorHealth(fullStatus).ok)&&row.state==='success'?{...row,state:'unknown'}:row)??[]
  const rows=observed.filter(row=>filter==='all'||row.state===filter)
  return <><ReviewInbox status={fullStatus} transportError={unavailable?'Lecture du moniteur échouée':monitorExecutionError} review={review}/><ReviewBoundary name="Historique des incidents"><MonitoringIncidents monitor={monitor} /></ReviewBoundary><section className="dr-automation" aria-label="Bilan des collectes automatiques">
    <h2>Producteurs et contrôles automatiques</h2>
    <p className="dr-note">Les dates ci-dessous suivent les exécutions des collecteurs. Une collecte réussie peut conserver une valeur inchangée ; elle ne change pas la date de la donnée. La publication de l’application est suivie séparément. Les champs indisponibles figurent dans les réserves de cette page.</p>
    {!overview && !unavailable && <p role="status" className="dr-note">Chargement du bilan des collectes…</p>}
    {overview && <>
      <div className="dr-automation-filters" aria-label="Filtrer les collectes">{[['all', 'Toutes'], ['success', 'Réussies'], ['failure', 'En échec'], ['overdue', 'En retard'], ['unknown', 'État non documenté'], ['qualification','Périmètre à qualifier']].map(([value, label]) => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label} · {observed.filter(row => value === 'all' || row.state === value).length}</button>)}</div>
      <div className="dr-list">{rows.map(row => <article className="dr-item" key={row.id}>
        <span className={`dr-badge ${row.state === 'success' ? 'dr-current' : row.state === 'failure' ? 'dr-expired' : 'dr-undated'}`}>{row.state === 'success' ? 'Collecte réussie' : row.state === 'failure' ? row.validationStatus === 'failure' ? 'Validation en échec' : row.recordingStatus === 'failure' ? 'Enregistrement en échec' : row.collectionStatus === 'success' && row.publicationStatus === 'failure' ? 'Publication en échec' : row.collectionStatus === 'failure' ? 'Collecte en échec' : 'Exécution en échec' : row.state === 'qualification'?'Exécution passée · périmètre à qualifier':row.state === 'overdue' ? 'Contrôle en retard' : 'État non documenté'}</span>
        <h3>{row.name}</h3>
        {row.state === 'overdue' && <p>Aucune exécution terminée depuis plus de {row.maxAgeHours} heures. Le dernier succès ne prouve pas que la collecte fonctionne encore.</p>}
        {row.validationStatus === 'failure' && <p>Les contrôles de validation des observations ont échoué. Leur enregistrement est bloqué.</p>}
        {row.recordingStatus === 'failure' && <p>L’enregistrement des données validées a échoué. Les données validées n’ont pas été enregistrées ; leur publication reste à reprendre.</p>}
        {row.publicationStatus === 'failure' && <p>La publication de l’application a échoué.{row.collectionStatus === 'success' && ' La collecte a réussi ; son déploiement reste à reprendre.'}</p>}
        {row.state === 'failure' && <p>Les dernières données validées sont conservées.{row.failureCount > 0 && ` ${row.failureCount} donnée(s) en échec documentée(s).`}</p>}
        {row.state === 'failure' && row.cause && <p className="dr-cause">Cause relevée : {row.cause}</p>}
        {recoveryLabel(row.recovery?.status) && <p className="dr-recovery" role="status">Reprise automatique : {recoveryLabel(row.recovery.status)}.{row.recovery.nextAttemptAt && ` Prochaine tentative possible : ${date(row.recovery.nextAttemptAt)}.`} Les collectes programmées continuent.</p>}
        <dl><dt>Dernière exécution</dt><dd>{date(row.completedAt)}{row.age && ` · ${row.age}`}</dd><dt>Dernier contrôle de collecte réussi</dt><dd>{date(row.lastCollectionSuccessAt)}</dd><dt>Collecte de cette exécution</dt><dd>{publicationLabel(row.collectionStatus)}</dd><dt>Validation de cette exécution</dt><dd>{publicationLabel(row.validationStatus)}</dd><dt>Enregistrement de cette exécution</dt><dd>{publicationLabel(row.recordingStatus)}</dd><dt>Publication de cette exécution</dt><dd>{publicationLabel(row.publicationStatus)}</dd><dt>Dernière publication réussie</dt><dd>{date(row.lastPublicationSuccessAt)}</dd><dt>Dernier succès complet</dt><dd>{date(row.lastSuccessAt)}</dd></dl>
        {row.paths.length > 0 && <p className="dr-tools">Outils alimentés : {row.paths.map((path, index) => <span key={path}>{index > 0 && ', '}<Link to={path}>{toolTitle(path)}</Link></span>)}</p>}
        {row.runUrl && <div className="dr-links"><a href={row.runUrl} target="_blank" rel="noreferrer">Voir l’exécution ↗</a></div>}
      </article>)}</div>
      {!rows.length && <p className="dr-note">Aucune collecte pour cette sélection.</p>}
    </>}
    {alerts.length > 0 && <section aria-label="Échecs des mises à jour automatiques"><h2>Détail des échecs et données conservées</h2>
      <div className="dr-list">{alerts.map(alert => <article className="dr-item" key={alert.id}>
        <span className="dr-badge dr-expired">Mise à jour échouée</span>
        <h3>{alert.name}</h3>
        <p>{alert.collectionStatus === 'success' && alert.publicationStatus === 'failure' ? 'Les données ont été collectées, mais leur publication dans l’application a échoué.' : 'La dernière mise à jour automatique a échoué. Les dernières données validées restent disponibles.'}</p>
        {alert.cause && <p>Cause relevée : {alert.cause}</p>}
        <dl><dt>Dernier succès</dt><dd>{date(alert.lastSuccessAt)}</dd><dt>Échec constaté</dt><dd>{date(alert.completedAt)}</dd></dl>
        <div className="dr-links"><a href={alert.runUrl} target="_blank" rel="noreferrer">Voir la cause et le suivi ↗</a></div>
      </article>)}</div></section>}
    {unavailable && <p className="dr-note" role="status">Le suivi des automatisations est momentanément indisponible. Les éventuelles alertes affichées n’ont pas pu être revérifiées.</p>}
  </section><ReviewBoundary name="Couverture par champ"><AssetFieldCoverage /></ReviewBoundary></>
}

