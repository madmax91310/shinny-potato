import fx from '../../data/annual-fx.json' with { type: 'json' }

// ECB reference rates: USD for one EUR, at each completed calendar year end.
function rate(year) {
  const row = fx.years[year]
  return fx.currency === 'USD per EUR' && row?.asOf?.startsWith(`${year}-12-`)
    && Number.isFinite(row.value) && row.value > 0 ? row.value : null
}
export function canConvertPerformance(entries, currency) {
  return ['EUR', 'USD'].includes(currency) && entries.length > 0 && entries.every(({ asset, returns }) =>
    asset.currency === currency || (['EUR', 'USD'].includes(asset.currency) && returns.length > 0
      && returns.every(({ year }) => rate(year - 1) && rate(year))))
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
    return {
      ...entry,
      asset: { ...entry.asset, currency, sourceCurrency,
        sourceCredit: `${entry.asset.sourceCredit || ''}${entry.asset.sourceCredit ? ' · ' : ''}Conversion : taux de référence BCE de fin d’année` },
      returns: entry.returns.map(row => ({ ...row,
        pct: ((1 + row.pct / 100) * (sourceCurrency === 'USD'
          ? rate(row.year - 1) / rate(row.year) : rate(row.year) / rate(row.year - 1)) - 1) * 100,
      })),
    }
  })
}
export function performanceDisplayBasis(asset, basis) {
  if (!asset.sourceCurrency) return basis
  return `${basis.replace(new RegExp(`\\b${asset.sourceCurrency}\\b`, 'g'), asset.currency)} · conversion BCE, sans couverture de change`
}
