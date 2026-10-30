import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './design-system/Layout'
import ComingSoon from './pages/ComingSoon'
import { TOOLS } from './tools'

const Home = lazy(() => import('./pages/Home'))

// Each tool and its data are fetched only when its route is opened.
const RankingIdeas = lazy(() => import('./pages/ranking-ideas/App'))
const HeyGrok = lazy(() => import('./pages/hey-grok/App'))
const DcaProfiles = lazy(() => import('./pages/dca-profiles/App'))
const BudgetProfiles = lazy(() => import('./pages/budget-profiles/App'))
const PracticalSheets = lazy(() => import('./pages/practical-sheets/App'))
const EditorialRadar = lazy(() => import('./pages/editorial-radar/App'))
const WealthSimulator = lazy(() => import('./pages/wealth-simulator/App'))
const PortfolioGenerator = lazy(() => import('./pages/portfolio-generator/App'))
const PortfolioDuels = lazy(() => import('./pages/portfolio-duels/App'))
const PerformanceRankings = lazy(() => import('./pages/performance-rankings/App'))
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
const Presentations = lazy(() => import('./pages/presentations/App'))
const InvestorPortfolio = lazy(() => import('./pages/investor-portfolio/App'))

const FORMAT_COMPONENTS = {
  'dilemme': lazy(() => import('./pages/tweet-midi/formats/dilemme/App.jsx')),
  'fiche-lexique': lazy(() => import('./pages/tweet-midi/formats/lexique/App.jsx')),
  'comparatif-etf': lazy(() => import('./pages/tweet-midi/formats/comparatif/App.jsx')),
  'anniversaire': lazy(() => import('./pages/tweet-midi/formats/anniversaire/App.jsx')),
  'performance-depuis': lazy(() => import('./pages/tweet-midi/formats/performance/App.jsx')),
  'pouvoir-achat': lazy(() => import('./pages/tweet-midi/formats/pouvoir/App.jsx')),
}

// Individual publication routes load their own engine and sources.
// The old /tweet-midi URL remains available for saved links.
const TOOL_ELEMENTS = {
  '/idees-classements': <RankingIdeas />,
  '/hey-grok': <HeyGrok />,
  '/classements-performances': <PerformanceRankings />,
  '/le-dca-de': <DcaProfiles />,
  '/le-budget-de': <BudgetProfiles />,
  '/fiches-pratiques': <PracticalSheets />,
  '/radar-editorial': <EditorialRadar />,
  '/simulateur-patrimoine': <WealthSimulator />,
  '/presentations': <Presentations />,
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
            element={tool.format ? <FormatRoute tool={tool} /> : TOOL_ELEMENTS[tool.to] ?? <ComingSoon title={tool.title} description={tool.description} />}
          />
        ))}
        <Route path="portefeuilles-ia/*" element={<Navigate to="/" replace />} />
        <Route path="presentation-assurance-vie" element={<Navigate to="/presentations?famille=insurance" replace />} />
        <Route path="presentation-scpi" element={<Navigate to="/presentations?famille=scpi" replace />} />
        <Route path="tweet-midi" element={<TweetMidi />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}

function FormatRoute({ tool }) {
  const Component = FORMAT_COMPONENTS[tool.format]
  return <Component key={tool.to} title={tool.title} description={tool.description} />
}
