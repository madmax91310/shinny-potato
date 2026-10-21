import { Link } from 'react-router-dom'
import ToolIcon from './ToolIcon'

export default function ToolCard({ to, title, group, publicationDay, icon, emoji = false, status = 'disponible' }) {
  return <Link to={to} className={`workspace-tool-card${to.split('?')[0]==='/le-dca-de'?' workspace-portfolio-card':''}`} data-group={group}>
    <span className="workspace-tool-icon" aria-hidden="true">{emoji ? icon : <ToolIcon to={to} />}</span>
    <div><h2>{title}</h2>{to.split('?')[0]==='/le-dca-de'&&<p className="workspace-portfolio-description">Expositions · Titres communs · Publications</p>}{publicationDay && <span className="workspace-publication-day">{publicationDay}</span>}{status === 'bientot' && <span className="workspace-card-status">Bientôt</span>}</div>
  </Link>
}
