import { getInstrumentName } from './instruments.js'
import { QUALIFIED_FUND_CALENDARS, qualifiedFundCalendars, currentAnnualEvidence } from './qualified-annual-calendars.js'
import FX from './monthly-fx.json' with { type: 'json' }
import { monthlyCurrencyFactor, monthlyFxEvidence } from './history-currency.js'
import { latestCommonYears, HISTORICAL_YEARS } from './annual-window.js'
import ANNUAL_RECOVERIES from './financial-source-repairs.json' with { type: 'json' }
// No monthly prices, benchmark backfills or automatic-allocation permission are inferred here.
// Preserve the already published Mining manual/duel URL when its unqualified
// exchange-price projection gives way to the explicitly labelled official NAV calendar.
const EXISTING_MANUAL_IDS=Object.fromEntries(['IE00BDFBTQ78','IE00B42NKQ00','IE00B5W4TY14','IE00BD1F4L37','IE00BQN1K562','IE00BQT3WG13','IE000YU9K6K2','IE00BQQP9F84'].map(isin=>[isin,`manual-${isin}`]))
// Exact-share JPY calendar already reconciled to daily issuer NAV (#986).
// This is an explicit manual-only EUR route, never general JPY admission or a
// repair of XNKY.DE. Keep its existing manual URL and one choice per ISIN.
const MANUAL_CURRENCY_ROUTES = { LU2196470426: { native: 'JPY', currency: 'EUR' } }
export function qualifyManualCurrencyCalendar(calendar, fx = FX, now = new Date()) {
  const route = MANUAL_CURRENCY_ROUTES[calendar?.isin]
  if (!route || calendar.currency !== route.native || calendar.basis !== 'fund-nav'
    || calendar.frequency !== 'annual' || !/^https:\/\//.test(fx?.sourceUrl ?? '')
    || !/^[a-f0-9]{64}$/.test(fx?.sha256 ?? '') || !Number.isFinite(Date.parse(fx.checkedAt))
    || Date.parse(fx.checkedAt) > now.getTime()
    || !currentAnnualEvidence(calendar.checkedAt, calendar.asOf, 'etf.performance', now)) return null
  try {
    // Same December fixing convention and shared factor as annual comparisons.
    // No interpolation or silently shortened calendar when FX is incomplete.
    const factor = month => monthlyCurrencyFactor(month, route.native, route.currency, fx)
    const years = Object.fromEntries(Object.entries(calendar.years).map(([year, value]) => [year,
      ((1 + value / 100) * factor(`${year}-12`) / factor(`${Number(year) - 1}-12`) - 1) * 100]))
    if (Object.values(years).some(value => !Number.isFinite(value) || value <= -100)) return null
    const fxSourceUrls = monthlyFxEvidence([route.native, route.currency], fx).sourceUrls
    return { ...calendar, years, currency: route.currency, originalCurrency: route.native,
      fxConverted: true, fxSourceUrls, manualCurrencyRoute: true,
      method: `${calendar.method} ; calendrier NAV de la part en JPY converti en EUR aux fixings mensuels BCE de décembre, une seule fois.`,
      sourceUrls: [...new Set([...calendar.sourceUrls, ...fxSourceUrls])], fxCheckedAt: fx.checkedAt }
  } catch { return null } // The separately qualified market windows remain available.
}
const convertedManualCalendars = Object.values(qualifiedFundCalendars({ nativeCurrencies: ['JPY'] }))
  .map(record => qualifyManualCurrencyCalendar(record)).filter(Boolean)
export const ANNUAL_PORTFOLIO_FUNDS = [...Object.values(QUALIFIED_FUND_CALENDARS), ...convertedManualCalendars].flatMap(record => {
  const expiry=record.label.match(/\b(?:Dec|December|décembre)\s+(20\d{2})\b/i)?.[1]
  if(expiry && new Date().getUTCFullYear()>Number(expiry))return []
  if (latestCommonYears([record.years], { minimum: 3 }).length < 3) return []
  const cat = ['ETC', 'ETN', 'ETP'].includes(record.instrumentType) ? 'matieres_premieres' : 'actions_larges'
  const recovery = ANNUAL_RECOVERIES[record.isin]?.annualCurrency === record.currency ? ANNUAL_RECOVERIES[record.isin] : null
  return [{ id: recovery?.annualManualId ?? (record.manualCurrencyRoute ? `manual-${record.isin}` : EXISTING_MANUAL_IDS[record.isin]) ?? `nav-${record.isin}`, isin: record.isin, name: getInstrumentName(record.isin,'portfolio'), cat, emoji: '📊', manualOnly: true,
    ...(recovery || record.manualCurrencyRoute ? { preferQualifiedAnnual: true } : {}),
    ...(record.manualCurrencyRoute ? { nativeReturnCurrency: record.originalCurrency, fxSourceUrls: record.fxSourceUrls, fxCheckedAt: record.fxCheckedAt } : {}),
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
