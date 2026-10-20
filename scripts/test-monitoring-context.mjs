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

// Historical gaps are checked independently of a successful collector run.
const { inspectHistory, historyAlerts } = await import('./history-alerts.mjs')
const { incidentDiagnostic } = await import('../src/pages/data-review/incident-diagnostic.js')
const policy = { dataDays: 65 }
const inspect = periods => inspectHistory({ periods, cadence: 'monthly', today: '2026-10-18', policy })
assert.deepEqual(inspect([['2026-07', 100], ['2026-09', 103]]).missingPeriods, ['2026-08'])
assert.deepEqual(inspect([['2026-09', 100]]).missingPeriods, [], 'A new fund does not owe pre-launch history')
assert.deepEqual(inspect([['2026-08', null], ['2026-09', 0]]).invalidPeriods, ['2026-08', '2026-09'])
assert.equal(inspect([['2026-09', 100]]).delayed, false)
assert.equal(inspect([['2026-06', 100]]).delayed, true)
assert.equal(inspectHistory({ periods: [['2026-06', 100]], cadence: 'monthly', today: '2026-10-18', policy: { dataDays: 120 } }).delayed, false, 'Use the provided policy, not a duplicate threshold')
const annual = inspectHistory({ periods: [[2021, 4], [2022, -20], [2024, 0], [2025, 12], [2026, 6]], cadence: 'annual', today: '2026-10-18', policy: { dataDays: 550 }, firstCompleteYear: 2022 })
assert.deepEqual(annual.missingPeriods, ['2023'])
assert.deepEqual(annual.invalidPeriods, [], 'Zero and negative annual returns are valid')
assert.equal(annual.asOf, '2025', 'The current year is never a full calendar year')
assert.equal(annual.delayed, false)
assert.deepEqual(inspectHistory({ periods: [[2025, 12]], cadence: 'annual', today: '2026-10-18', policy: { dataDays: 550 }, firstCompleteYear: 2026 }).missingPeriods, [])
assert.deepEqual(inspect([]).missingPeriods, [], 'No qualified history is a coverage limitation, not an invented gap')
assert(Array.isArray(historyAlerts('2026-10-18', actual.entities)))
const diagnostic = incidentDiagnostic({id:'a', name:'ETF', kind:'history', field:'Historique mensuel', missingPeriods:['2026-08'], cause:'2026-08 absent', tools:['Performance depuis'], sourceUrls:['https://example.org/source'], checkedAt:'2026-10-17', asOf:'2026-09'}, { checkedAt:'2026-10-18' })
assert.match(diagnostic, /2026-08 absent/)
assert.match(diagnostic, /https:\/\/example.org\/source/)
assert.match(diagnostic, /Période de la donnée conservée : 2026-09/)
assert.match(diagnostic, /Devise : Non documenté/)
console.log('History alerts: gaps, launch boundary, invalid observations, policy delays and diagnostics OK')

assert.deepEqual(inspectHistory({periods:[],cadence:'monthly',today:'2026-10-18',policy,periodStart:'2026-08',periodEnd:'2026-09'}).missingPeriods,['2026-08','2026-09'], 'An emptied previously documented range remains an incident')
assert.deepEqual(inspectHistory({periods:[['2026-08',100]],cadence:'monthly',today:'2026-10-18',policy,periodStart:'2026-07',periodEnd:'2026-09'}).missingPeriods,['2026-07','2026-09'], 'Declared endpoints cannot silently disappear')
const {fieldAlerts}=await import('./build-monitoring-context.mjs')
const rows=[
 {type:'instrument',id:'A',name:'A',field:'completeHoldings',label:'Positions intégrales',present:true,state:'current',diagnostic:{code:'retained-source-failure',reason:'HTTP 403'},checkedAt:'2026-10-01',asOf:'2026-09-30',tools:['dca-profiles']},
 {type:'instrument',id:'B',name:'B',field:'countries',present:true,state:'check-overdue',checkedAt:'2026-10-01'},
 {type:'instrument',id:'C',present:false,state:'not-published'},
 {type:'instrument',id:'D',present:true,state:'current'}]
const fields=fieldAlerts({checkedAt:'2026-10-20',rows})
assert.equal(fields.length,2)
assert.equal(fields[0].kind,'collection')
assert.equal(fields[0].checkedAt,'2026-10-01')
assert.equal(fields[0].asOf,'2026-09-30')
assert.equal(fields[1].kind,'freshness')
assert.equal(fields[0].evaluatedAt,'2026-10-20')
assert.deepEqual(fieldAlerts({checkedAt:'2026-10-20',rows:[rows[0]]},[{aliases:['A'],tools:['Portefeuille & DCA']}])[0].tools,['Portefeuille & DCA'])
