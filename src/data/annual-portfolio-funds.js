import { AUTOMATED_ETF } from './automated-etf.js'
import { MANUAL_SOURCE_ROUTES } from './portfolio-admissions.js'
import { getInstrumentName } from './instruments.js'
import { QUALIFIED_FUND_CALENDARS, qualifiedFundCalendars, currentAnnualEvidence, closedCalendarYears } from './qualified-annual-calendars.js'
import FX from './monthly-fx.json' with { type: 'json' }
import { monthlyFxEvidence } from './history-currency.js'
import { convertCalendarReturn } from './calendar-fx.js'
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
    // Qualify each year separately: a missing fixing must not erase other years.
    const years = {}, currencyQualifications = {}
    for (const [year, value] of Object.entries(calendar.years)) {
      try {
        const pct = convertCalendarReturn(value, Number(year), route.native, route.currency, fx)
        if (!Number.isFinite(pct) || pct <= -100) throw new Error(`Change BCE absent ou rendement invalide pour ${route.native}/${route.currency} en ${year}.`)
        years[year] = pct; currencyQualifications[year] = { qualified: true }
      } catch (error) { currencyQualifications[year] = { qualified: false, reason: error.message } }
    }
    if (!Object.keys(years).length) return null
    const fxSourceUrls = monthlyFxEvidence([route.native, route.currency], fx).sourceUrls
    return { ...calendar, years, currencyQualifications,
      nativeCalendarAsOf: calendar.asOf, asOf: `${Math.max(...Object.keys(years).map(Number))}-12-31`,
      currency: route.currency, originalCurrency: route.native,
      fxConverted: true, fxSourceUrls, manualCurrencyRoute: true,
      method: `${calendar.method} ; calendrier NAV de la part en JPY converti en EUR aux fixings mensuels BCE de décembre, une seule fois.`,
      sourceUrls: [...new Set([...calendar.sourceUrls, ...fxSourceUrls])], fxCheckedAt: fx.checkedAt }
  } catch { return null } // The separately qualified market windows remain available.
}
const convertedManualCalendars = Object.values(qualifiedFundCalendars({ nativeCurrencies: ['JPY'] }))
  .map(record => qualifyManualCurrencyCalendar(record)).filter(Boolean)
