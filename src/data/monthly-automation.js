import RECORDS from './automated-monthly.json' with { type: 'json' }

// Archive audits replay immutable provider captures; all product consumers use active records.
const archiveAudit = globalThis.process?.env?.MONTHLY_ARCHIVE_AUDIT === '1'
const records = archiveAudit ? {} : RECORDS
const archiveSeries = archiveAudit ? JSON.parse(globalThis.process.env.MONTHLY_ARCHIVE_SERIES ?? '{}') : {}
export function applyMonthlyAutomation(baseline) {
  return Object.fromEntries(Object.entries(baseline).map(([id, asset]) => {
    if (archiveSeries[id]) return [id, { ...asset, points: archiveSeries[id].map(([date, price]) => ({ date, price })) }]
    const record = records[id]
    if (!record) return [id, asset]
    if (record.currency !== asset.currency || record.periodStart !== asset.points[0].date) throw new Error(`Série incompatible : ${id}`)
    return [id, { ...asset, points: record.points.map(([date, price]) => ({ date, price })),
      ...(record.anniversaryPoints?.length ? { anniversaryPoints: record.anniversaryPoints.map(([date, price]) => ({ date, price })) } : {}) }]
  }))
}
export function applyMonthlyReviews(baseline) {
  return { ...baseline, ...Object.fromEntries(Object.entries(records).map(([id, record]) => [`history:${id}`, {
    ...baseline[`history:${id}`], sourceUrls: record.sourceUrls, checkedAt: record.checkedAt,
    asOf: null, periodStart: record.periodStart, periodEnd: record.periodEnd,
    dateStatus: 'month-only', sourceStatus: 'documented', method: record.method,
    note: `Actualisation automatique ; dernière séance quotidienne validée sur la source officielle ou recoupée entre requêtes du même fournisseur. SHA-256 ${record.responseSha256}.`,
  }])) }
}
