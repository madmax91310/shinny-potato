import { MANUAL_SOURCE_ROUTES } from './portfolio-admissions.js'
import RETURNS from './monthly-duel-returns.json' with { type: 'json' }
import { INSTRUMENTS_BY_ISIN } from './instruments.js'
import { latestCommonYears } from './annual-window.js'
// Qualified exact-share market histories supply manual choices automatically.
// Existing editorial recipes keep their own asset IDs and return conventions.
// 18/10/2026 : parts documentées sur six années complètes et admises dans un groupe d'options du
// Générateur (theses.js) ; elles perdent le statut « manuel seulement ». Toute autre part reste manuelle.
export const AUTOMATIC_RECIPE_ISINS = new Set(['IE0008471009', 'IE00B52MJY50'])
export const AUTOMATED_PORTFOLIO_FUNDS = Object.values(RETURNS).flatMap(record => {
  const identity=INSTRUMENTS_BY_ISIN[record.isin]
  if (!identity || record.basis!=='market-price' || !record.source?.startsWith('https://') || !record.checkedAt || !['EUR','USD'].includes(record.currency) || latestCommonYears([record.years],{minimum:3}).length<3) return []
  const name=identity.name, expiry=name.match(/\b(?:Dec|December|décembre)\s+(20\d{2})\b/i)?.[1]
  if (expiry && new Date().getUTCFullYear()>Number(expiry)) return []
  // Broad display categories only; these never drive automatic risk recipes.
  const declaredRoute=MANUAL_SOURCE_ROUTES[record.isin]
  const manualRoute=declaredRoute?.instrumentType===identity.instrumentType?declaredRoute:null
  const cat=manualRoute?.category??(/\b(?:ETC|ETP|ETN)\b/.test(name)?'matieres_premieres':/bond|treasury|govt|overnight|court terme/i.test(name)?'obligataire':'actions_larges')
  return [{...(manualRoute?{underlyingMechanism:manualRoute.mechanism,basis:record.basis}:{}),id:`manual-${record.isin}`,isin:record.isin,name,cat,emoji:'📊',manualOnly:!AUTOMATIC_RECIPE_ISINS.has(record.isin),automatedManual:true,distinctCandidate:true,
    returnCurrency:record.currency,calendarReturns:record.years,r:record.values,
    confidenceNote:record.note,desc:[name,'Composition manuelle sur la période commune réellement disponible.','Risque de perte en capital ; exposition à examiner avec le reste du portefeuille.']}]
})
