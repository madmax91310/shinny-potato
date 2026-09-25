import { ASSETS } from '../portfolio-generator/data.js'
import { VERIFIED_RETURNS } from './verifiedReturns.js'

// Ces ISIN ont une série 2020-2025 attribuée à la part exacte dans le Générateur.
// Exclure les séries sur indice, sur un autre fonds et les historiques américains de QYLD.
const VERIFIED_IDS = new Set([
  'sp500', 'nasdaq100', 'eurostoxx50', 'msci_em', 'ftse_allworld_vanguard',
  'sect_robotique', 'actions_value', 'smallcap_monde', 'oblig_etat_eur',
  'oblig_hy', 'oblig_corp_ig', 'or_ishares',
])

const seriesByIsin = new Map(ASSETS.filter((asset) => VERIFIED_IDS.has(asset.id)).map((asset) => [
  asset.isin,
  { id: asset.id, currency: asset.id === 'msci_em' || asset.id === 'ftse_allworld_vanguard' ||
    asset.id === 'sect_robotique' || asset.id === 'actions_value' || asset.id === 'smallcap_monde'
    || asset.id === 'or_ishares' ? 'USD' : 'EUR', values: asset.r },
]))

for (const [isin, series] of Object.entries(VERIFIED_RETURNS)) seriesByIsin.set(isin, series)

export function getAnnualPerformance(etf) {
  return seriesByIsin.get(etf.isin) ?? null
}

export function formatAnnualPerformance(series) {
  return [2020, 2021, 2022, 2023, 2024, 2025].flatMap((year, index) => {
    const value = series.values[index]
    return Number.isFinite(value) ? [`${year} ${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`] : []
  }).join(' · ')
}

export function annualPerformanceRange(series) {
  const first = series.values.findIndex(Number.isFinite)
  return `${2020 + first}–2025`
}
