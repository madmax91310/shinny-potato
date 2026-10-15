import { Link } from 'react-router-dom'
import { getPerformanceAssetId, getPerformanceHref } from '../data/performance-links.js'
import { getSimulationHref } from '../data/simulation-links.js'

export default function PortfolioHistoryLinks({ isin }) {
  const performance = getPerformanceHref(isin)
  const simulation = getSimulationHref(getPerformanceAssetId(isin))
  if (!performance) return null
  return <span className="pg-history-links"><Link to={performance}>Performance de cette part</Link>{simulation && <> · <Link to={simulation}>Simuler avec son historique mensuel</Link></>}</span>
}
