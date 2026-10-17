import RETURNS from './monthly-duel-returns.json' with { type: 'json' }
import { INSTRUMENTS_BY_ISIN } from './instruments.js'
import { latestCommonYears } from './annual-window.js'
// Qualified exact-share market histories supply manual choices automatically.
// Existing editorial recipes keep their own asset IDs and return conventions.
export const AUTOMATED_PORTFOLIO_FUNDS = Object.values(RETURNS).flatMap(record => {
  const identity=INSTRUMENTS_BY_ISIN[record.isin]
  if (!identity || !['EUR','USD'].includes(record.currency) || latestCommonYears([record.years],{minimum:3}).length<3) return []
  const name=identity.name, expiry=name.match(/\b(?:Dec|December|décembre)\s+(20\d{2})\b/i)?.[1]
  if (expiry && new Date().getUTCFullYear()>Number(expiry)) return []
  // Broad display categories only; these never drive automatic risk recipes.
  const cat=/\b(?:ETC|ETP|ETN)\b/.test(name)?'matieres_premieres':/bond|treasury|govt|overnight|court terme/i.test(name)?'obligataire':'actions_larges'
  return [{id:`manual-${record.isin}`,isin:record.isin,name,cat,emoji:'📊',manualOnly:true,automatedManual:true,
    returnCurrency:record.currency,calendarReturns:record.years,r:record.values,
    confidenceNote:record.note,desc:[name,'Composition manuelle sur la période commune réellement disponible.','Risque de perte en capital ; exposition à examiner avec le reste du portefeuille.']}]
})
