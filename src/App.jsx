import { Routes, Route } from 'react-router-dom'
import Layout from './design-system/Layout'
import Home from './pages/Home'
import ComingSoon from './pages/ComingSoon'
import PortfolioTracker from './pages/portfolio-tracker/App'
import EtfTweets from './pages/etf-tweets/App'
import PortfolioGenerator from './pages/portfolio-generator/App'
import { TOOLS } from './tools'

const TOOL_ELEMENTS = {
  '/suivi-portefeuille': <PortfolioTracker />,
  '/tweets-etf': <EtfTweets />,
  '/generateur-portefeuilles': <PortfolioGenerator />,
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        {TOOLS.map((tool) => (
          <Route
            key={tool.to}
            path={tool.to.slice(1)}
            element={TOOL_ELEMENTS[tool.to] ?? <ComingSoon title={tool.title} description={tool.description} />}
          />
        ))}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
