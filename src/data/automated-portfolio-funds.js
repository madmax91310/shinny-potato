import RETURNS from './monthly-duel-returns.json' with { type: 'json' }
import { INSTRUMENTS_BY_ISIN } from './instruments.js'
import { latestCommonYears } from './annual-window.js'
import { getInstrumentAnnualPerformance } from './instrument-returns.js'
// Qualified exact-share market histories supply manual choices automatically.
// Existing editorial recipes keep their own asset IDs and return conventions.
// 18/10/2026 : parts documentées sur six années complètes et admises dans un groupe d'options du
// Générateur (theses.js) ; elles perdent le statut « manuel seulement ». Toute autre part reste manuelle.
export const AUTOMATIC_RECIPE_ISINS = new Set(['IE0008471009', 'IE00B52MJY50'])
// One number per exact share across tools: the issuer's official NAV calendar (also used by the
// Duels) wins over returns rebuilt from market prices whenever it covers three complete years.
function returnsFor(record) {
  const official = getInstrumentAnnualPerformance(record.isin)
  const years = official?.basis === 'fund' && ['EUR','USD'].includes(official.currency) && official.years
    ? Object.fromEntries(Object.entries(official.years).filter(([year, value]) => /^\d{4}$/.test(year) && Number.isFinite(value) && Number(year) < new Date().getUTCFullYear()))
    : null
  if (years && latestCommonYears([years], {minimum:3}).length >= 3)
    return {returnBasis:'fund', returnCurrency:official.currency, calendarReturns:years, r:record.values, confidenceNote:`Rendements officiels de la part publiés par l’émetteur (${official.method ?? 'VL, années civiles complètes'}).`}
  return {returnBasis:'market-price', returnCurrency:record.currency, calendarReturns:record.years, r:record.values, confidenceNote:record.note}
}
export const AUTOMATED_PORTFOLIO_FUNDS = Object.values(RETURNS).flatMap(record => {
  const identity=INSTRUMENTS_BY_ISIN[record.isin]
  if (!identity || record.basis!=='market-price' || !record.source?.startsWith('https://') || !record.checkedAt || !['EUR','USD'].includes(record.currency) || latestCommonYears([record.years],{minimum:3}).length<3) return []
  const name=identity.name, expiry=name.match(/\b(?:Dec|December|décembre)\s+(20\d{2})\b/i)?.[1]
  if (expiry && new Date().getUTCFullYear()>Number(expiry)) return []
  // Broad display categories only; these never drive automatic risk recipes.
  const cat=/\b(?:ETC|ETP|ETN)\b/.test(name)?'matieres_premieres':/bond|treasury|govt|overnight|court terme/i.test(name)?'obligataire':'actions_larges'
  return [{id:`manual-${record.isin}`,isin:record.isin,name,cat,emoji:'📊',manualOnly:!AUTOMATIC_RECIPE_ISINS.has(record.isin),automatedManual:true,distinctCandidate:true,
    ...returnsFor(record),desc:[name,'Composition manuelle sur la période commune réellement disponible.','Risque de perte en capital ; exposition à examiner avec le reste du portefeuille.']}]
})
