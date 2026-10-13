import assert from 'node:assert/strict'
import { automationOverview } from '../src/pages/data-review/automation.js'
import registry from '../src/data/automation-workflows.json' with { type: 'json' }
const now = new Date('2026-10-13T20:00:00Z')
assert.throws(() => automationOverview(null))
assert.throws(() => automationOverview({ schemaVersion: 1, workflows: [] }))
assert.throws(() => automationOverview({ schemaVersion: 1, workflows: { bad: null } }))
const status = { schemaVersion: 1, workflows: {
  'update-investor-13f.yml': { name: 'Investisseurs', status: 'success', collectionStatus: 'success', completedAt: '2026-10-13T10:00:00Z' },
  'update-lifestrategy.yml': { name: 'LifeStrategy', status: 'success', collectionStatus: 'success', completedAt: '2026-10-10T10:00:00Z' },
  partial: { name: 'Partiel', status: 'success', dataFailures: { one: { cause: 'Source absente' } } },
  ambiguous: { name: 'Succès global seul', status: 'success' },
} }
const rows = automationOverview(status, now)
assert.equal(rows.find(r => r.id === 'update-investor-13f.yml').state, 'success')
assert.equal(rows.find(r => r.id === 'update-lifestrategy.yml').state, 'overdue')
assert.equal(rows.find(r => r.id === 'partial').state, 'failure')
assert.equal(rows.find(r => r.id === 'partial').failureCount, 1)
assert.equal(rows.find(r => r.id === 'ambiguous').state, 'unknown', 'Un succès global ne certifie pas une collecte')
for (const id of Object.keys(registry)) assert(rows.some(r => r.id === id), `Collecte absente : ${id}`)
assert.equal(rows.find(r => r.id === 'update-non-bond-expansion.yml').state, 'unknown')
assert.equal(rows.find(r => r.id === 'update-non-bond-expansion.yml').completedAt, undefined)
const staleFailure = structuredClone(status)
staleFailure.workflows['update-lifestrategy.yml'].status = 'failure'
assert.equal(automationOverview(staleFailure, now).find(r => r.id === 'update-lifestrategy.yml').state, 'failure')
console.log('Automation overview: configured collectors, independent collection status, overdue checks and failures verified.')
