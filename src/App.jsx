import { Routes, Route } from 'react-router-dom'
import Layout from './design-system/Layout'
import Home from './pages/Home'
import ComingSoon from './pages/ComingSoon'
import EtfTweets from './pages/etf-tweets/App'
import PortfolioGenerator from './pages/portfolio-generator/App'
import BrokerComparator from './pages/broker-comparator/App'
import InvestmentCalculator from './pages/investment-calculator/App'
import EtfSheets from './pages/etf-sheets/App'
import LexiqueFinancier from './pages/lexique-financier/App'
import TweetMidi from './pages/tweet-midi/App'
import IndexComparator from './pages/index-comparator/App'
import { TOOLS } from './tools'

const TOOL_ELEMENTS = {
  '/tweets-etf': <EtfTweets />,
  '/generateur-portefeuilles': <PortfolioGenerator />,
  '/comparatif-courtiers': <BrokerComparator />,
  '/calculateur-investissement': <InvestmentCalculator />,
  '/fiches-etf': <EtfSheets />,
  '/lexique-financier': <LexiqueFinancier />,
  '/tweet-midi': <TweetMidi />,
  '/comparateur-indices': <IndexComparator />,
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
