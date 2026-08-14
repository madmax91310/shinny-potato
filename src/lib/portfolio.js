export const TYPE_LABELS = {
  crypto: 'Crypto',
  stock: 'Action',
  etf: 'ETF',
}

// Détermine le prix actuel à utiliser pour une ligne, sa source ('live' | 'manual' | 'none')
// et l'horodatage de la dernière mise à jour.
export function resolvePositionPrice(position, liveEntry) {
  if (liveEntry && liveEntry.source === 'live' && typeof liveEntry.price === 'number') {
    return { price: liveEntry.price, source: 'live', updatedAt: liveEntry.updatedAt }
  }
  if (typeof position.manualPrice === 'number') {
    return { price: position.manualPrice, source: 'manual', updatedAt: position.manualPriceUpdatedAt }
  }
  if (liveEntry && typeof liveEntry.price === 'number') {
    // Dernier prix live connu, même si le cycle courant est en erreur.
    return { price: liveEntry.price, source: 'live', updatedAt: liveEntry.updatedAt }
  }
  return { price: position.buyPrice, source: 'none', updatedAt: null }
}

export function computePositionMetrics(position, liveEntry) {
  const { price: currentPrice, source, updatedAt } = resolvePositionPrice(position, liveEntry)
  const costBasis = position.quantity * position.buyPrice
  const currentValue = position.quantity * currentPrice
  const gainAbs = currentValue - costBasis
  const gainPct = costBasis !== 0 ? (gainAbs / costBasis) * 100 : 0

  return {
    currentPrice,
    priceSource: source,
    priceUpdatedAt: updatedAt,
    costBasis,
    currentValue,
    gainAbs,
    gainPct,
  }
}

export function computePortfolioSummary(positions, livePrices) {
  let totalValue = 0
  let totalCost = 0

  for (const position of positions) {
    const metrics = computePositionMetrics(position, livePrices[position.id])
    totalValue += metrics.currentValue
    totalCost += metrics.costBasis
  }

  const gainAbs = totalValue - totalCost
  const gainPct = totalCost !== 0 ? (gainAbs / totalCost) * 100 : 0

  return { totalValue, totalCost, gainAbs, gainPct }
}

export function computeAllocationByLine(positions, livePrices) {
  return positions
    .map((position) => {
      const metrics = computePositionMetrics(position, livePrices[position.id])
      return { name: position.name || position.ticker, value: metrics.currentValue }
    })
    .filter((entry) => entry.value > 0)
}

// Performance du jour : compare la valeur actuelle au snapshot le plus proche
// d'il y a 24h (ou, à défaut, au plus ancien snapshot disponible).
export function computeDailyChange(snapshots, currentValue) {
  if (!snapshots || snapshots.length === 0) return null

  const dayMs = 24 * 60 * 60 * 1000
  const targetTime = Date.now() - dayMs

  let reference = snapshots[0]
  for (const snap of snapshots) {
    if (new Date(snap.date).getTime() <= targetTime) {
      reference = snap
    }
  }

  const gainAbs = currentValue - reference.value
  const gainPct = reference.value !== 0 ? (gainAbs / reference.value) * 100 : 0
  return { gainAbs, gainPct, referenceDate: reference.date }
}

export function computeAllocationByType(positions, livePrices) {
  const totals = {}
  for (const position of positions) {
    const metrics = computePositionMetrics(position, livePrices[position.id])
    totals[position.type] = (totals[position.type] || 0) + metrics.currentValue
  }
  return Object.entries(totals)
    .filter(([, value]) => value > 0)
    .map(([type, value]) => ({ name: TYPE_LABELS[type] || type, value }))
}
