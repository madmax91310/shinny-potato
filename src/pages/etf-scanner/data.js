// Examples reference the common instrument registry; no copied market data.
export const EXAMPLES = [
  { label: 'World + USA', lines: [{ isin: 'IE00B4L5Y983', weight: 80 }, { isin: 'IE00B5BMR087', weight: 20 }] },
  { label: 'World + émergents', lines: [{ isin: 'IE00B4L5Y983', weight: 80 }, { isin: 'IE00BKM4GZ66', weight: 20 }] },
  { label: 'World + petites capitalisations', lines: [{ isin: 'IE00B4L5Y983', weight: 80 }, { isin: 'IE00BF4RFH31', weight: 20 }] },
]
export const newPlan = () => ({ version: 1, comparison: false, a: structuredClone(EXAMPLES[0].lines), b: structuredClone(EXAMPLES[1].lines) })
export const LABELS = {
  'United States': 'États-Unis', 'United Kingdom': 'Royaume-Uni', Germany: 'Allemagne', France: 'France', Japan: 'Japon', Switzerland: 'Suisse', China: 'Chine', Taiwan: 'Taïwan', 'Korea (South)': 'Corée du Sud', Canada: 'Canada', Netherlands: 'Pays-Bas', Australia: 'Australie', India: 'Inde', Spain: 'Espagne', Italy: 'Italie', Sweden: 'Suède',
  'Information Technology': 'Technologie', Financials: 'Finance', Industrials: 'Industrie', 'Health Care': 'Santé', 'Consumer Discretionary': 'Consommation discrétionnaire', 'Consumer Staples': 'Consommation courante', Communication: 'Communication', 'Communication Services': 'Communication', Energy: 'Énergie', Materials: 'Matériaux', Utilities: 'Services collectifs', 'Real Estate': 'Immobilier',
}
export const displayLabel = name => LABELS[name] ?? name
