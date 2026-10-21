import { convertCalendarReturn } from './calendar-fx.js'
export function annualPerformanceInCurrency(series, currency = 'native') {
  if (!series || !currency || currency === 'native' || currency === series.currency) return series
  if (!['EUR', 'USD'].includes(currency) || !series.values?.some(Number.isFinite)) throw new Error('Conversion indisponible : calendrier annuel requis.')
  const values = series.values.map((value, i) => {
    if (!Number.isFinite(value)) return value
    const converted = convertCalendarReturn(value, series.calendarYears?.[i] ?? 2020 + i, series.currency, currency)
    if (!Number.isFinite(converted)) throw new Error('Historique de change incomplet pour cette période.')
    return converted
  })
  // Rolling/YTD observations require their own exact dates; never convert as calendar years.
  const years = Object.fromEntries(values.flatMap((value, i) => Number.isFinite(value) ? [[series.calendarYears?.[i] ?? 2020 + i, value]] : []))
  return { ...series, currency, sourceCurrency: series.currency, values, years, calendarReturns: years, observations: [], currencyMethod: 'ecb' }
}
export function annualPerformanceCurrencies(series) {
  return series ? ['EUR','USD'].filter(currency => { try { annualPerformanceInCurrency(series,currency); return true } catch { return false } }) : []
}
