import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { buildReview, parisToday } from '../src/pages/data-review/lib.js'

// Reuse the maintenance calendar and real consumers; never renew source dates.
export function monitoringContext(review) {
  const rows = [...new Map([...review.schedule, ...review.items].map(row => [row.id, row])).values()]
  const project = row => ({ id: row.id, name: row.name, aliases: row.aliases ?? [], field: row.field,
    tools: row.tools ?? [], impactScope: 'asset', sourceUrls: row.urls ?? [], to: row.to, checkedAt: row.checkedAt, asOf: row.metadata?.asOf,
    dueAt: row.nextReviewAt, category: row.category, reason: row.reason })
  return { schemaVersion: 1, today: review.today, entities: rows.map(project),
    alerts: rows.filter(row => ['stale', 'expired', 'future-date'].includes(row.category)).map(project) }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = JSON.stringify(monitoringContext(buildReview(parisToday())), null, 2) + '\n'
  if (process.argv[2]) writeFileSync(process.argv[2], output)
  else process.stdout.write(output)
}
