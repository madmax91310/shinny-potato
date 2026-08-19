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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <ToolCard key={tool.to} {...tool} />
        ))}
      </div>
    </div>
  )
}
