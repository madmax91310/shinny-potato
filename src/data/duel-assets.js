import annualFx from './annual-fx.json' with { type: 'json' };
import { ASSETS } from './portfolio-assets.js'
import { getInstrumentDuelSeries, getInstrumentCalendarReturns } from './instrument-returns.js'
import { COMPARATOR_RETURNS_BY_ISIN } from './instrument-comparator-returns.js'
import { COMPARATOR_RETURN_EVIDENCE } from './comparator-return-evidence.js'
import { PORTFOLIO_RETURN_EVIDENCE } from './portfolio-return-evidence.js'
import { getInstrumentName } from './instruments.js'

// Taux de fin d’année BCE déjà utilisés dans le duel, sans modification des valeurs.
const historicalFx = { 2019: 1.1234, 2020: 1.2271, 2021: 1.1326, 2022: 1.0666, 2023: 1.1050, 2024: 1.0389, 2025: 1.1750 }
export const EUR_USD = { ...historicalFx, ...Object.fromEntries(Object.entries(annualFx.years).map(([year, row]) => [year, row.value])) }
export const FX_SOURCE = annualFx.sourceUrl
export const ROLES = { base: 'Base', complement: 'Complément', theme: 'Thématique' }

// Sélection éditoriale : les chiffres restent exclusivement dans les registres communs.
const choices = [
 ['gaming_vaneck', 'theme', 'Jeux vidéo et eSport', 'gaming'],
 ['medical_innovation_ishares', 'theme', 'Innovation médicale', 'medical'],
 ['acwi_imi_spdr', 'base', 'MSCI ACWI IMI', 'acwi-imi'],
['sp500_equal_weight', 'base', 'S&P 500 équipondéré', 'equalweight'],
 ['pea_global_amundi', 'base', 'MSCI ACWI en PEA', 'acwi-pea'],
 ['world_ex_usa', 'complement', 'World hors États-Unis', 'exusa'],
 ['russell2000_spdr', 'complement', 'Petites capitalisations américaines', 'us-small'],
 ['oblig_em_usd_ishares', 'complement', 'Dette émergente en dollars', 'em-bond'],
 ['oblig_em_local_ishares_acc', 'complement', 'Dette émergente en monnaies locales', 'em-local-bond'],
 ['oblig_eur_long_ishares', 'complement', 'Obligations d’État euro longues', 'longbond'],
  ['msci_world_ishares', 'base', 'MSCI World', 'world'],
  ['msci_acwi_ishares', 'base', 'MSCI ACWI', 'acwi'],
  ['ftse_allworld_vanguard', 'base', 'FTSE All-World', 'allworld'],
  ['sp500_ishares', 'base', 'S&P 500 (iShares)', 'sp500'],
  ['msci_em', 'complement', 'Marchés émergents IMI', 'em'],
  ['msci_europe', 'complement', 'MSCI Europe', 'europe'],
  ['smallcap_monde', 'complement', 'Petites capitalisations mondiales', 'smallcap'],
  ['nasdaq100', 'complement', 'Nasdaq-100', 'nasdaq'],
  ['actions_japon', 'complement', 'Japon IMI', 'japan'],
  ['actions_india_ishares', 'complement', 'Inde', 'india'],
  ['actions_value', 'complement', 'World Value', 'value'],
  ['world_quality_ishares', 'complement', 'World Quality', 'quality'],
  ['world_momentum_ishares', 'complement', 'World Momentum', 'momentum'],
  ['strat_dividendes', 'complement', 'Global Dividend Aristocrats', 'dividend'],
  ['high_dividend', 'complement', 'High Dividend', 'dividend'],
  ['quality_dividend', 'complement', 'Quality Dividend', 'dividend'],
  ['monetaire_xeon', 'complement', 'Monétaire EUR (XEON)', 'cash'],
  ['oblig_0_1_ishares', 'complement', 'Obligations EUR 0–1 an', 'shortbond'],
  ['oblig_global_agg_eur_hedged', 'complement', 'Obligations mondiales couvertes EUR', 'globalbond'],
  ['sect_financieres', 'theme', 'Financières américaines', 'financials'],
  ['world_minvol_ishares', 'complement', 'World Minimum Volatility', 'minvol'],
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
  ['sect_energie_propre', 'theme', 'Énergies propres', 'cleanenergy'],
  ['infrastructure_ishares', 'theme', 'Infrastructures mondiales', 'infrastructure'],
  ['immo_ishares_yield', 'theme', 'Immobilier coté des pays développés', 'property'],
]
// Devises explicites dans les commentaires vérifiés de portfolio-assets.js (24/09/2026).
// Japon : capture de la fiche officielle du 30/08/2026 ; énergies propres : contrôle du 24/09/2026.
const legacyCurrencies = { msci_europe: 'EUR', sect_sante: 'USD', actions_japon: 'USD', sect_energie_propre: 'USD' }
const fundItems = choices.map(([id, role, label, exposure]) => {
  const asset = ASSETS.find((item) => item.id === id)
  if (!asset?.isin) throw new Error(`ETF absent : ${id}`)
  const evidence = PORTFOLIO_RETURN_EVIDENCE[asset.isin]
  const original = getInstrumentDuelSeries(asset.isin)
  const series = { values: original?.values ?? asset.r, currency: original?.currency ?? evidence?.currency ?? legacyCurrencies[id], source: original?.source ?? evidence?.sourceUrls[0] }
  if (!series?.source || !['EUR', 'USD'].includes(series.currency)) throw new Error(`Preuve de part absente : ${id}`)
  if (asset.r.some((value, i) => series.values[i] !== null && value !== series.values[i])) throw new Error(`Rendements divergents : ${id}`)
  return { id, isin: asset.isin, name: asset.name, role, label, exposure, group: ROLES[role],
    currency: series.currency, values: series.values, source: series.source,
    note: original?.basis === 'proxy' ? original.note : 'Rendements de la part du fonds, revenus réinvestis.', basis: original?.basis ?? 'fund' }
})
// Revue du 02/10/2026 déjà consignée dans verified-returns.js ; aucune année inventée.
const extraFunds = [
  ['em_ex_china', 'IE00BMG6Z448', 'Émergents hors Chine', 'em-ex-china', 'complement'],
  ['semiconducteurs_monde', 'IE000I8KRLL9', 'Semi-conducteurs mondiaux', 'semiconductors'],
  ['financieres_monde', 'IE00BJ5JP097', 'Financières mondiales', 'financials'],
  ['blockchain_ishares', 'IE000RDRMSD1', 'Blockchain', 'blockchain'],
].map(([id, isin, label, exposure, role = 'theme']) => {
  const series = getInstrumentDuelSeries(isin)
  if (!series?.source) throw new Error(`Historique de part absent : ${isin}`)
  return { id, isin, label, exposure, name: getInstrumentName(isin), role, group: ROLES[role],
    ...series, note: 'Rendements de la part exacte, revenus réinvestis ; seules les années complètes disponibles sont comparées.' }
})
const stoxxIsin = 'FR0011550193'
const stoxxEvidence = COMPARATOR_RETURN_EVIDENCE[stoxxIsin]
export const CATALOG = [...fundItems, ...extraFunds, {
  id: 'stoxx600_bnp', isin: stoxxIsin, name: getInstrumentName(stoxxIsin),
  role: 'complement', label: 'STOXX Europe 600', exposure: 'europe', group: ROLES.complement,
  currency: stoxxEvidence.currency, values: [null, null, null, ...COMPARATOR_RETURNS_BY_ISIN[stoxxIsin]],
  source: stoxxEvidence.sourceUrls[0], note: 'Rendements de la part exacte, disponibles sur 2023–2025 seulement.',
}].filter((item) => Number.isFinite(item.values.at(-1)) && item.values.filter(Number.isFinite).length >= 3)
for (const item of CATALOG) item.calendarReturns = getInstrumentCalendarReturns(item.isin, item.values);
export const ITEM_BY_ID = new Map(CATALOG.map((item) => [item.id, item]))

export function euroReturn(item, year) {
  const original = item.calendarReturns?.[year] ?? item.values[year - 2020]
  if (!Number.isFinite(original)) return null
  if (item.currency === 'EUR') return original
  const start = EUR_USD[year - 1]
  const end = EUR_USD[year]
  return start && end ? ((1 + original / 100) * start / end - 1) * 100 : null
}
