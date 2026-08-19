import { Link } from 'react-router-dom'
import Card from './Card'

const STATUS_STYLES = {
  disponible: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
  bientot: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
}

const STATUS_LABELS = {
  disponible: 'Disponible',
  bientot: 'Bientôt',
}

// Carte cliquable du dashboard : une par outil, même gabarit pour tous.
export default function ToolCard({ to, icon, title, description, status = 'disponible' }) {
  return (
    <Link to={to} className="group block h-full">
      <Card className="flex h-full flex-col gap-3 p-5 transition-colors group-hover:border-teal-600/60">
        <div className="flex items-start justify-between gap-3">
          <span className="text-2xl" aria-hidden="true">
            {icon}
          </span>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
          >
            {STATUS_LABELS[status]}
          </span>
        </div>
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        <p className="text-sm leading-relaxed text-slate-400">{description}</p>
      </Card>
    </Link>
  )
}
