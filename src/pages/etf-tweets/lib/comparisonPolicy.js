import { INSTRUMENT_FACTS_BY_ISIN } from '../../../data/instrument-facts.js'

// Classification par produit : un thème (IA, défense, énergies propres…) peut
// traverser plusieurs secteurs. Il ne devient pas sectoriel à cause de son nom.
const SECTOR_FUNDS = new Set([
  'LU1834988518', 'DE000A0H08Q4', // Technologie européenne
  'IE00BJ5JNZ06', 'IE00BM67HK77', 'LU1834986900', // Santé
  'IE00BYZK4776', 'IE00BYXG2H39', // Innovation médicale / biotechnologies
  'IE00BDFBTQ78', 'LU1834983550', 'LU1834983634', 'IE00BM67HS53', // Mines / matériaux
  'IE00B4JNQZ49', 'IE00BJ5JP097', // Finance
  'IE000I8KRLL9', 'IE00BJ5JNY98', // Semi-conducteurs / technologie
  'IE00BYWQWR46', // Jeux vidéo
  'IE00B1FZS350', // Immobilier coté (les infrastructures restent multisectorielles)
])

// Compléments vérifiés pour les trois parts absentes du registre des fiches.
// Ne déduire la réplication ni du statut PEA ni de la composition affichée.
const REVIEWED_REPLICATION = {
  IE00BDFBTQ78: { method: 'Physical', source: 'https://www.vaneck.com/fr/fr/library/fact-sheets/gdig-fact-sheet/', checkedAt: '2026-10-06' },
  LU1834983634: { method: 'Synthetic', source: 'https://www.amundi.cz/produkty/dl/doc/monthly-factsheet/LU1834983634/CES/CZE/RETAIL/AMUNDI/20260430', checkedAt: '2026-10-06' },
  IE00BM67HS53: { method: 'Physical', source: 'https://etf.dws.com/download/asset/ed8fa918-6200-4e76-b472-a3bf2040e855', checkedAt: '2026-10-06' },
}

export function isComparisonEtc(etf) {
  return Boolean(etf.isCopperEtc || /\bETC\b/i.test(etf.nom ?? ''))
}

export function getComparisonPolicy(etf) {
  const etc = isComparisonEtc(etf)
  const sector = SECTOR_FUNDS.has(etf.isin)
  return { kind: etc ? 'etc' : sector ? 'sector' : 'multisector', showHoldings: !etc, showSectors: !etc && !sector }
}

export function getComparisonReplication(etf) {
  if (isComparisonEtc(etf)) return null // Adossement et contrats à terme décrits dans l’exposition.
  const method = INSTRUMENT_FACTS_BY_ISIN[etf.isin]?.replicationMethod ?? REVIEWED_REPLICATION[etf.isin]?.method
  if (/synthetic/i.test(method ?? '')) return 'synthétique'
  if (/physical/i.test(method ?? '')) return 'physique'
  return null
}
