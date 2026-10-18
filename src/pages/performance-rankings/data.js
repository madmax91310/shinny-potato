import { ASSETS } from '../../data/market-history.js'
import LONG from '../../data/ranking-histories.json' with { type: 'json' }
import ANNUAL from '../../data/ranking-annual.json' with { type: 'json' }
import INDEX_ANNUAL from '../../data/ranking-index-annual.json' with { type: 'json' }
import FTSE from '../../data/ranking-ftse.json' with { type: 'json' }
import { exposureGroup } from '../../data/asset-labels.js'
import { getInstrumentFacts } from '../../data/instrument-facts.js'
import { lastCompleteYear } from '../../data/annual-window.js'
import { isStock } from '../../lib/is-stock.js'
import { commonCoverage } from './engine.js'
import { convertAsset } from './series.js'
import FX from '../../data/monthly-fx.json' with { type: 'json' }

// References to shared histories and validated, automatically refreshed extensions. No hand-entered prices.
export const CATEGORIES = [
  {id:'swiss-finance',label:'Banques et assurances suisses',ids:['ubs','zurich','swiss-re'],currency:'EUR'},
  {id:'europe-health-expanded',label:'Santé européenne',ids:['roche','novartis','novo-nordisk','sanofi','astrazeneca'],currency:'EUR'},
  {id:'europe-banks-expanded',label:'Banques européennes',ids:['ubs','bbva','bnp-paribas','santander'],currency:'EUR'},
  {id:'europe-groups-expanded',label:'Grands groupes européens',ids:['unilever','dhl','basf','enel','relx'],currency:'EUR'},
  {id:'uk-stocks',label:'Grandes actions britanniques',ids:['diageo','relx','lseg','rolls-royce','bae-systems'],currency:'EUR'},
  {id:'europe-defense-expanded',label:'Aéronautique et défense européennes',ids:['airbus','safran','thales','rolls-royce','bae-systems','rheinmetall'],currency:'EUR'},
  {id:'china-platforms',label:'Plateformes et technologie chinoises',ids:['alibaba','jd','meituan','tencent','xiaomi'],currency:'EUR'},
  {id:'ev-batteries',label:'Automobile et batteries',ids:['tesla','byd','toyota','catl'],currency:'EUR'},
  {id:'japan-technology',label:'Industrie et technologie japonaises',ids:['keyence','hitachi','mitsubishi-electric','tokyo-electron','advantest'],currency:'EUR'},
  {id:'japan-groups',label:'Grands groupes japonais',ids:['mitsubishi-corp','softbank-group','recruit','sony','nintendo','toyota'],currency:'EUR'},
  {id:'india-stocks',label:'Grandes actions indiennes',ids:['reliance','hdfc-bank','icici-bank','infosys','tcs'],currency:'EUR'},
  {id:'asia-banks',label:'Banques asiatiques',ids:['hdfc-bank','icici-bank','dbs'],currency:'EUR'},
  {id:'cyber-stocks',label:'Actions de la cybersécurité',ids:['palo-alto-networks','crowdstrike','fortinet'],currency:'EUR'},
  {id:'chip-equipment-design',label:'Équipements et conception de puces',ids:['asml','applied-materials','lam-research','klac','snps','cdns'],currency:'EUR'},
  {id:'network-infrastructure',label:'Réseaux et infrastructures informatiques',ids:['csco','arista','dell','broadcom'],currency:'EUR'},
  {id:'us-platforms',label:'Grandes plateformes américaines',ids:['netflix','uber','airbnb','amazon','booking','meta'],currency:'EUR'},
  {id:'market-operators',label:'Bourses et données financières',ids:['cme','ice','sp-global','moodys','msci','fds'],currency:'EUR'},
  {id:'us-pharma',label:'Pharmacie américaine',ids:['pfe','amgn','gilead','eli-lilly','merck','abbvie'],currency:'EUR'},
  {id:'uk-majors',label:'Grandes capitalisations britanniques (2)',ids:['shell','hsbc','gsk','bat','rio-tinto','glencore'],currency:'EUR'},
  {id:'europe-oil-gas',label:'Pétrole et gaz européens',ids:['shell','bp','eni','equinor','totalenergies'],currency:'EUR'},
  {id:'europe-utilities-stocks',label:'Services aux collectivités européens',ids:['national-grid','orsted','enel','iberdrola'],currency:'EUR'},
  {id:'eurozone-banks',label:'Banques de la zone euro',ids:['ing','deutsche-bank','credit-agricole','societe-generale','intesa-sanpaolo','unicredit'],currency:'EUR'},
  {id:'nordic-industry',label:'Industrie et transition nordiques',ids:['dsv','atlas-copco','volvo','novonesis','orsted'],currency:'EUR'},
  {id:'nordic-finance-energy',label:'Finance et énergie nordiques',ids:['investor-ab','nordea','equinor'],currency:'EUR'},
  {id:'europe-autos',label:'Automobile européenne',ids:['mercedes-benz','volkswagen','stellantis','renault','bmw','ferrari'],currency:'EUR'},
  {id:'luxury-spirits',label:'Luxe et spiritueux',ids:['kering','richemont','pernod-ricard','hermes','lvmh','diageo'],currency:'EUR'},
  {id:'europe-services',label:'Services, conseil et distribution européens',ids:['capgemini','publicis','bouygues','carrefour','wolters-kluwer'],currency:'EUR'},
  {id:'europe-semiconductors',label:'Semi-conducteurs européens',ids:['asm-international','stmicroelectronics','asml','infineon'],currency:'EUR'},
  {id:'amsterdam-leaders',label:'Grandes valeurs d’Amsterdam',ids:['prosus','adyen','ing','heineken','philips','asm-international'],currency:'EUR'},
  {id:'europe-health-2',label:'Santé européenne (2)',ids:['gsk','philips','siemens-healthineers','lonza','novartis','roche'],currency:'EUR'},
  {id:'europe-materials',label:'Matériaux, chimie et mines européens',ids:['sika','givaudan','holcim','rio-tinto','glencore','basf'],currency:'EUR'},
  {id:'italy-leaders',label:'Grandes valeurs italiennes',ids:['intesa-sanpaolo','unicredit','eni','generali','enel','ferrari'],currency:'EUR'},
  {id:'germany-industry-2',label:'Industrie allemande (2)',ids:['siemens-energy','siemens-healthineers','siemens','rheinmetall','basf','infineon'],currency:'EUR'},
  {id:'hong-kong-finance',label:'Finance de Hong Kong et de Chine',ids:['aia','hkex','ping-an','icbc','china-construction-bank'],currency:'EUR'},
  {id:'china-consumer-2',label:'Consommation et plateformes chinoises (2)',ids:['kweichow-moutai','netease','byd','meituan','tencent'],currency:'EUR'},
  {id:'japan-banks-trading',label:'Banques et maisons de commerce japonaises',ids:['mufg','smfg','itochu','mitsui','mitsubishi-corp'],currency:'EUR'},
  {id:'japan-health',label:'Santé japonaise',ids:['daiichi-sankyo','takeda','chugai','hoya'],currency:'EUR'},
  {id:'japan-consumer-telecom',label:'Consommation et télécoms japonais',ids:['fast-retailing','honda','kddi','ntt','sony'],currency:'EUR'},
  {id:'japan-components',label:'Composants et équipements japonais',ids:['murata','disco','nidec','shin-etsu','tokyo-electron','keyence'],currency:'EUR'},
  {id:'india-banks',label:'Banques et crédit indiens',ids:['sbi','axis-bank','kotak-mahindra','bajaj-finance','hdfc-bank','icici-bank'],currency:'EUR'},
  {id:'india-consumer-industry',label:'Consommation, télécoms et industrie indiennes',ids:['hindustan-unilever','itc','bharti-airtel','larsen-toubro','sun-pharma','reliance'],currency:'EUR'},
  {id:'korea-autos-internet',label:'Automobile et internet coréens',ids:['hyundai-motor','kia','naver','samsung'],currency:'EUR'},
  {id:'singapore-banks',label:'Banques de Singapour',ids:['dbs','ocbc','uob'],currency:'EUR'},
  {id:'us-banks',label:'Grandes banques américaines',ids:['wells-fargo','citigroup','jpmorgan','bank-of-america','goldman-sachs','morgan-stanley'],currency:'EUR'},
  {id:'us-industrials-2',label:'Industrie américaine (2)',ids:['boeing','3m','csx','emr','caterpillar','honeywell'],currency:'EUR'},
  {id:'us-telecom-media',label:'Télécoms et médias américains',ids:['cmcsa','tmus','t','netflix','disney'],currency:'EUR'},
  {id:'us-health-2',label:'Santé américaine (2)',ids:['medtronic','dhr','thermo-fisher','abbott','johnson-johnson'],currency:'EUR'},
  {id:'us-tech-services',label:'Services informatiques et puces américains',ids:['accenture','marvell','applovin','ibm','qualcomm'],currency:'EUR'},
  {id:'us-energy-materials',label:'Énergie et matériaux américains',ids:['oxy','shw','chevron','exxonmobil','conocophillips'],currency:'EUR'},
  {id:'defensive-consumer-global',label:'Consommation défensive internationale',ids:['philip-morris','bat','pernod-ricard','heineken','ab-inbev','carrefour'],currency:'EUR'},
  {id:'transport-logistics',label:'Transport et logistique',ids:['fdx','csx','unp','canadian-national-railway','dsv'],currency:'EUR'},
  {id:'canada-leaders',label:'Grandes valeurs canadiennes',ids:['royal-bank-of-canada','shopify','canadian-national-railway','enbridge','toronto-dominion','brookfield'],currency:'EUR'},
  { id: 'world-acwi-net', label: 'World et ACWI · vingt ans · indices nets', ids: ['world-net', 'msciAcwi'], currency: 'USD' },
  { id: 'world-acwi-imi', label: 'World, ACWI et ACWI IMI · indices nets', ids: ['world-net', 'msciAcwi', 'msciAcwiImi'], currency: 'USD' },
  { id: 'regions-indices', label: 'Grandes régions · indices nets', ids: ['world-net', 'msciUsa', 'msciEurope', 'japan-net', 'emerging-net'], currency: 'USD' },
  { id: 'global-indices', label: 'World, ACWI, All-World · indices bruts', ids: ['msciWorld', 'acwi-gross', 'ftseAllWorld'], currency: 'USD' },
  { id: 'multi-asset', label: 'Actions, or, obligations et Bitcoin', ids: ['world-net', 'gold-invesco-usd', 'euroGov13', 'bitcoin'], currency: 'EUR' },
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
  { id: 'us-semiconductors', label: 'Puces américaines', ids: ['nvidia', 'broadcom', 'amd', 'intel', 'qualcomm', 'micron'] },
  { id: 'us-software', label: 'Logiciels américains', ids: ['microsoft', 'oracle', 'adobe', 'salesforce', 'servicenow', 'intuit'] },
  { id: 'payments-finance', label: 'Paiements et finance', ids: ['visa', 'mastercard', 'american-express', 'jpmorgan', 'berkshire', 'blackrock'] },
  { id: 'health-stocks', label: 'Grandes actions de la santé', ids: ['eli-lilly', 'novo-nordisk', 'johnson-johnson', 'abbvie', 'merck', 'astrazeneca'], currency: 'EUR' },
  { id: 'europe-industry', label: 'Industrie européenne', ids: ['schneider', 'siemens', 'abb', 'airbus', 'safran', 'legrand'], currency: 'EUR' },
  { id: 'us-consumer', label: 'Consommation américaine', ids: ['costco', 'walmart', 'amazon', 'home-depot', 'nike', 'mcdonalds'] },
  // L'Oréal spans four beauty divisions, not luxury alone (reviewed 2026-10-17):
  // https://www.loreal.com/fr/our-global-brands-portfolio/
  { id: 'luxury-stocks', label: 'Luxe · Hermès et LVMH', ids: ['hermes', 'lvmh'] },
  { id: 'aerospace-defense', label: 'Aéronautique et défense', ids: ['airbus', 'safran', 'thales', 'ge-aerospace', 'lmt'], currency: 'EUR' },
  { id: 'everyday-brands', label: 'Marques du quotidien', ids: ['cocacola', 'pepsico', 'mcdonalds', 'sbux', 'costco', 'walmart'] },
  { id: 'ai-infrastructure', label: 'Infrastructure de l’IA', ids: ['nvidia', 'broadcom', 'tsmc', 'asml', 'applied-materials', 'lam-research'], currency: 'EUR' },
  { id: 'europe-finance', label: 'Finance européenne', ids: ['bnp-paribas', 'axa', 'allianz', 'santander', 'munich-re'] },
  { id: 'us-equity-etfs', label: 'ETF américains · classiques et équipondérés', ids: ['etfFR0011871110', 'etfFR0011871128', 'etfNasdaqEqual', 'etfEqualWeight'], currency: 'EUR' },
  { id: 'technology-etfs', label: 'ETF tech · États-Unis, monde et semi-conducteurs', ids: ['etfIE00B3WJKG14', 'etfWorldTech', 'etfSemi'], currency: 'EUR' },
  { id: 'small-cap-regions', label: 'ETF petites capitalisations · États-Unis et Europe', ids: ['etfIE00BJ38QD84', 'etfIE0000N55FP4'], currency: 'EUR' },
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
  etfIE00B5BMR087: 'S&P 500', etfFR0011871110: 'Nasdaq-100', etfFR0011871128: 'S&P 500', etfNasdaqEqual: 'Nasdaq-100 équipondéré', etfEqualWeight: 'S&P 500 équipondéré',
  etfIE00B3WJKG14: 'Tech américaine', etfWorldTech: 'Tech mondiale', etfSemi: 'Semi-conducteurs',
  etfIE00BJ38QD84: 'Russell 2000', etfIE0000N55FP4: 'Europe Small Cap',
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
  return INDEX_BASIS[id] ?? (asset.priceUnit === 'points' && asset.variant ? (asset.variant === 'NETR' ? 'index-net' : asset.variant === 'GRTR' ? 'index-gross' : null) : asset.priceMethod === 'adjusted' ? 'adjusted' : null)
}
// Navigation only: an ETF or ETC outside the editorial categories is filed under its exposure
// group (identity and benchmark from the registries), never under a catch-all label.
export function derivedGroup(asset) {
  if (isStock(asset)) return 'Actions individuelles'
  if (asset.priceUnit === 'points') return 'Indices'
  return exposureGroup({ ...asset, name: asset.label, benchmark: asset.isin ? getInstrumentFacts(asset.isin)?.benchmark : undefined })
}
// Longest histories first; a member is kept only while the selection still shares a full year.
function coveredSelection(list, currency) {
  const selected = []
  for (const asset of [...list].sort((x, y) => x.points[0].date.localeCompare(y.points[0].date) || x.id.localeCompare(y.id))) {
    if (selected.length === 6) break
    if (!selected.length) { selected.push(asset); continue }
    try { if (commonCoverage([...selected, asset].map(a => convertAsset(a, currency, FX))).years.length) selected.push(asset) } catch { /* no shared complete year with the longer histories */ }
  }
  return selected.length >= 2 ? selected.map(a => a.id) : []
}
export const slugify = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export function buildRankingAssets(histories) {
  return Object.fromEntries(Object.entries(histories).flatMap(([id, a]) => {
    const basis = comparisonBasis(id, a)
    if (!basis || !a.points?.length) return []
    // Frozen listing prices cannot represent a genuine cross-asset return.
    if (a.points.some((p, i) => i >= 2 && p.price === a.points[i - 1].price && p.price === a.points[i - 2].price)) return []
    return [[id, { ...a, id, basis, shortLabel: SHORT[id] ?? a.label.replace(/^Indice /, ''),
      group: GROUPS[id] ?? derivedGroup({ ...a, basis }),
    }]]
  }))
}
const extended = Object.fromEntries(Object.values(LONG).map(record => [record.targetId ?? record.id, {
  ...ASSETS[record.targetId], ...record, id: record.targetId ?? record.id,
  ...(record.parser === 'msci' || record.id === 'long-sp500' ? { priceUnit: 'points', variant: record.variant ?? 'GRTR' } : { priceMethod: 'adjusted' }),
  points: record.points.map(([date, price]) => ({ date, price })),
}]))
export const RANKING_ASSETS = buildRankingAssets({ ...ASSETS, ...extended, ftseAllWorld: { ...FTSE, priceUnit: 'points', points: FTSE.points.map(([date, price]) => ({ date, price })) } })
// Universes derived from the registry: one ranking per exposure group among the ETF and ETC that
// no editorial category lists. Fixed rule, no hand-picked line: at most six, the longest histories
// first, then the identifier. The checkbox grid still offers the whole group.
export const EXPOSURE_CATEGORIES = (() => {
  const byGroup = new Map()
  for (const a of Object.values(RANKING_ASSETS)) if (a.isin && a.instrumentType !== 'EQUITY' && !GROUPS[a.id]) byGroup.set(a.group, [...(byGroup.get(a.group) ?? []), a])
  return [...byGroup].filter(([, list]) => list.length >= 2).sort(([a], [b]) => a.localeCompare(b, 'fr')).map(([group, list]) => ({
    id: `exposure-${slugify(group)}`, label: `${group} · ETF et ETC du registre`, group, universe: list.length, derived: true, currency: 'EUR',
    ids: coveredSelection(list, 'EUR'),
  })).filter(c => c.ids.length >= 2)
})()
export const ANNUAL_ASSETS = { ...ANNUAL, ...INDEX_ANNUAL }
// PEA calendars: every EUR share flagged PEA with the three latest complete years, grouped by
// exposure; at most six per group, the longest calendars first. The clock bounds the years.
const RECENT_YEARS = [2, 1, 0].map(offset => lastCompleteYear() - offset)
export const ANNUAL_PEA_CATEGORIES = (() => {
  const byGroup = new Map()
  for (const a of Object.values(ANNUAL)) {
    if (!(a.pea && a.currency === 'EUR' && RECENT_YEARS.every(y => Number.isFinite(a.years[y])))) continue
    const group = exposureGroup({ ...a, name: a.label, benchmark: getInstrumentFacts(a.isin)?.benchmark })
    byGroup.set(group, [...(byGroup.get(group) ?? []), a])
  }
  return [...byGroup].sort(([a], [b]) => a.localeCompare(b, 'fr')).map(([group, list]) => ({
    id: `annual-pea-${slugify(group)}`, label: `ETF PEA · ${group} · calendriers NAV`, frequency: 'annual', group, universe: list.length, derived: true,
    ids: [...list].sort((x, y) => Object.keys(y.years).length - Object.keys(x.years).length || x.isin.localeCompare(y.isin)).slice(0, 6).map(a => a.id),
  })).filter(c => c.ids.length >= 2)
})()
export const ANNUAL_CATEGORIES = [
  { id: 'annual-world', label: 'World, ACWI, All-World · années officielles', frequency: 'annual', ids: ['annual-msciWorld', 'annual-acwi-gross', 'annual-ftseAllWorld'], currency: 'USD' },
  ...ANNUAL_PEA_CATEGORIES,
]
// Prepared selections deliberately reserve the sixth slot for a real fund,
// never an index. Prices and dividends continue to come from shared collectors.
const BENCHMARK_GROUPS = [
  ...['swiss-finance','europe-health-expanded','europe-banks-expanded','europe-groups-expanded','uk-stocks','europe-defense-expanded','china-platforms','ev-batteries','japan-technology','japan-groups','india-stocks','asia-banks','uk-majors','eurozone-banks','europe-autos','amsterdam-leaders','europe-health-2','europe-materials','hong-kong-finance','japan-components','canada-leaders','us-banks','us-industrials-2','india-banks','transport-logistics','cyber-stocks','chip-equipment-design','network-infrastructure','us-platforms','market-operators','us-pharma'].filter(id=>CATEGORIES.find(c=>c.id===id).ids.length>=5).map(id=>[id,'etfIE00B4L5Y983']),
  ['us-stocks', 'etfIE00B5BMR087'], ['us-semiconductors', 'etfIE00B5BMR087'],
  ['us-software', 'etfIE00B5BMR087'], ['payments-finance', 'etfIE00B5BMR087'],
  ['us-consumer', 'etfIE00B5BMR087'], ['everyday-brands', 'etfIE00B5BMR087'],
  ['health-stocks', 'etfIE00B4L5Y983'], ['europe-industry', 'etfIE00B4L5Y983'],
  ['fr-stocks', 'etfIE00B4L5Y983'], ['aerospace-defense', 'etfIE00B4L5Y983'],
  ['ai-infrastructure', 'etfIE00B4L5Y983'], ['europe-finance', 'etfIE00B4L5Y983'],
]
export const BENCHMARK_CATEGORIES = BENCHMARK_GROUPS.map(([sourceId, benchmarkId]) => {
  const source = CATEGORIES.find(c => c.id === sourceId)
  return { id: `${sourceId}-benchmark`, label: `${source.label} · face à un ETF ${SHORT[benchmarkId] ?? 'S&P 500'}`,
    ids: [...source.ids.slice(0, 5), benchmarkId], benchmarkId, currency: 'EUR' }
})
export const ALL_CATEGORIES = [...CATEGORIES, ...EXPOSURE_CATEGORIES, ...BENCHMARK_CATEGORIES, ...ANNUAL_CATEGORIES]
export const BENCHMARK_OPTIONS = [
  { id: 'etfIE00B4L5Y983', label: 'MSCI World' },
  { id: 'etfIE00B5BMR087', label: 'S&P 500' },
  { id: 'etfFR0011871110', label: 'Nasdaq-100' },
  { id: 'etfFR0011550193', label: 'Europe · STOXX Europe 600' },
]
export const COLORS = ['#64dfc5', '#e9bd70', '#a9a1ff', '#77b4ef', '#f498a5', '#c2d981']
