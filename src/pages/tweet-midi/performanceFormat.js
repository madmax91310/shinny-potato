// A one-year cumulative return is the supplied annual return, without a
// floating-point round trip that can move a value across a rounding boundary.
export const cumulativePerformance = rows => rows.length === 1 ? rows[0].pct :
  (rows.reduce((acc, row) => acc * (1 + row.pct / 100), 1) - 1) * 100

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
