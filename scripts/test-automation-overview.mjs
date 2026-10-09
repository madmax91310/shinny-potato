import assert from 'node:assert/strict'
import { automationOverview } from '../src/pages/data-review/automation.js'

assert.throws(() => automationOverview(null))
assert.throws(() => automationOverview({ schemaVersion: 1, workflows: [] }))
assert.throws(() => automationOverview({ schemaVersion: 1, workflows: { bad: null } }))
const rows = automationOverview({ schemaVersion: 1, workflows: {
  success: { name: 'A', status: 'success', completedAt: '2026-10-09T10:00:00Z' },
  partial: { name: 'B', status: 'success', dataFailures: { one: { cause: 'Source absente' } } },
  unknown: { name: 'C' },
  failed: { name: 'D', status: 'failure', lastSuccessAt: '2026-10-01T10:00:00Z' },
} })
assert.deepEqual(rows.map(row => row.state), ['success', 'failure', 'unknown', 'failure'])
assert.equal(rows[1].failureCount, 1, 'Un succès de workflow ne masque pas une donnée en échec')
assert.equal(rows[3].lastSuccessAt, '2026-10-01T10:00:00Z')
assert.equal(rows[2].completedAt, undefined, 'Ne pas inventer une date de collecte')
console.log('Bilan des collectes : succès, échec partiel, état inconnu, dates et validation du statut OK.')
