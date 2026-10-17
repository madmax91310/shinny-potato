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
assert.equal(actual.alerts.filter(a => a.category === 'manual-fallback').length, 0, 'Chaque sujet des 100 ménages vient de la collecte Insee')
const fallback = monitoringContext({ today: '2026-10-14', schedule: [], items: [] }, [{ id: 'pea', title: 'Qui détient un PEA ?', checkedAt: '2026-10-03' }, { id: 'ok', title: 'OK', automation: 'official-source' }])
assert.equal(fallback.alerts.length, 1)
assert.equal(fallback.alerts[0].id, 'household-fallback:pea')
assert.equal(fallback.alerts[0].to, '/france-100-menages?sujet=pea')
console.log('Monitoring calendar: existing deadlines, exact tools, household fallbacks, no duplicates or historical reserves.')
