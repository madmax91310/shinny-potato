import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './design-system/Layout'
import Home from './pages/Home'
import ComingSoon from './pages/ComingSoon'
import { TOOLS } from './tools'

// Each tool and its data are fetched only when its route is opened.
const EditorialRadar = lazy(() => import('./pages/editorial-radar/App'))
const WealthSimulator = lazy(() => import('./pages/wealth-simulator/App'))
const PortfolioGenerator = lazy(() => import('./pages/portfolio-generator/App'))
const PortfolioDuels = lazy(() => import('./pages/portfolio-duels/App'))
const BrokerComparator = lazy(() => import('./pages/broker-comparator/App'))
const InvestmentCalculator = lazy(() => import('./pages/investment-calculator/App'))
const EtfSheets = lazy(() => import('./pages/etf-sheets/App'))
const TweetMidi = lazy(() => import('./pages/tweet-midi/App'))
const FeeImpact = lazy(() => import('./pages/fee-impact/App'))
const MarketFacts = lazy(() => import('./pages/market-facts/App'))
const TweetBank = lazy(() => import('./pages/tweet-bank/App'))
const FactsheetTweets = lazy(() => import('./pages/factsheet-tweets/App'))
const DataSearch = lazy(() => import('./pages/data-search/App'))
const HouseholdApp = lazy(() => import('./pages/france-100-menages/App'))
const DataReview = lazy(() => import('./pages/data-review/App'))
const CompanyAnalysis = lazy(() => import('./pages/company-analysis/App'))
const InsurancePresentation = lazy(() => import('./pages/insurance-presentation/App'))
const ScpiPresentation = lazy(() => import('./pages/scpi-presentation/App'))
const InvestorPortfolio = lazy(() => import('./pages/investor-portfolio/App'))

// Individual publication routes reuse one lazy engine and its existing data.
// The old /tweet-midi URL remains available for saved links.
const TOOL_ELEMENTS = {
  '/radar-editorial': <EditorialRadar />,
  '/simulateur-patrimoine': <WealthSimulator />,
  '/presentation-assurance-vie': <InsurancePresentation />,
  '/presentation-scpi': <ScpiPresentation />,
  '/analyse-entreprise': <CompanyAnalysis />,
  '/france-100-menages': <HouseholdApp />,
  '/donnees-a-revoir': <DataReview />,
  '/bibliotheque-donnees': <DataSearch />,
  '/generateur-portefeuilles': <PortfolioGenerator />,
  '/duels-portefeuilles': <PortfolioDuels />,
  '/comparatif-courtiers': <BrokerComparator />,
  '/calculateur-investissement': <InvestmentCalculator />,
  '/fiches-etf': <EtfSheets />,
  '/impact-frais': <FeeImpact />,
  '/faits-marquants-marches': <MarketFacts />,
  '/banque-tweets': <TweetBank />,
  '/tweets-factsheets': <FactsheetTweets />,
  '/portefeuilles-investisseurs': <InvestorPortfolio />,
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
            element={tool.format ? <TweetMidi key={tool.to} initialFormat={tool.format} title={tool.title} description={tool.description} /> : TOOL_ELEMENTS[tool.to] ?? <ComingSoon title={tool.title} description={tool.description} />}
          />
        ))}
        <Route path="tweet-midi" element={<TweetMidi />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
