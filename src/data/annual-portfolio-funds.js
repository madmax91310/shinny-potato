import { getInstrumentName } from './instruments.js'
import { QUALIFIED_FUND_CALENDARS } from './qualified-annual-calendars.js'
import { latestCommonYears, HISTORICAL_YEARS } from './annual-window.js'
// No monthly prices, benchmark backfills or automatic-allocation permission are inferred here.
// Preserve the already published Mining manual/duel URL when its unqualified
// exchange-price projection gives way to the explicitly labelled official NAV calendar.
const EXISTING_MANUAL_IDS={IE00BDFBTQ78:'manual-IE00BDFBTQ78'}
export const ANNUAL_PORTFOLIO_FUNDS = Object.values(QUALIFIED_FUND_CALENDARS).flatMap(record => {
  const expiry=record.label.match(/\b(?:Dec|December|décembre)\s+(20\d{2})\b/i)?.[1]
  if(expiry && new Date().getUTCFullYear()>Number(expiry))return []
  if (latestCommonYears([record.years], { minimum: 3 }).length < 3) return []
  const cat = ['ETC', 'ETN', 'ETP'].includes(record.instrumentType) ? 'matieres_premieres' : 'actions_larges'
  return [{ id: EXISTING_MANUAL_IDS[record.isin] ?? `nav-${record.isin}`, isin: record.isin, name: getInstrumentName(record.isin,'portfolio'), cat, emoji: '📊', manualOnly: true,
    annualManual: true, distinctCandidate: true, basis: record.basis, source: record.sourceUrls[0], checkedAt: record.checkedAt,
    returnCurrency: record.currency, calendarReturns: record.years, r: HISTORICAL_YEARS.map(year => record.years[year] ?? null),
    confidenceNote: record.method,
    desc: [record.label, 'Composition manuelle sur les années complètes communes.', 'Risque de perte en capital.'] }]
})

// Audit the issuer-NAV contract independently from adjusted market-price series.
export function isQualifiedAnnualPortfolioFund(asset) {
 const source=ANNUAL_PORTFOLIO_FUNDS.find(a=>a.isin===asset?.isin)
 return Boolean(source && asset.annualManual && asset.manualOnly && asset.basis===source.basis && ['fund-nav','fund'].includes(source.basis)
  && asset.returnCurrency===source.returnCurrency && asset.source===source.source && asset.checkedAt===source.checkedAt
  && JSON.stringify(asset.calendarReturns)===JSON.stringify(source.calendarReturns) && JSON.stringify(asset.r)===JSON.stringify(source.r))
}
