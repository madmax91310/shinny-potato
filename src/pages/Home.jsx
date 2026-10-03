import { useState } from 'react'
import ToolCard from '../design-system/ToolCard'
import { TOOL_GROUPS } from '../tools'

const FILTER_LABELS = { compare: 'Comparer', portfolio: 'Portefeuilles', publish: 'Publier', data: 'Données' }

export default function Home() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const normalized = query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const tools = TOOL_GROUPS.flatMap(group => group.tools.map(tool => ({ ...tool, group: group.id })))
    .filter(tool => (category === 'all' || category === tool.group) && `${tool.title} ${tool.description} ${tool.navLabel}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(normalized))
  return <div className="workspace-home">
    <h1 className="sr-only">Boîte à outils</h1>
    <label className="workspace-search"><span className="sr-only">Rechercher un outil</span><input type="search" placeholder="Rechercher un outil…" value={query} onChange={e => setQuery(e.target.value)} /></label>
    <div className="workspace-filters" role="group" aria-label="Filtrer les outils par usage">
      {[['all', 'Tous'], ...Object.entries(FILTER_LABELS)].map(([id, label]) => <button key={id} type="button" aria-pressed={category === id} onClick={() => setCategory(id)}>{label}</button>)}
    </div>
    <div className="workspace-tool-grid">{tools.map(tool => <ToolCard key={tool.to} {...tool} />)}</div>
    {!tools.length && <p role="status" className="workspace-empty">Aucun outil trouvé. Essaie « ETF », « indices » ou « données ».</p>}
  </div>
}
