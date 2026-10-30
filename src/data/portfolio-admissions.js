import { QUALIFIED_FUND_CALENDARS } from './qualified-annual-calendars.js'
import { latestCommonYears } from './annual-window.js'
// Deliberate admissions, not permission inferred from history length. One European
// factor at a time, as a satellite beside the broad European core; never a PEA recipe.
const factors = [
  ['europe-value-ishares', 'IE00BQN1K901', 'value'],
  ['europe-momentum-ishares', 'IE00BQN1K786', 'momentum'],
  ['europe-quality-ishares', 'IE00BQN1K562', 'quality'],
]
export const AUTOMATIC_FACTOR_ADMISSIONS = factors.flatMap(([id, isin, factor]) => {
  const record = QUALIFIED_FUND_CALENDARS[isin]
  if (!record || latestCommonYears([record.years]).length !== 6 || record.currency !== 'EUR') return []
  return [{ id, isin, factor, role: 'satellite', profile: 'pro_europe', risks: ['equilibre', 'dynamique', 'offensif'],
    minPct: 5, maxPct: 20, peaRequired: false, exclusiveGroup: 'europe-factor', core: 'europe_pea_amundi' }]
})
export const AUTOMATIC_FACTOR_IDS = AUTOMATIC_FACTOR_ADMISSIONS.map(row => row.id)

// Existing manual source policy; no permission for automatic construction.
export const MANUAL_SOURCE_ROUTES = { GB00B15KXQ89: {
  id: 'manual-GB00B15KXQ89', currency: 'USD', instrumentType: 'ETC', minimumYears: 6, category: 'matieres_premieres',
  source: 'https://dataspanapi.wisdomtree.com/pdr/documents/FACTSHEET/CSL/EU/EN-GB/GB00B15KXQ89',
  note: 'Performances de la valeur liquidative de l’ETC en dollars, frais inclus ; elles peuvent différer de sa cotation.'
}, FR0013412004: {
  id: 'manual-FR0013412004', currency: 'EUR', instrumentType: 'ETF', minimumYears: 6, category: 'actions_larges',
  source: 'https://www.amundietf.fr/mapi/ProductAPI/getProductsData',
  existingDuelRole: 'complement',
  note: 'Performances de la valeur liquidative de la part en euros, revenus réinvestis et frais inclus ; elles peuvent différer de sa cotation.'
}, IE00B4K6B022: {
  id: 'manual-IE00B4K6B022', currency: 'EUR', instrumentType: 'ETF', minimumYears: 6, category: 'actions_larges',
  source: 'https://www.assetmanagement.hsbc.co.uk/api/v1/download/document/ie00b4k6b022/gb/en/kiid',
  existingDuelRole: 'complement',
  note: 'Performances de la valeur liquidative de la part en euros, revenus réinvestis et frais inclus, arrondies au dixième par l’émetteur ; elles peuvent différer de sa cotation.'
} }
