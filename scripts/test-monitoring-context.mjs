import assert from 'node:assert/strict'
import { monitoringContext } from './build-monitoring-context.mjs'
import { buildReview } from '../src/pages/data-review/lib.js'
const actual = monitoringContext(buildReview('2026-10-14'))
assert(actual.entities.length > 2000)
assert(actual.entities.some(row => row.aliases.includes('ackman') && row.tools.includes('Présentation investisseur')))
assert(!JSON.stringify(actual).includes('maintenanceRecord'), 'No financial payload copied into monitoring')
const row = { id: 'a', name: 'ETF', field: 'Encours', tools: ['Présentation ETF'], category: 'stale', nextReviewAt: '2026-10-01' }
const context = monitoringContext({ today: '2026-10-14', schedule: [row], items: [row, { ...row, id: 'archive', category: 'reserve' }, { ...row, id: 'soon', category: 'soon' }] })
assert.equal(context.alerts.length, 1)
assert.equal(context.alerts[0].dueAt, '2026-10-01')
assert.deepEqual(context.alerts[0].tools, ['Présentation ETF'])
console.log('Monitoring calendar: existing deadlines, exact tools, no duplicates or historical reserves.')
