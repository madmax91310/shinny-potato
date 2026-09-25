import { ASSETS } from '../portfolio-generator/data.js'
import { FAMILIES } from '../index-comparator/data.js'

// Ces ISIN ont une série 2023-2025 attribuée à la part exacte dans le Générateur.
// Exclure les séries sur indice, sur un autre fonds et les historiques américains de QYLD.
const VERIFIED_IDS = new Set([
  'sp500', 'nasdaq100', 'eurostoxx50', 'msci_em', 'ftse_allworld_vanguard',
  'sect_robotique', 'actions_value', 'smallcap_monde', 'oblig_etat_eur',
  'oblig_hy', 'oblig_corp_ig',
])

const seriesByIsin = new Map(ASSETS.filter((asset) => VERIFIED_IDS.has(asset.id)).map((asset) => [
  asset.isin,
  { id: asset.id, currency: asset.id === 'msci_em' || asset.id === 'ftse_allworld_vanguard' ||
    asset.id === 'sect_robotique' || asset.id === 'actions_value' || asset.id === 'smallcap_monde'
    ? 'USD' : 'EUR', values: asset.r.slice(3) },
]))

// Autre part exacte déjà recoupée auprès de BlackRock dans le Comparateur d'indices.
const quality = FAMILIES.find((family) => family.id === 'style')?.perfFunds.find((fund) => fund.key === 'quality')
if (quality) seriesByIsin.set('IE00BP3QZ601', {
  id: 'quality', currency: 'USD', values: [quality.y2023, quality.y2024, quality.y2025],
})

export function getAnnualPerformance(etf) {
  return seriesByIsin.get(etf.isin) ?? null
}

export function formatAnnualPerformance(series) {
  return [2023, 2024, 2025].map((year, index) => {
    const value = series.values[index]
    return `${year} ${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`
  }).join(' · ')
}
