import ToolCard from '../design-system/ToolCard'
import { TOOLS } from '../tools'

export default function Home() {
  return (
    <div>
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Boîte à outils</h1>
        <p className="max-w-2xl text-sm text-slate-400 sm:text-base">
          Les outils du compte d'éducation financière, réunis au même endroit.
        </p>
      </div>
      {/* 2 par ligne à toutes les tailles d'écran (demande explicite du 25/09/2026). Colonnes de
          largeur fixe (pas 50/50 du conteneur) : avec grid-cols-2 classique, plafonner la largeur
          de ToolCard laissait un vide énorme entre les deux colonnes sur les grands écrans —
          repéré à l'écran avant de pousser ce correctif. minmax(0, 220px) garde les cartes collées
          l'une à l'autre, quelle que soit la largeur du conteneur. */}
      <div className="grid grid-cols-[repeat(2,minmax(0,220px))] gap-3 sm:gap-4">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.to} {...tool} />
        ))}
      </div>
    </div>
  )
}
