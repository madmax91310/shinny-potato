import { lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './design-system/Layout'
import Home from './pages/Home'
import ComingSoon from './pages/ComingSoon'
import { TOOLS } from './tools'

// Each tool and its data are fetched only when its route is opened.
const PortfolioGenerator = lazy(() => import('./pages/portfolio-generator/App'))
const PortfolioDuels = lazy(() => import('./pages/portfolio-duels/App'))
const BrokerComparator = lazy(() => import('./pages/broker-comparator/App'))
const InvestmentCalculator = lazy(() => import('./pages/investment-calculator/App'))
const EtfSheets = lazy(() => import('./pages/etf-sheets/App'))
const TweetMidi = lazy(() => import('./pages/tweet-midi/App'))
const IndexComparator = lazy(() => import('./pages/index-comparator/App'))
const FeeImpact = lazy(() => import('./pages/fee-impact/App'))
const MarketFacts = lazy(() => import('./pages/market-facts/App'))
const ConcreteCases = lazy(() => import('./pages/concrete-cases/App'))
const TweetBank = lazy(() => import('./pages/tweet-bank/App'))
const FactsheetTweets = lazy(() => import('./pages/factsheet-tweets/App'))
const DataSearch = lazy(() => import('./pages/data-search/App'))
const HouseholdApp = lazy(() => import('./pages/france-100-menages/App'))
const DataReview = lazy(() => import('./pages/data-review/App'))
const InvestorPortfolio = lazy(() => import('./pages/investor-portfolio/App'))

// Tweets ETF, Lexique financier et Pouvoir d'achat n'ont plus de route dédiée : leurs pages
// faisaient doublon avec les formats équivalents de Tweet Midi (Comparatif ETF, Fiche lexique,
// Pouvoir d'achat), qui produisent le même texte via les mêmes données/fonctions (cf.
// tweet-midi/data/comparatifEtf.js, ficheLexique.js, tweet-midi/lib.js) — retiré du
// dashboard/routing le 03/09/2026 à la demande de l'utilisateur, désormais accessibles uniquement
// depuis Tweet Midi. Leurs App.jsx de page autonome (devenus du code mort une fois la route retirée)
// ont été supprimés le 14/09/2026 après vérification qu'aucun import résiduel n'y pointait — seuls
// lib.js subsiste pour les fonctions de formatage ; les données vivent dans src/data/.
// Les anciens data.js ne sont que des réexports de compatibilité.
const TOOL_ELEMENTS = {
  '/france-100-menages': <HouseholdApp />,
  '/donnees-a-revoir': <DataReview />,
  '/bibliotheque-donnees': <DataSearch />,
  '/generateur-portefeuilles': <PortfolioGenerator />,
  '/duels-portefeuilles': <PortfolioDuels />,
  '/comparatif-courtiers': <BrokerComparator />,
  '/calculateur-investissement': <InvestmentCalculator />,
  '/fiches-etf': <EtfSheets />,
  '/tweet-midi': <TweetMidi />,
  '/comparateur-indices': <IndexComparator />,
  '/impact-frais': <FeeImpact />,
  '/faits-marquants-marches': <MarketFacts />,
  '/cas-concrets': <ConcreteCases />,
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
            element={TOOL_ELEMENTS[tool.to] ?? <ComingSoon title={tool.title} description={tool.description} />}
          />
        ))}
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
