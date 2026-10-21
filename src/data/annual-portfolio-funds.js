import { QUALIFIED_FUND_CALENDARS } from './qualified-annual-calendars.js'
import { latestCommonYears, HISTORICAL_YEARS } from './annual-window.js'
// No monthly prices, benchmark backfills or automatic-allocation permission are inferred here.
export const ANNUAL_PORTFOLIO_FUNDS = Object.values(QUALIFIED_FUND_CALENDARS).flatMap(record => {
  const expiry=record.label.match(/\b(?:Dec|December|décembre)\s+(20\d{2})\b/i)?.[1]
  if(expiry && new Date().getUTCFullYear()>Number(expiry))return []
  if (latestCommonYears([record.years], { minimum: 3 }).length < 3) return []
  const cat = ['ETC', 'ETN', 'ETP'].includes(record.instrumentType) ? 'matieres_premieres' : 'actions_larges'
  return [{ id: `nav-${record.isin}`, isin: record.isin, name: record.label, cat, emoji: '📊', manualOnly: true,
    annualManual: true, distinctCandidate: true, basis: record.basis, source: record.sourceUrls[0], checkedAt: record.checkedAt,
    returnCurrency: record.currency, calendarReturns: record.years, r: HISTORICAL_YEARS.map(year => record.years[year] ?? null),
    confidenceNote: record.method,
    desc: [record.label, 'Composition manuelle sur les années complètes communes.', 'Risque de perte en capital.'] }]
})
