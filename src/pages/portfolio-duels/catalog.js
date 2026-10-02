import { ASSETS } from '../../data/portfolio-assets.js'
import { getInstrumentDuelSeries } from '../../data/instrument-returns.js'
import { COMPARATOR_RETURNS_BY_ISIN } from '../../data/instrument-comparator-returns.js'
import { COMPARATOR_RETURN_EVIDENCE } from '../../data/comparator-return-evidence.js'
import { PORTFOLIO_RETURN_EVIDENCE } from '../../data/portfolio-return-evidence.js'
import { getInstrumentName } from '../../data/instruments.js'

// Taux de fin d’année BCE déjà utilisés dans le duel, sans modification des valeurs.
export const EUR_USD = { 2019: 1.1234, 2020: 1.2271, 2021: 1.1326, 2022: 1.0666, 2023: 1.1050, 2024: 1.0389, 2025: 1.1750 }
export const FX_SOURCE = 'https://www.ecb.europa.eu/stats/exchange/eurofxref/shared/pdf/2025/12/20251231.pdf'
export const ROLES = { base: 'Base', complement: 'Complément', theme: 'Thématique' }

// Sélection éditoriale : les chiffres restent exclusivement dans les registres communs.
const choices = [
  ['msci_world_ishares', 'base', 'MSCI World', 'world'],
  ['msci_acwi_ishares', 'base', 'MSCI ACWI', 'acwi'],
  ['msci_acwi', 'base', 'MSCI ACWI (SPDR)', 'acwi'],
  ['ftse_allworld_vanguard', 'base', 'FTSE All-World', 'allworld'],
  ['sp500_ishares', 'base', 'S&P 500 (iShares)', 'sp500'],
  ['sp500', 'base', 'S&P 500 (Amundi PEA)', 'sp500'],
  ['msci_em', 'complement', 'Marchés émergents IMI', 'em'],
  ['msci_europe', 'complement', 'MSCI Europe', 'europe'],
  ['smallcap_monde', 'complement', 'Petites capitalisations mondiales', 'smallcap'],
  ['sect_tech_world_ishares', 'theme', 'Technologie mondiale', 'tech'],
  ['sect_energy_spdr', 'theme', 'Énergie mondiale', 'energy'],
  ['sect_sante', 'theme', 'Santé américaine', 'health'],
  ['sect_cyber_lg', 'theme', 'Cybersécurité', 'cyber'],
  ['sect_ai_lg', 'theme', 'Intelligence artificielle', 'ai'],
  ['sect_robotique', 'theme', 'Robotique', 'robotics'],
  ['sect_biotech_ishares', 'theme', 'Biotechnologie américaine', 'biotech'],
  ['sect_water_amundi', 'theme', 'Eau', 'water'],
  ['sect_luxury_amundi', 'theme', 'Luxe', 'luxury'],
  ['sect_batteries_lg', 'theme', 'Batteries', 'batteries'],
]
// Devises explicites dans les commentaires vérifiés de portfolio-assets.js (24/09/2026).
const legacyCurrencies = { msci_europe: 'EUR', sect_sante: 'USD' }
const fundItems = choices.map(([id, role, label, exposure]) => {
  const asset = ASSETS.find((item) => item.id === id)
  if (!asset?.isin) throw new Error(`ETF absent : ${id}`)
  const evidence = PORTFOLIO_RETURN_EVIDENCE[asset.isin]
  const original = getInstrumentDuelSeries(asset.isin)
  const series = { values: original?.values ?? asset.r, currency: original?.currency ?? evidence?.currency ?? legacyCurrencies[id], source: original?.source ?? evidence?.sourceUrls[0] }
  if (!series?.source || !['EUR', 'USD'].includes(series.currency)) throw new Error(`Preuve de part absente : ${id}`)
  if (asset.r.some((value, i) => value !== series.values[i])) throw new Error(`Rendements divergents : ${id}`)
  return { id, isin: asset.isin, name: asset.name, role, label, exposure, group: ROLES[role],
    currency: series.currency, values: series.values, source: series.source,
    note: 'Rendements de la part du fonds, revenus réinvestis.' }
})
const stoxxIsin = 'FR0011550193'
const stoxxEvidence = COMPARATOR_RETURN_EVIDENCE[stoxxIsin]
export const CATALOG = [...fundItems, {
  id: 'stoxx600_bnp', isin: stoxxIsin, name: getInstrumentName(stoxxIsin),
  role: 'complement', label: 'STOXX Europe 600', exposure: 'europe', group: ROLES.complement,
  currency: stoxxEvidence.currency, values: [null, null, null, ...COMPARATOR_RETURNS_BY_ISIN[stoxxIsin]],
  source: stoxxEvidence.sourceUrls[0], note: 'Rendements de la part exacte, disponibles sur 2023–2025 seulement.',
}].filter((item) => Number.isFinite(item.values.at(-1)) && item.values.filter(Number.isFinite).length >= 3)
export const ITEM_BY_ID = new Map(CATALOG.map((item) => [item.id, item]))

export function euroReturn(item, year) {
  const original = item.values[year - 2020]
  if (!Number.isFinite(original)) return null
  if (item.currency === 'EUR') return original
  const start = EUR_USD[year - 1]
  const end = EUR_USD[year]
  return start && end ? ((1 + original / 100) * start / end - 1) * 100 : null
}
