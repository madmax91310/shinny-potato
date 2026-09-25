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
// maquettes en largeur mobile réelle. Sous-titre (description) retiré et largeur plafonnée le
// 25/09/2026 (demande utilisateur juste après déploiement) : sans description, une carte étirée
// sur toute la moitié de la grille paraissait trop large pour son contenu (icône + titre seuls).
export default function ToolCard({ to, icon, title, accent = '#2dd4bf', status = 'disponible' }) {
  return (
    <Link to={to} className="group block h-full w-full max-w-[220px] justify-self-start">
      <Card className="flex h-full items-center gap-3 p-3 transition-colors group-hover:border-teal-600/60">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{ background: accent }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-snug text-slate-100">{title}</h2>
          {status !== 'disponible' && (
            <span className="mt-1 inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
              {STATUS_LABELS[status]}
            </span>
          )}
        </div>
      </Card>
    </Link>
  )
}