// Explicit independent NAV route for the existing Copper manual choice.
// This does not repair COPA.L, release its refused windows or grant an automatic role.
// Optional structure description comes from the existing automated characteristics,
// with its own evidence dates. It never gates an otherwise qualified annual return.
export function qualifiedManualMechanism(isin, characteristics, now = new Date()) {
  const route=MANUAL_SOURCE_ROUTES[isin]
  if(!route || characteristics?.sourceUrl!==route.source || characteristics.replicationMethod!=='Synthétique'
    || !Number.isFinite(characteristics.annualSwapRatePct) || characteristics.annualSwapRatePct<0
    || !/^[a-f0-9]{64}$/.test(characteristics.sha256??'')
    || !currentAnnualEvidence(characteristics.checkedAt,characteristics.asOf,'etf.default',now))return undefined
  return {kind:'commodity-swap',checkedAt:characteristics.checkedAt,asOf:characteristics.asOf,
    sourceUrl:characteristics.sourceUrl,sha256:characteristics.sha256}
}
export function qualifyPreferredManualNav(record, now = new Date()) {
  const route=MANUAL_SOURCE_ROUTES[record?.isin]
  if (!route || record.currency!==route.currency || record.instrumentType!==route.instrumentType
    || record.basis!=='fund-nav' || record.frequency!=='annual' || record.sourceUrls?.[0]!==route.source
    || /proxy/i.test(record.method??'') || !/total return/i.test(record.method??'') || !/net of fees/i.test(record.method??'')
    || !currentAnnualEvidence(record.checkedAt,record.asOf,'etf.performance',now)) return null
  const years=closedCalendarYears(record.years,now)
  const window=latestCommonYears([years],{length:route.minimumYears,minimum:route.minimumYears,now})
  if (window.length!==route.minimumYears || window.at(-1)!==Math.max(...Object.keys(years).map(Number))) return null
  return route
}
export const ANNUAL_PORTFOLIO_FUNDS = [...Object.values(QUALIFIED_FUND_CALENDARS), ...convertedManualCalendars].flatMap(record => {
  const expiry=record.label.match(/\b(?:Dec|December|décembre)\s+(20\d{2})\b/i)?.[1]
  if(expiry && new Date().getUTCFullYear()>Number(expiry))return []
  if (latestCommonYears([record.years], { minimum: 3 }).length < 3) return []
  const cat = ['ETC', 'ETN', 'ETP'].includes(record.instrumentType) ? 'matieres_premieres' : 'actions_larges'
  const navRoute=qualifyPreferredManualNav(record)
  const recovery = ANNUAL_RECOVERIES[record.isin]?.annualCurrency === record.currency ? ANNUAL_RECOVERIES[record.isin] : null
  return [{ id: navRoute?.id ?? recovery?.annualManualId ?? (record.manualCurrencyRoute ? `manual-${record.isin}` : EXISTING_MANUAL_IDS[record.isin]) ?? `nav-${record.isin}`, isin: record.isin, name: getInstrumentName(record.isin,'portfolio'), cat, emoji: '📊', manualOnly: true,
    ...(navRoute || recovery || record.manualCurrencyRoute ? { preferQualifiedAnnual: true } : {}),
    ...(record.manualCurrencyRoute ? { nativeReturnCurrency: record.originalCurrency, fxSourceUrls: record.fxSourceUrls, fxCheckedAt: record.fxCheckedAt, currencyQualifications: record.currencyQualifications } : {}),
    ...(navRoute ? { underlyingMechanism: qualifiedManualMechanism(record.isin,AUTOMATED_ETF[record.isin]?.characteristics) } : {}),
    annualManual: true, distinctCandidate: true, basis: record.basis, source: record.sourceUrls[0], checkedAt: record.checkedAt,
    returnCurrency: record.currency, calendarReturns: record.years, r: HISTORICAL_YEARS.map(year => record.years[year] ?? null),
    confidenceNote: navRoute?.note ?? record.method,
    desc: [record.label, 'Composition manuelle sur les années complètes communes.', 'Risque de perte en capital.'] }]
})

// Audit the issuer-NAV contract independently from adjusted market-price series.
export function isQualifiedAnnualPortfolioFund(asset) {
 const source=ANNUAL_PORTFOLIO_FUNDS.find(a=>a.isin===asset?.isin)
 return Boolean(source && asset.annualManual && asset.manualOnly && asset.basis===source.basis && ['fund-nav','fund'].includes(source.basis)
  && asset.returnCurrency===source.returnCurrency && asset.source===source.source && asset.checkedAt===source.checkedAt
  && asset.nativeReturnCurrency===source.nativeReturnCurrency && asset.fxCheckedAt===source.fxCheckedAt
  && JSON.stringify(asset.fxSourceUrls)===JSON.stringify(source.fxSourceUrls)
  && JSON.stringify(asset.calendarReturns)===JSON.stringify(source.calendarReturns) && JSON.stringify(asset.r)===JSON.stringify(source.r))
}

// Normalize an already identified display of the same issuer calendar, never a
// market quotation or an unexplained performance gap. No tolerance is applied.
export function comparableAnnualNavReturns(asset, series, fx = FX) {
  if (!isQualifiedAnnualPortfolioFund(asset) || !asset.nativeReturnCurrency
    || series?.isin !== asset.isin || series.basis !== 'fund'
    || series.currency !== asset.nativeReturnCurrency || series.source !== asset.source
    || series.checkedAt !== asset.checkedAt) return null
  const years = {}
  for (const [year, value] of Object.entries(series.years ?? {})) {
    const pct = convertCalendarReturn(value, Number(year), series.currency, asset.returnCurrency, fx)
    if (!Number.isFinite(pct)) return null
    years[year] = pct
  }
  return Object.keys(years).length ? { currency: asset.returnCurrency, sourceCurrency: series.currency, years } : null
}
