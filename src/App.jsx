import { Routes, Route } from 'react-router-dom'
import Layout from './design-system/Layout'
import Home from './pages/Home'
import ComingSoon from './pages/ComingSoon'
import PortfolioGenerator from './pages/portfolio-generator/App'
import BrokerComparator from './pages/broker-comparator/App'
import InvestmentCalculator from './pages/investment-calculator/App'
import EtfSheets from './pages/etf-sheets/App'
import TweetMidi from './pages/tweet-midi/App'
import IndexComparator from './pages/index-comparator/App'
import FeeImpact from './pages/fee-impact/App'
import { TOOLS } from './tools'

// Tweets ETF, Lexique financier et Pouvoir d'achat n'ont plus de route dédiée : leurs pages
// (etf-tweets/App, lexique-financier/App, purchasing-power/App) faisaient doublon avec les formats
// équivalents de Tweet Midi (Comparatif ETF, Fiche lexique, Pouvoir d'achat), qui produisent le même
// texte via les mêmes données/fonctions (cf. tweet-midi/data/comparatifEtf.js, ficheLexique.js,
// tweet-midi/lib.js) — retiré du dashboard/routing le 03/09/2026 à la demande de l'utilisateur,
// désormais accessibles uniquement depuis Tweet Midi. Les fichiers data.js/lib.js de ces 3 dossiers
// restent utilisés (importés par Tweet Midi) ; seuls leurs App.jsx (page autonome) sont orphelins.
const TOOL_ELEMENTS = {
  '/generateur-portefeuilles': <PortfolioGenerator />,
  '/comparatif-courtiers': <BrokerComparator />,
  '/calculateur-investissement': <InvestmentCalculator />,
  '/fiches-etf': <EtfSheets />,
  '/tweet-midi': <TweetMidi />,
  '/comparateur-indices': <IndexComparator />,
  '/impact-frais': <FeeImpact />,
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
