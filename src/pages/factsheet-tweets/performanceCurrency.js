import official from '../../data/official-performance-currencies.json' with { type: 'json' }
import { CALENDAR_FX_SOURCE, convertCalendarReturn } from '../../data/calendar-fx.js'

// Same official EUR observations as Performance depuis for these exact indices.
const officialIds = { world: 'msciWorld', acwi: 'msciAcwi', 'em-standard': 'msciEmerging' }
export function factsheetCurrency(sheet) {
  return /USD|dollars/i.test(sheet.performance.detail) ? 'USD'
    : /EUR|euros/i.test(sheet.performance.detail) ? 'EUR'
      : /JPY|yens/i.test(sheet.performance.detail) ? 'JPY'
        : /HKD/i.test(sheet.performance.detail) ? 'HKD' : null
}
function officialEuro(sheet) {
  const record = official[officialIds[sheet.id]]?.EUR
  return sheet.performance.kind === 'indice' && record?.currency === 'EUR' && record.variant === 'GRTR' && record.sourceUrl && record.asOf && sheet.returns.length &&
    sheet.returns.every(([year]) => Number.isFinite(record.annualReturns[year])) ? record : null
}
export function canUseEuros(sheet) {
  const currency = factsheetCurrency(sheet)
  return Boolean(currency === 'EUR' || officialEuro(sheet) || (currency && sheet.returns.length &&
    sheet.returns.every(([year, value]) => Number.isFinite(convertCalendarReturn(value, year, currency, 'EUR')))))
}
export function factsheetInCurrency(sheet, currency = 'native') {
  if (currency === 'native' || currency === factsheetCurrency(sheet)) return sheet
  if (currency !== 'EUR' || !canUseEuros(sheet)) throw new Error('Historique de change incomplet pour cette fiche.')
  const record = officialEuro(sheet)
  const sourceCurrency = factsheetCurrency(sheet)
  // Multi-year annualized figures cannot be converted using just the five displayed years.
  const { tenYear, annualizedFiveYear, ...performance } = sheet.performance
  const currencyWords = /USD|dollars|JPY|yens|HKD/gi
  return { ...sheet,
    returns: sheet.returns.map(([year, value]) => [year, record ? record.annualReturns[year] : convertCalendarReturn(value, year, sourceCurrency, 'EUR')]),
    performance: { ...performance,
      detail: record ? `${sheet.index}, en EUR, dividendes bruts réinvestis, hors frais ETF` : performance.detail.replace(currencyWords, 'EUR'),
      date: record ? new Date(`${record.asOf}T00:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : performance.date,
      currencyNote: record ? 'Série officielle MSCI en euros, identique à Performance depuis.' : 'Conversion en euros aux taux de référence BCE de fin d’année, sans couverture de change.',
    },
    source: [...sheet.source, { label: record ? 'MSCI · performances officielles EUR' : 'BCE · change de fin d’année', url: record?.sourceUrl ?? CALENDAR_FX_SOURCE }]
      .filter((source, index, sources) => sources.findIndex(item => item.url === source.url) === index),
  }
}
