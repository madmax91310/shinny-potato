import annualIndices from '../../data/ranking-index-annual.json' with { type: 'json' }
import { returnConvention } from '../../lib/return-convention.js'
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
function officialReturn(sheet, currency) {
  const record = official[officialIds[sheet.id]]?.[currency]
  return sheet.performance.kind === 'indice' && record?.currency === currency && record.variant === returnConvention(sheet.performance) && record.sourceUrl && record.asOf && sheet.returns.length &&
    sheet.returns.every(([year]) => Number.isFinite(record.annualReturns[year])) ? record : null
}
export function factsheetCurrencies(sheet) {
  const source = factsheetCurrency(sheet)
  return ['EUR','USD'].filter(currency => source === currency || officialReturn(sheet, currency) || (source && sheet.returns.length &&
    sheet.returns.every(([year,value]) => Number.isFinite(convertCalendarReturn(value, year, source, currency)))))
}
export const canUseEuros = sheet => factsheetCurrencies(sheet).includes('EUR')
export function factsheetInCurrency(sheet, currency = 'native') {
  if (currency === 'native' || currency === factsheetCurrency(sheet)) return sheet
  if (!factsheetCurrencies(sheet).includes(currency)) throw new Error('Historique de change incomplet pour cette fiche.')
  const record = officialReturn(sheet, currency)
  const sourceCurrency = factsheetCurrency(sheet)
  // Multi-year annualized figures cannot be converted using just the five displayed years.
  const performance = { ...sheet.performance }
  delete performance.tenYear
  delete performance.annualizedFiveYear
  const currencyWords = /USD|dollars|EUR|euros|JPY|yens|HKD/gi
  return { ...sheet,
    returns: sheet.returns.map(([year, value]) => [year, record ? record.annualReturns[year] : convertCalendarReturn(value, year, sourceCurrency, currency)]),
    performance: { ...performance,
      detail: record ? `${sheet.index}, en ${currency}, dividendes bruts réinvestis, hors frais ETF` : performance.detail.replace(currencyWords, currency),
      date: record ? new Date(`${record.asOf}T00:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : performance.date,
      currencyNote: record ? `Série officielle MSCI en ${currency}, identique à Performance depuis.` : `Conversion en ${currency} aux taux de référence BCE de fin d’année, sans couverture de change.`,
    },
    source: [...sheet.source, { label: record ? `MSCI · performances officielles ${currency}` : 'BCE · change de fin d’année', url: record?.sourceUrl ?? CALENDAR_FX_SOURCE }]
      .filter((source, index, sources) => sources.findIndex(item => item.url === source.url) === index),
  }
}

const variantIds = {
  world: { NETR: 'annual-world-net', GRTR: 'annual-msciWorld' },
  acwi: { NETR: 'annual-msciAcwi', GRTR: 'annual-acwi-gross' },
  'em-standard': { NETR: 'annual-emerging-net', GRTR: 'annual-msciEmerging' },
}
export function factsheetVariants(sheet) {
  return Object.entries(variantIds[sheet.id] ?? {}).filter(([,id]) => {
    const record = annualIndices[id]
    return record && sheet.returns.every(([year]) => Number.isFinite(record.years[year]))
  }).map(([variant]) => variant)
}
export function factsheetInVariant(sheet, variant = 'native') {
  if (variant === 'native' || variant === returnConvention(sheet.performance)) return sheet
  if (!factsheetVariants(sheet).includes(variant)) throw new Error('Variante de dividendes indisponible.')
  const record = annualIndices[variantIds[sheet.id][variant]]
  const performance = { ...sheet.performance }
  delete performance.tenYear
  delete performance.annualizedFiveYear
  return { ...sheet, returns: sheet.returns.map(([year]) => [year,record.years[year]]),
    performance: { ...performance, detail: `${sheet.index}, ${record.currency}, dividendes ${variant === 'NETR' ? 'nets' : 'bruts'} réinvestis, hors frais ETF`, variant,
      date: `31 décembre ${Math.max(...sheet.returns.map(([year]) => year))}` },
    source: [...sheet.source, ...record.sourceUrls.map(url => ({ label: 'Indice · historique officiel', url }))]
      .filter((s,i,all) => all.findIndex(other => other.url === s.url) === i) }
}
