import ToolCard from '../design-system/ToolCard'
import { TOOL_GROUPS } from '../tools'
import './home.css'

// Daily format first, then Monday to Sunday. Unscheduled tools follow.
const WEEKLY_ORDER = [
  '/tweet-midi', '/generateur-portefeuilles', '/tweets-factsheets',
  '/duels-portefeuilles', '/calculateur-investissement', '/fiches-etf',
  '/comparatif-courtiers', '/portefeuilles-investisseurs',
  '/comparateur-indices', '/impact-frais', '/france-100-menages',
  '/cas-concrets', '/faits-marquants-marches', '/banque-tweets',
  '/bibliotheque-donnees', '/donnees-a-revoir',
]
const tools = TOOL_GROUPS.flatMap(group => group.tools.map(tool => ({ ...tool, group: group.id })))
  .sort((a, b) => {
    const rank = tool => WEEKLY_ORDER.includes(tool.to) ? WEEKLY_ORDER.indexOf(tool.to) : WEEKLY_ORDER.length
    return rank(a) - rank(b)
  })

export default function Home() {
  return <div className="workspace-home">
    <h1 className="sr-only">Boîte à outils</h1>
    <div className="workspace-tool-grid">{tools.map(tool => <ToolCard key={tool.to} {...tool} />)}</div>
  </div>
}
