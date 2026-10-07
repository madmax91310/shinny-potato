import { useEffect, useState } from 'react'
import { AUTOMATION_STATUS_URL, automationFailures } from './automation.js'

const date = value => value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('fr-FR', {dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Paris'}).format(new Date(value)) : 'Non documenté'
export default function AutomationFailures() {
  const [alerts, setAlerts] = useState([])
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
        const next = automationFailures(await response.json())
        if (active) { setAlerts(next); setUnavailable(false) }
      } catch { if (active) setUnavailable(true) }
      finally { clearTimeout(timeout) }
    }
    refresh()
    const timer = setInterval(refresh, 300000)
    return () => { active = false; clearInterval(timer); controller?.abort() }
  }, [])
  if (!alerts.length && !unavailable) return null
  return <section className="dr-automation" aria-label="Échecs des mises à jour automatiques">
    {alerts.length > 0 && <><h2>Mises à jour automatiques en échec</h2>
      <div className="dr-list">{alerts.map(alert => <article className="dr-item" key={alert.id}>
        <span className="dr-badge dr-expired">Mise à jour échouée</span>
        <h3>{alert.name}</h3>
        <p>La dernière mise à jour automatique a échoué. Les dernières données validées restent disponibles.</p>
        <dl><dt>Dernier succès</dt><dd>{date(alert.lastSuccessAt)}</dd><dt>Échec constaté</dt><dd>{date(alert.completedAt)}</dd></dl>
        <div className="dr-links"><a href={alert.runUrl} target="_blank" rel="noreferrer">Voir la cause et le suivi ↗</a></div>
      </article>)}</div></>}
    {unavailable && <p className="dr-note" role="status">Le suivi des automatisations est momentanément indisponible. Les éventuelles alertes affichées n’ont pas pu être revérifiées.</p>}
  </section>
}
