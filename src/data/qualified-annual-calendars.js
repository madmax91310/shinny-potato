import { AUTOMATED_ETF } from './automated-etf.js'
import INDICES from './automated-indices.json' with { type: 'json' }
import { currentEvidence as currentAnnualEvidence } from './evidence-freshness.js'
export { currentAnnualEvidence }
import { ETFS } from './etf-cards.js'
import { INSTRUMENTS_BY_ISIN }from './instruments.js'

export function closedCalendarYears(values, now = new Date()) {
  return Object.fromEntries(Object.entries(values ?? {}).filter(([year, value]) => /^\d{4}$/.test(year)
    && Number(year) >= 1900 && Number(year) < now.getUTCFullYear() && Number.isFinite(value) && value > -100))
}
export function qualifyFundCalendar(isin, record, identity, now = new Date(), {nativeCurrencies = ['EUR', 'USD']} = {}) {
  const performance = record?.performance, source = performance?.sourceUrl ?? record?.sourceUrl
  const years = closedCalendarYears(performance?.years, now)
  const asOf = performance?.asOf ?? (Object.keys(years).length ? `${Math.max(...Object.keys(years).map(Number))}-12-31` : null)
  if (!identity || typeof identity.name !== 'string' || !identity.name.trim() || identity.isin !== isin || /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(record.productId ?? '') && record.productId !== isin
    || performance?.basis !== 'fund' || performance.portfolioHistoryBasis === 'proxy'
    || !/^calendar-year /i.test(performance.method ?? '')
    || !(/reinvest|réinvest|total return/i.test(performance.method) || /accumula|capitalisa|no income/i.test(record.characteristics?.distribution ?? ''))
    || /proxy/i.test(performance.method)
    || !Array.isArray(nativeCurrencies) || !nativeCurrencies.includes(performance.currency) || typeof source !== 'string' || !source.startsWith('https://')
    || !Object.keys(years).length || !currentAnnualEvidence(performance.checkedAt, asOf, 'etf.performance', now)) return null
  return { id: `annual-${isin}`, isin, label: identity.name, shortLabel: identity.name, instrumentType: identity.instrumentType ?? INSTRUMENTS_BY_ISIN[isin]?.instrumentType ?? (identity.name.match(/\bET[CNP]\b/)?.[0] ?? 'ETF'),
    frequency: 'annual', basis: 'fund-nav', currency: performance.currency, years, pea: identity.pea === true,
    group: `Calendriers annuels · ${identity.category ?? 'ETF'}`, sourceUrls: [source], checkedAt: performance.checkedAt, asOf, method: performance.method }
}
export function qualifyIndexCalendar(id, record, now = new Date()) {
  const series = record?.returns, source = series?.source
  const years = closedCalendarYears(Object.fromEntries(series?.values ?? []), now)
  // TOTAL alone does not establish whether withholding tax is deducted.
  const basis = { NET: 'index-net', GROSS: 'index-gross' }[series?.variant]
  if (!basis || series.performance?.kind !== 'indice' || typeof series.performance.detail !== 'string' || !series.performance.detail.trim() || !['EUR', 'USD'].includes(series.currency)
    || typeof source?.url !== 'string' || !source.url.startsWith('https://') || !/^[a-f0-9]{64}$/.test(source.sha256 ?? '')
    || !Object.keys(years).length || !currentAnnualEvidence(source.checkedAt, series.asOf, 'index.returns', now)) return null
  const name = series.performance.detail.split(/[,·]/)[0].trim()
  return { id: `annual-index-${id}`, indexId: id, label: name, shortLabel: `${name} ${series.variant === 'NET' ? 'NETR' : 'GRTR'}`,
    priceUnit: 'points', frequency: 'annual', basis, variant: series.variant === 'NET' ? 'NETR' : 'GRTR', currency: series.currency,
    years, sourceUrls: [source.url], checkedAt: source.checkedAt, asOf: series.asOf, method: series.performance.detail }
}
const identities = new Map(ETFS.map(fund => [fund.isin, fund]))
// Consumers declare the native currencies they can actually use/convert. The
// portfolio projection retains its existing EUR/USD contract by default.
export function qualifiedFundCalendars({nativeCurrencies = ['EUR', 'USD'], now = new Date()} = {}) {
  return Object.fromEntries(Object.entries(AUTOMATED_ETF).flatMap(([isin, record]) => {
    const calendar = qualifyFundCalendar(isin, record, identities.get(isin), now, {nativeCurrencies})
    return calendar ? [[isin, calendar]] : []
  }))
}
export const QUALIFIED_FUND_CALENDARS = qualifiedFundCalendars()
export const QUALIFIED_INDEX_CALENDARS = Object.fromEntries(Object.entries(INDICES).flatMap(([id, record]) => {
  const calendar = qualifyIndexCalendar(id, record); return calendar ? [[id, calendar]] : []
}))
