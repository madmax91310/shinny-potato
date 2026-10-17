// Navigation labels only; publication wording and historical series stay intact.
export function historyOptionLabel(id, asset) {
  const label = asset.label
  if (asset.instrumentType === 'EQUITY') return `${label} · ${asset.currency}`
  if (['ETC','ETN','ETP'].includes(asset.instrumentType)) return `${asset.instrumentType} · ${label.replace(/ — ETC$/, '')}${asset.ticker ? ` (${asset.ticker})` : ''} · ${asset.currency}`
  if (asset.isin || /\bETF\b/i.test(label)) {
    const name = label.replace(/^ETF\s+/i, '')
    const ticker = asset.ticker && !name.includes(asset.ticker) ? ` (${asset.ticker})` : ''
    return `ETF · ${name}${ticker}${asset.currency ? ` · ${asset.currency}` : ''}`
  }
  if (asset.priceUnit === 'points' || ['cac40', 'nasdaq100'].includes(id)) {
    return `Indice · ${label.replace(/^Indice\s+/i, '')}`
  }
  return label
}
