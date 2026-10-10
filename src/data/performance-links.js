import links from './performance-links.json' with { type: 'json' }

export function getPerformanceAssetId(isin) {
  return Object.hasOwn(links, isin) ? links[isin] : null
}

export function getPerformanceHref(isin) {
  return getPerformanceAssetId(isin) ? `/performance-depuis?isin=${encodeURIComponent(isin)}` : null
}
