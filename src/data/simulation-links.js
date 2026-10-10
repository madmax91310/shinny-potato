import ids from './simulation-links.json' with { type: 'json' }

// No prices, calculator engine, date or currency conversion in this module.
export function getSimulationAssetId(id) {
  return ids.includes(id) ? id : null
}

export function getSimulationHref(id) {
  return getSimulationAssetId(id) ? `/calculateur-investissement?asset=${encodeURIComponent(id)}` : null
}

export function getAnnualPerformanceHref(id) {
  return getSimulationAssetId(id) ? `/performance-depuis?asset=${encodeURIComponent(id)}` : null
}
