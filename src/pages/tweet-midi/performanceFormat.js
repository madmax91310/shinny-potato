// Keep small nonzero returns visible without changing the underlying calculation.
export function formatPerformancePct(value) {
  const magnitude = Math.abs(value)
  if (magnitude > 0 && magnitude < 0.005) return `${value < 0 ? '−' : '+'}< 0,01 %`
  const digits = magnitude > 0 && magnitude < 0.05 ? 2 : 1
  return `${value < 0 ? '−' : '+'}${magnitude.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`
}

export function performancePeriod(returns) {
  return `de début ${returns[0].year} à fin ${returns.at(-1).year}`
}
