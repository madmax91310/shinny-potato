import { Link } from 'react-router-dom'
import Card from './Card'

// Seul 'bientot' est affiché : 'disponible' est l'état par défaut de tous les outils au moment où
// ce badge a été introduit, l'afficher partout n'apportait aucune information (cf. maquette du
// 25/09/2026) — gardé uniquement pour signaler un outil pas encore branché.
const STATUS_LABELS = {
  bientot: 'Bientôt',
}

// Carte cliquable du dashboard : une par outil, même gabarit pour tous. Disposition horizontale
// (tuile d'icône colorée à gauche, texte à droite) choisie le 25/09/2026 après comparaison de 3
// maquettes en largeur mobile réelle — la seule des trois à rester lisible sans que les titres ne
// passent sur 3 lignes ni que la description ne soit réduite à rien.
export default function ToolCard({ to, icon, title, description, accent = '#2dd4bf', status = 'disponible' }) {
  return (
    <Link to={to} className="group block h-full">
      <Card className="flex h-full items-start gap-3 p-4 transition-colors group-hover:border-teal-600/60">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{ background: accent }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold leading-snug text-slate-100 sm:text-base">{title}</h2>
            {status !== 'disponible' && (
              <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                {STATUS_LABELS[status]}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400 sm:text-sm">{description}</p>
        </div>
      </Card>
    </Link>
  )
}
