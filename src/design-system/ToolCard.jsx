import { Link } from 'react-router-dom'
import ToolIcon from './ToolIcon'

const COMPACT_LABELS = {
  '/impact-frais': 'Impact des frais',
  '/tweets-factsheets': 'Coulisses des indices',
  '/faits-marquants-marches': 'Faits marquants',
  '/cas-concrets': 'Cas concrets',
  '/banque-tweets': 'Banque de tweets',
}

export default function ToolCard({ to, title, group, publicationDay, status = 'disponible' }) {
  return <Link to={to} className="workspace-tool-card" data-group={group}>
    <span className="workspace-tool-icon" aria-hidden="true"><ToolIcon to={to} /></span>
    <div><h2>{COMPACT_LABELS[to] ?? title}</h2>{publicationDay && <span className="workspace-publication-day">{publicationDay}</span>}{status === 'bientot' && <span className="workspace-card-status">Bientôt</span>}</div>
  </Link>
}
