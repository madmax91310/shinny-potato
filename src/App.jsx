import { Routes, Route } from 'react-router-dom'
import Layout from './design-system/Layout'
import Home from './pages/Home'
import ComingSoon from './pages/ComingSoon'
import PortfolioGenerator from './pages/portfolio-generator/App'
import PortfolioDuels from './pages/portfolio-duels/App'
import BrokerComparator from './pages/broker-comparator/App'
import InvestmentCalculator from './pages/investment-calculator/App'
import EtfSheets from './pages/etf-sheets/App'
import TweetMidi from './pages/tweet-midi/App'
import IndexComparator from './pages/index-comparator/App'
import FeeImpact from './pages/fee-impact/App'
import MarketFacts from './pages/market-facts/App'
import ConcreteCases from './pages/concrete-cases/App'
import TweetBank from './pages/tweet-bank/App'
import { TOOLS } from './tools'

// Tweets ETF, Lexique financier et Pouvoir d'achat n'ont plus de route dédiée : leurs pages
// faisaient doublon avec les formats équivalents de Tweet Midi (Comparatif ETF, Fiche lexique,
// Pouvoir d'achat), qui produisent le même texte via les mêmes données/fonctions (cf.
// tweet-midi/data/comparatifEtf.js, ficheLexique.js, tweet-midi/lib.js) — retiré du
// dashboard/routing le 03/09/2026 à la demande de l'utilisateur, désormais accessibles uniquement
// depuis Tweet Midi. Leurs App.jsx de page autonome (devenus du code mort une fois la route retirée)
// ont été supprimés le 14/09/2026 après vérification qu'aucun import résiduel n'y pointait — seuls
// data.js/lib.js de ces 3 dossiers subsistent (etf-tweets a aussi gardé lib/tweetFormat.js), encore
// importés par Tweet Midi.
const TOOL_ELEMENTS = {
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
