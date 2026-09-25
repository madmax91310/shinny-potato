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
      {/* 2 par ligne à toutes les tailles d'écran (demande explicite du 25/09/2026) — validé en
          largeur mobile réelle sur la disposition horizontale de ToolCard avant ce choix. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.to} {...tool} />
        ))}
      </div>
    </div>
  )
}
