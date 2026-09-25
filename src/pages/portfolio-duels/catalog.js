import { ETFS } from '../etf-sheets/data.js'
import { getAnnualPerformance } from '../etf-sheets/annualPerformance.js'
import { ASSETS, YEARS } from '../portfolio-generator/data.js'
import { ASSETS as CALCULATOR_ASSETS } from '../investment-calculator/data.js'

// Taux BCE EUR/USD des derniers jours ouvrés de chaque année, déjà documentés pour
// la conversion de l'ETC argent dans le Générateur de portefeuilles.
export const EUR_USD = { 2019: 1.1234, 2020: 1.2271, 2021: 1.1326, 2022: 1.0666, 2023: 1.1050, 2024: 1.0389, 2025: 1.1750 }
export const FX_SOURCE = 'https://www.ecb.europa.eu/stats/exchange/eurofxref/shared/pdf/2025/12/20251231.pdf'

const etfs = new Map(ETFS.map((etf) => [etf.isin, etf]))
const CORES = new Set(['sp500', 'sp500_ishares', 'msci_world_ishares', 'msci_acwi_ishares', 'ftse_allworld_vanguard', 'msci_world', 'msci_acwi'])
const STOCKS = ['apple', 'microsoft', 'nvidia', 'amazon', 'google', 'meta', 'visa', 'cocacola', 'netflix', 'broadcom', 'tesla', 'lvmh', 'nestle', 'sap']
const ALTERNATIVES = new Set(['or', 'or_ishares', 'or_amundi', 'or_wisdomtree', 'argent', 'mp_large', 'mp_large_icom', 'foncieres_etf'])
// Fonds déjà sourcés dans le générateur mais absents du catalogue des fiches ETF.
const EXISTING_FUND_SERIES = {
  msci_world_ishares: { currency: 'USD', source: 'https://www.ishares.com/gls-download/literature/fact-sheet/swda-ishares-core-msci-world-ucits-etf-fund-fact-sheet-en-gb.pdf' },
  sp500_ishares: { currency: 'USD', source: 'https://www.ishares.com/uk/individual/en/products/253743/ishares-core-sp-500-ucits-etf' },
  msci_acwi: { currency: 'USD', source: 'https://www.ssga.com/uk/en_gb/intermediary/etfs/spdr-msci-acwi-ucits-etf-spyy-gy' },
  or: { currency: 'USD', source: 'https://www.invesco.com/content/dam/invesco/emea/en/product-documents/etf/share-class/factsheet/IE00B579F325_factsheet_en.pdf' },
  foncieres_etf: { currency: 'EUR', source: 'https://www.amundietf.fr/pdfDocuments/monthly-factsheet/LU1437018838/FRA/FRA/INSTITUTIONNEL/ETF/20251231' },
}

function stockSeries(key) {
  const stock = CALCULATOR_ASSETS[key]
  const points = new Map(stock.points.map(({ date, price }) => [date, price]))
  return YEARS.map((year) => {
    const previous = points.get(`${year - 1}-12`)
    const current = points.get(`${year}-12`)
    return Number.isFinite(previous) && Number.isFinite(current) && previous > 0
      ? (current / previous - 1) * 100 : null
  })
}

const fundItems = ASSETS.flatMap((asset) => {
  const card = etfs.get(asset.isin)
  const series = (card && getAnnualPerformance(card)) ?? (EXISTING_FUND_SERIES[asset.id] && {
    ...EXISTING_FUND_SERIES[asset.id], values: asset.r,
  })
  if (!series || !['EUR', 'USD'].includes(series.currency) || !series.values.some(Number.isFinite)) return []
  // Le montant calculé doit désigner la part exacte, jamais un indice ou un autre fonds.
  if (asset.r.some((value, i) => Number.isFinite(series.values[i]) && value !== series.values[i])) return []
  const group = CORES.has(asset.id) ? 'Cœur ETF' : ALTERNATIVES.has(asset.id) || asset.cat === 'immobilier' || asset.cat === 'matieres_premieres'
    ? 'Immobilier et matières premières' : 'ETF thématiques et autres'
  return [{ id: asset.id, name: asset.name, group, currency: series.currency, values: series.values,
    source: series.source ?? null, note: 'Rendements de la part du fonds, revenus réinvestis selon la part.' }]
})

const stockItems = STOCKS.map((id) => ({ id: `action_${id}`, name: CALCULATOR_ASSETS[id].label, group: 'Actions individuelles',
  currency: CALCULATOR_ASSETS[id].currency, values: stockSeries(id), source: null,
  note: 'Cours de clôture annuels issus du calculateur, hors dividendes.' }))

const otherItems = [
  { id: 'spot_bitcoin', name: 'Bitcoin (cours spot)', group: 'Crypto', currency: 'USD', values: ASSETS.find((a) => a.id === 'bitcoin').r,
    source: 'https://www.slickcharts.com/currency/BTC/returns', note: 'Cours spot, hors frais et rendement de tout ETP.' },
  { id: 'spot_ethereum', name: 'Ethereum (cours spot)', group: 'Crypto', currency: 'USD', values: ASSETS.find((a) => a.id === 'ethereum').r,
    source: 'https://www.slickcharts.com/currency/ETH/returns', note: 'Cours spot, sans staking ni frais d’ETP.' },
  { id: 'scpi', name: 'SCPI (moyenne de marché)', group: 'Immobilier et matières premières', currency: 'EUR',
    values: [null, ...ASSETS.find((a) => a.id === 'scpi').r.slice(1)],
    source: 'https://www.aspim.fr/', note: 'Moyenne de marché ASPIM, non investissable comme une part précise ; 2020 écarté (méthode différente).' },
  // L'argent est une estimation en EUR du fonds exact ; ne pas la présenter comme une NAV officielle.
  { id: 'argent_indicatif', name: 'iShares Physical Silver ETC (estimation EUR)', group: 'Immobilier et matières premières', currency: 'EUR',
    values: ASSETS.find((a) => a.id === 'argent').r, source: 'https://www.ishares.com/uk/individual/en/products/258443/',
    note: 'Rendement de l’ETC en USD converti à titre indicatif en EUR avec les taux BCE.' },
]

export const CATALOG = [...fundItems, ...stockItems, ...otherItems]
  .filter((item) => Number.isFinite(item.values.at(-1)) && item.values.filter(Number.isFinite).length >= 3)
  .filter((item, i, list) => list.findIndex((other) => other.id === item.id) === i)
  .sort((a, b) => a.group.localeCompare(b.group, 'fr') || a.name.localeCompare(b.name, 'fr'))
export const ITEM_BY_ID = new Map(CATALOG.map((item) => [item.id, item]))

export function euroReturn(item, year) {
  const original = item.values[year - 2020]
  if (!Number.isFinite(original)) return null
  if (item.currency === 'EUR') return original
  const start = EUR_USD[year - 1]
  const end = EUR_USD[year]
  return start && end ? ((1 + original / 100) * start / end - 1) * 100 : null
}
