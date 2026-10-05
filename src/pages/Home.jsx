import ToolCard from '../design-system/ToolCard'
import { HOME_TOOLS } from '../tools'
import './home.css'

export default function Home() {
  return <div className="workspace-home">
    <h1 className="sr-only">Boîte à outils</h1>
    <div className="workspace-tool-grid" style={{ '--home-rows': Math.ceil(HOME_TOOLS.length / 2) }}>
      {HOME_TOOLS.map(tool => <ToolCard key={tool.to} {...tool} />)}
    </div>
  </div>
}
