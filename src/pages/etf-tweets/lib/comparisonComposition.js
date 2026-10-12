import { COMPARISON_ETF_DETAILS } from '../../../data/comparison-etf-details.js'
import { AUTOMATED_ETF } from '../../../data/automated-etf.js'

export function getComparisonComposition(isin, field) {
  const details = COMPARISON_ETF_DETAILS[isin]
  const observation = AUTOMATED_ETF[isin]?.[field]
  const basis = observation?.basis ?? (field === 'countries' ? details?.countriesBasis : details?.basis)
  return {
    rows: [...(details?.[field] ?? [])].filter(([label, value]) => Number.isFinite(value) && value > 0 && !/^(other|others|autres)$/i.test(label)).sort((a, b) => b[1] - a[1]).slice(0, 3),
    asOf: details?.[`${field}AsOf`] ?? details?.asOf,
    isIndex: basis === 'index' || basis === 'tracked-index',
  }
}
export const COMPOSITION_LABELS = {
  Treasury: 'Emprunts d’État', 'Cash and/or Derivatives': 'Liquidités / dérivés',
  Italy: 'Italie', Spain: 'Espagne',
  'Information Technology': 'Technologie', Technology: 'Technologie', Financials: 'Finance', 'Consumer Discretionary': 'Conso. cyclique',
  'Consumer Staples': 'Conso. de base', 'Communication Services': 'Communication', Industrials: 'Industrie',
  'Health Care': 'Santé', Healthcare: 'Santé', Materials: 'Matériaux', Utilities: 'Services publics',
  Energy: 'Énergie', 'Real Estate': 'Immobilier', Other: 'Autres',
  'Korea (South)': 'Corée du Sud', 'Korea, Republic of': 'Corée du Sud', Taiwan: 'Taïwan', 'South Korea': 'Corée du Sud', China: 'Chine', Brazil: 'Brésil', Mexico: 'Mexique',
  'South Africa': 'Afrique du Sud', 'Saudi Arabia': 'Arabie saoudite', UAE: 'Émirats arabes unis',
  'United Arab Emirates': 'Émirats arabes unis', 'United States': 'États-Unis', 'United Kingdom': 'Royaume-Uni',
  Japan: 'Japon', Germany: 'Allemagne', Switzerland: 'Suisse', Netherlands: 'Pays-Bas', India: 'Inde',
}
