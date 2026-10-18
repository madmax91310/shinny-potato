import { conversionNote } from '../../lib/performance-conventions.js'
import { calendarRate, convertCalendarReturn } from '../../data/calendar-fx.js'
import { returnConvention } from '../../lib/return-convention.js'
import official from '../../data/official-performance-currencies.json' with { type: 'json' }

// Registered exact indices only. Never substitute an index for an ETF/share.
function officialReturns({ asset, returns }, currency) {
  const record = official[asset.id]?.[currency]
  if (!record || asset.currency !== 'USD' || asset.priceUnit !== 'points' || record.variant !== returnConvention(asset)
    || record.currency !== currency || !record.sourceUrl || !record.asOf || !returns.length
    || !returns.every(row => Number.isFinite(record.annualReturns[row.year]))) return null
  return record
}

export function canConvertPerformance(entries, currency) {
  return ['EUR', 'USD'].includes(currency) && entries.length > 0 && entries.every(({ asset, returns }) =>
    asset.currency === currency || officialReturns({ asset, returns }, currency) || (returns.length > 0 && returns.every(({ year }) => calendarRate(year - 1, asset.currency) && calendarRate(year, asset.currency) && calendarRate(year - 1, currency) && calendarRate(year, currency))))
}
export function performanceCurrencies(entries) {
  return ['EUR', 'USD'].filter(currency => canConvertPerformance(entries, currency))
}
export function convertPerformanceEntries(entries, currency) {
  if (!currency || currency === 'native') return entries
  if (!canConvertPerformance(entries, currency)) throw new Error('Historique de change incomplet pour cette période et cette devise.')
  return entries.map(entry => {
    if (entry.asset.currency === currency) return entry
    const sourceCurrency = entry.asset.currency
    const record = officialReturns(entry, currency)
    if (record) return {
      ...entry,
      asset: { ...entry.asset, currency, sourceCurrency, currencyMethod: 'official',
        sourceCredit: `MSCI · série officielle ${currency}`, sourceUrl: record.sourceUrl, asOf: record.asOf },
      returns: entry.returns.map(row => ({ ...row, pct: record.annualReturns[row.year] })),
    }
    return {
      ...entry,
      asset: { ...entry.asset, currency, sourceCurrency,
        sourceCredit: `${entry.asset.sourceCredit || ''}${entry.asset.sourceCredit ? ' · ' : ''}Conversion : taux de référence BCE de fin d’année` },
      returns: entry.returns.map(row => ({ ...row,
        pct: convertCalendarReturn(row.pct, row.year, sourceCurrency, currency),
      })),
    }
  })
}
export function performanceDisplayBasis(asset, basis) {
  if (!asset.sourceCurrency) return basis
  const converted = basis.replace(new RegExp(`\\b${asset.sourceCurrency}\\b`, 'g'), asset.currency)
  return `${converted} · ${conversionNote({ method: asset.currencyMethod })}`
}
