import { ASSETS } from '../../data/market-history.js'

// Only references to the shared, automatically refreshed histories. No prices here.
export const CATEGORIES = [
  { id: 'world', label: 'Marchés mondiaux', ids: ['etfIE00B4L5Y983', 'etfIE00B6R52259', 'etfVwce', 'etfImie'] },
  { id: 'europe', label: 'Marchés européens', ids: ['etfFR0011550193', 'etfIE00B53L3W79', 'etfFR0013412038'] },
  { id: 'factors', label: 'Facteurs mondiaux', ids: ['etf_momentum', 'etf_quality', 'etf_value', 'etfMinVol'] },
  { id: 'europe-sectors', label: 'Secteurs européens', ids: ['etfEuropeBanks', 'etfEuropeInsurance', 'etfEuropeUtilities', 'etfEuropeTelecom', 'etfEuropeFood', 'etfEuropeRetail'] },
  { id: 'world-sectors', label: 'Secteurs mondiaux', ids: ['etf_world_staples', 'etf_world_discretionary', 'etf_world_energy', 'etf_health', 'etf_financials'] },
  { id: 'themes', label: 'Thématiques', ids: ['etfLock', 'etf_robotics', 'etfCloudWisdomtree', 'etfLgArtificialIntelligence', 'etfLgBattery'] },
  { id: 'themes-eur', label: 'IA, cyber et jeux vidéo', ids: ['etfAiBigData', 'etfIE00BYPLS672', 'etfIE00BYWQWR46'] },
  { id: 'dividends', label: 'Stratégies dividendes', ids: ['etfTdiv', 'etfIE00B8GKDB10', 'etfIE00B9CQXS71', 'etfIE00B6YX5D40', 'etfIE00B5M1WJ87'] },
  { id: 'bonds', label: 'Obligations', ids: ['euroGov13', 'etfEuroGovt57', 'euroCorporateBond', 'euroHighYieldBond', 'euroInflationBond', 'globalBondEur'] },
  { id: 'small-value', label: 'Small Cap Value', ids: ['etfUsaSmallValue', 'etfSmallValueEurope'] },
  { id: 'lifestrategy', label: 'Portefeuilles LifeStrategy', ids: ['etfLifeStrategy20', 'etfLifeStrategy40', 'etfLifeStrategy60', 'etfLifeStrategy80'] },
  { id: 'us-stocks', label: 'Actions technologiques américaines', ids: ['apple', 'microsoft', 'nvidia', 'amazon', 'google', 'meta'] },
  { id: 'fr-stocks', label: 'Grandes actions françaises', ids: ['lvmh', 'airliquide', 'schneider', 'hermes', 'loreal', 'totalenergies'] },
  { id: 'crypto', label: 'Cryptomonnaies', ids: ['bitcoin', 'ethereum'] },
  { id: 'commodities', label: 'Matières premières via ETC', ids: ['etc_brent_crude_oil', 'etc_wti_crude_oil', 'etc_natural_gas', 'etc_coffee', 'etc_cocoa', 'etc_wheat'] },
]

const SHORT = {
  etfIE00B4L5Y983: 'MSCI World', etfIE00B6R52259: 'MSCI ACWI', etfVwce: 'FTSE All-World', etfImie: 'ACWI IMI',
  etfFR0011550193: 'STOXX Europe 600', etfIE00B53L3W79: 'EURO STOXX 50', etfFR0013412038: 'MSCI Europe',
  etf_momentum: 'Momentum', etf_quality: 'Quality', etf_value: 'Value', etfMinVol: 'Minimum Volatility',
  etfEuropeBanks: 'Banques', etfEuropeInsurance: 'Assurances', etfEuropeUtilities: 'Services collectifs', etfEuropeTelecom: 'Télécommunications', etfEuropeFood: 'Alimentation', etfEuropeRetail: 'Distribution',
  etf_world_staples: 'Consommation de base', etf_world_discretionary: 'Consommation discrét.', etf_world_energy: 'Énergie', etf_health: 'Santé', etf_financials: 'Finance',
  etfLock: 'Cybersécurité', etf_robotics: 'Robotique', etfCloudWisdomtree: 'Cloud', etfLgArtificialIntelligence: 'Intelligence artificielle', etfLgBattery: 'Batteries',
  etfAiBigData: 'IA et Big Data', etfIE00BYPLS672: 'Cybersécurité L&G', etfIE00BYWQWR46: 'Jeux vidéo',
  etfTdiv: 'Dividend Leaders', etfIE00B8GKDB10: 'All-World High Dividend', etfIE00B9CQXS71: 'Global Dividend Aristocrats', etfIE00B6YX5D40: 'US Dividend Aristocrats', etfIE00B5M1WJ87: 'Euro Dividend Aristocrats',
  euroGov13: 'États euro 1–3 ans', etfEuroGovt57: 'États euro 5–7 ans', euroCorporateBond: 'Entreprises euro IG', euroHighYieldBond: 'Entreprises euro HY', euroInflationBond: 'Obligations inflation', globalBondEur: 'Obligations mondiales',
  etfUsaSmallValue: 'USA Small Cap Value', etfSmallValueEurope: 'Europe Small Cap Value',
  etfLifeStrategy20: 'LifeStrategy 20', etfLifeStrategy40: 'LifeStrategy 40', etfLifeStrategy60: 'LifeStrategy 60', etfLifeStrategy80: 'LifeStrategy 80',
  etc_brent_crude_oil: 'Pétrole Brent', etc_wti_crude_oil: 'Pétrole WTI', etc_natural_gas: 'Gaz naturel', etc_coffee: 'Café', etc_cocoa: 'Cacao', etc_wheat: 'Blé',
}
const GROUPS = Object.fromEntries(CATEGORIES.flatMap(c => c.ids.map(id => [id, c.label])))
const INDEX_BASIS = {
  msciWorld: 'index-gross', msciEmerging: 'index-gross', msciWorldSmallCap: 'index-gross', russell2000: 'index-gross', sp500: 'index-gross', nasdaq100: 'index-gross',
  stoxx600: 'index-net', msciEurope: 'index-net', msciUsa: 'index-net', msciIndia: 'index-net', msciEmergingExChina: 'index-net',
  msciWorldMomentum: 'index-net', msciWorldQuality: 'index-net', msciWorldValue: 'index-net', msciAcwiImi: 'index-net', msciWorldExUsa: 'index-net', msciAcwi: 'index-net',
}
export function comparisonBasis(id, asset) {
  if (id === 'or') return 'monthly-average'
  if (id === 'cac40') return 'price-index'
  if (id === 'silver') return 'futures-price'
  if (['bitcoin', 'ethereum'].includes(id)) return 'spot-close'
  return INDEX_BASIS[id] ?? (asset.priceMethod === 'adjusted' ? 'adjusted' : null)
}
export function buildRankingAssets(histories) {
  return Object.fromEntries(Object.entries(histories).flatMap(([id, a]) => {
    const basis = comparisonBasis(id, a)
    if (!basis || !a.points?.length) return []
    return [[id, { ...a, id, basis, shortLabel: SHORT[id] ?? a.label.replace(/^Indice /, ''),
      group: GROUPS[id] ?? (a.isin ? 'Autres ETF et ETC' : a.priceUnit === 'points' ? 'Indices' : 'Actions et autres actifs'),
    }]]
  }))
}
export const RANKING_ASSETS = buildRankingAssets(ASSETS)
export const COLORS = ['#64dfc5', '#e9bd70', '#a9a1ff', '#77b4ef', '#f498a5', '#c2d981']
