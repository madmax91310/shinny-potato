import { useState } from 'react'
import ToolCard from '../design-system/ToolCard'
import { TOOLS, TOOL_GROUPS } from '../tools'

export default function Home() {
  const [query, setQuery] = useState('')
  const normalized = query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const matches = tool => `${tool.title} ${tool.description} ${tool.navLabel}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(normalized)
  return <div className="workspace-home">
    <header className="workspace-hero">
      <p className="workspace-eyebrow">Ton atelier Épargnant Libre</p>
      <h1>Une idée. Un outil.<br /><span>Ta prochaine publication.</span></h1>
      <p>Compare, explore et prépare tes contenus depuis un seul espace.</p>
      <label className="workspace-search"><span>Rechercher un outil</span><input type="search" placeholder="ETF, portefeuille, données…" value={query} onChange={e => setQuery(e.target.value)} /></label>
    </header>
    <div className="workspace-catalog">
      {TOOL_GROUPS.map(group => {
        const tools = group.tools.filter(matches)
        return tools.length > 0 && <section key={group.id} aria-labelledby={`group-${group.id}`} className="workspace-tool-group">
          <div className="workspace-section-heading"><div><h2 id={`group-${group.id}`}>{group.title}</h2><p>{group.description}</p></div><span>{tools.length} outils</span></div>
          <div className="workspace-tool-grid">{tools.map(tool => <ToolCard key={tool.to} {...tool} />)}</div>
        </section>
      })}
      {!TOOLS.some(matches) && <p role="status" className="workspace-empty">Aucun outil trouvé. Essaie « ETF », « indices » ou « données ».</p>}
    </div>
  </div>
}
