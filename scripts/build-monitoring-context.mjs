import {buildAssetFieldReport} from './report-asset-fields.mjs'
import { historyAlerts } from './history-alerts.mjs'
import { writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { buildReview, parisToday } from '../src/pages/data-review/lib.js'
import { HOUSEHOLD_STATISTICS } from '../src/data/household-statistics.js'

// Reuse the maintenance calendar and real consumers; never renew source dates.
export function monitoringContext(review, households = HOUSEHOLD_STATISTICS) {
  const rows = [...new Map([...review.schedule, ...review.items].map(row => [row.id, row])).values()]
  const project = row => ({ id: row.id, name: row.name, aliases: row.aliases ?? [], field: row.field,
    tools: row.tools ?? [], impactScope: 'asset', sourceUrls: row.urls ?? [], to: row.to, checkedAt: row.checkedAt, asOf: row.metadata?.asOf,
    dueAt: row.nextReviewAt, category: row.category, reason: row.reason })
  // A household figure shown from the hand-typed sheet instead of the collected Insee value is a
  // visible incident, never a silent fallback.
  const fallbacks = households.filter(record => record.automation !== 'official-source').map(record => ({
    id: `household-fallback:${record.id}`, name: record.title, aliases: [record.id], field: 'Valeur Insee collectée', tools: ['France en 100 ménages'],
    impactScope: 'asset', sourceUrls: [], to: `/france-100-menages?sujet=${record.id}`, checkedAt: record.checkedAt, asOf: null, dueAt: review.today,
    category: 'manual-fallback', reason: 'Collecte Insee non appliquée ; la valeur manuelle de la fiche est affichée.' }))
  return { schemaVersion: 1, today: review.today, entities: rows.map(project),
    alerts: [...rows.filter(row => ['stale', 'expired', 'future-date'].includes(row.category)).map(project), ...fallbacks] }
}
// Field-level evidence catches retained failures even when a workflow succeeded.
export function fieldAlerts(report,entities=[]) {
  const invalid=new Set(['check-overdue','publication-old','invalid-date','future-date','undated-check','undated-observation'])
  const toolsFor=row=>{const tools=[...new Set(entities.filter(e=>e.aliases?.includes(row.id)).flatMap(e=>e.tools??[]))];return tools.length?tools:row.tools??[]}
  return report.rows.filter(r=>r.present&&(invalid.has(r.state)||r.diagnostic?.code==='retained-source-failure')).map(r=>({
    id:`${r.type}:${r.id}:${r.field}`, name:r.name, aliases:[r.id], field:r.label??r.field,
    kind:r.diagnostic?.code==='retained-source-failure'?'collection':'freshness',
    cause:r.diagnostic?.reason??`${r.state}; dernière observation conservée à sa date d’origine.`,
    category:r.state, tools:toolsFor(r), impactScope:'asset', sourceUrls:r.sourceUrl?[r.sourceUrl]:[],
    checkedAt:r.checkedAt??null, asOf:r.asOf??null, lastSuccessAt:r.checkedAt??null,
    evaluatedAt:report.checkedAt, to:'/donnees-a-revoir'
  }))
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const context = monitoringContext(buildReview(parisToday()))
  context.historyAlerts = historyAlerts(context.today, context.entities)
  context.fieldAlerts = fieldAlerts(buildAssetFieldReport(context.today),context.entities)
  const output = JSON.stringify(context, null, 2) + '\n'
  if (process.argv[2]) writeFileSync(process.argv[2], output)
  else process.stdout.write(output)
}
