// Ces traductions s'appliquent aux caractéristiques, jamais aux noms de produits.
const LABELS = {
  Ireland: 'Irlande', Physical: 'Réplication physique', Synthetic: 'Réplication synthétique',
  Optimised: 'Réplication optimisée',
  'Physical (Optimised)': 'Réplication physique optimisée',
  'Physical (Replicated)': 'Réplication physique intégrale',
  'Physical (Sampled)': 'Réplication physique échantillonnée',
  'Direct Replication (physically)': 'Réplication physique directe',
  'Synthetic - fully funded collateralised swap': 'Swap intégralement financé et garanti',
  Germany: 'Allemagne', Switzerland: 'Suisse', 'United Kingdom': 'Royaume-Uni',
  'United States': 'États-Unis', Japan: 'Japon', Netherlands: 'Pays-Bas',
  Italy: 'Italie', Spain: 'Espagne', Sweden: 'Suède', Denmark: 'Danemark',
  Finland: 'Finlande', Belgium: 'Belgique', Norway: 'Norvège', Austria: 'Autriche',
  China: 'Chine', Taiwan: 'Taïwan', 'South Korea': 'Corée du Sud', 'Korea (South)': 'Corée du Sud',
  India: 'Inde', Australia: 'Australie', Brazil: 'Brésil', Mexico: 'Mexique',
  'South Africa': 'Afrique du Sud', 'Saudi Arabia': 'Arabie saoudite',
  'Information Technology': 'Technologie', Technology: 'Technologie', Financials: 'Finance',
  'Consumer Discretionary': 'Consommation cyclique', 'Consumer Staples': 'Consommation de base',
  'Communication Services': 'Communication', Industrials: 'Industrie',
  'Health Care': 'Santé', Healthcare: 'Santé', Materials: 'Matériaux', Utilities: 'Services publics',
  Energy: 'Énergie', 'Real Estate': 'Immobilier', Other: 'Autres', Others: 'Autres',
  'Cash and/or Derivatives': 'Liquidités et dérivés', Cash: 'Liquidités', Treasury: 'Emprunts d’État',
}
const lookup = new Map(Object.entries(LABELS).map(([key, value]) => [key.toLowerCase(), value]))
export function frenchCharacteristic(value = '') {
  return lookup.get(value.toLowerCase()) ?? value
}
export function frenchLocation(value = '') {
  return value.split(/,\s*/).map(frenchCharacteristic).join(' · ')
}
