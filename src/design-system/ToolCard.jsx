import { Link } from 'react-router-dom'
import ToolIcon from './ToolIcon'

export default function ToolCard({ to, title, summary, description, accent = '#2dd4bf', status = 'disponible', publicationDay }) {
  return <Link to={to} className="workspace-tool-card" style={{ '--tool-accent': accent }}>
    <div className="workspace-card-top"><span className="workspace-tool-icon" aria-hidden="true"><ToolIcon to={to} /></span><span className="workspace-card-arrow" aria-hidden="true">↗</span></div>
    <h3>{title}</h3>
    <p>{summary ?? description}</p>
    <span className="workspace-card-footer">{status === 'bientot' ? 'Bientôt' : publicationDay ?? 'Ouvrir l’outil'}</span>
  </Link>
}
