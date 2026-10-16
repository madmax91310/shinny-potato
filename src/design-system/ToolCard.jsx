import { Link } from 'react-router-dom'
import ToolIcon from './ToolIcon'

const COMPACT_LABELS = {
  '/france-100-menages': 'France en 100 ménages',
  '/impact-frais': 'Impact des frais',
  '/tweets-factsheets': 'Coulisses des indices',
  '/faits-marquants-marches': 'Faits marquants',
  '/banque-tweets': 'Banque de tweets',
}

export default function ToolCard({ to, title, group, publicationDay, icon, emoji = false, status = 'disponible' }) {
  return <Link to={to} className={`workspace-tool-card${to==='/le-dca-de'?' workspace-portfolio-card':''}`} data-group={group}>
    <span className="workspace-tool-icon" aria-hidden="true">{emoji ? icon : <ToolIcon to={to} />}</span>
    <div><h2>{COMPACT_LABELS[to] ?? title}</h2>{to==='/le-dca-de'&&<p className="workspace-portfolio-description">Expositions · Titres communs · Publications</p>}{publicationDay && <span className="workspace-publication-day">{publicationDay}</span>}{status === 'bientot' && <span className="workspace-card-status">Bientôt</span>}</div>
  </Link>
}
