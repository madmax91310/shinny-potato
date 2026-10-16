// No interpolation, partial years, raw prices, or unverified currency conversion.
export function annualEquityReturns(record) {
  if (record.field !== 'adjclose' || !['EUR','USD'].includes(record.currency) || !record.sourceUrls?.length || !record.responseSha256) return {}
  const points = new Map(record.points)
  if (points.size !== record.points.length) return {}
  const returns = {}
  for (const [month, end] of points) {
    if (!month.endsWith('-12')) continue
    const year = Number(month.slice(0,4)), start = points.get(`${year-1}-12`)
    if (!(Number.isFinite(start) && start > 0 && Number.isFinite(end) && end > 0)) continue
    if (!Array.from({length:12},(_,i)=>points.get(`${year}-${String(i+1).padStart(2,'0')}`)).every(p=>Number.isFinite(p)&&p>0)) continue
    returns[year] = (end/start-1)*100
  }
  return returns
}
