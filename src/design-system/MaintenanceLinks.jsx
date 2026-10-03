import { maintenanceLinks } from '../data/maintenance-links.js'
import './maintenance-links.css'

export default function MaintenanceLinks({ record, field }) {
  const links = maintenanceLinks(record, field)
  if (!links.length) return null
  return <div className="maintenance-links">
    <p>Pour préparer la mise à jour</p>
    <ul>{links.map(link => <li key={link.url}><a href={link.url} target="_blank" rel="noreferrer">{link.label} ↗</a></li>)}</ul>
    <small>Compare la période, la devise et le périmètre avec la donnée enregistrée. Les liens ci-dessous conservent les sources du dernier contrôle.</small>
  </div>
}
