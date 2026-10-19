import assert from 'node:assert/strict'
import { automationOverview, automationFailures } from '../src/pages/data-review/automation.js'
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

for (const completedAt of [undefined, 'invalid', '2026-10-14T00:00:00Z']) {
  const bad = { schemaVersion: 1, workflows: { incomplete: { name: 'Sans date valide', collectionStatus: 'success', completedAt } } }
  assert.equal(automationOverview(bad, now).find(r => r.id === 'incomplete').state, 'unknown')
}
assert(automationFailures(status).some(row => row.id === 'partial:one'), 'Un échec de champ doit apparaître même si le workflow global réussit')

// Every production collector is supervised, with its phases and the exact tool routes it feeds.
{
  const { readdirSync } = await import('node:fs')
  const { TOOLS } = await import('../src/tools.js')
  const { relativeAge } = await import('../src/pages/data-review/automation.js')
  const routes = new Set(TOOLS.map(tool => tool.to))
  // Diagnostics that commit nothing are not collectors; list them here with their reason.
  const diagnostics = { 'probe-bitcoin-monthly.yml': 'Pilote Coinbase : diagnostic indépendant, aucune donnée active' }
  const collectors = readdirSync(new URL('../.github/workflows/', import.meta.url)).filter(name => /^(update|collect|refresh)-.*\.yml$/.test(name) && !(name in diagnostics))
  for (const name of collectors) assert(registry[name], `Collecteur hors surveillance : ${name}`)
  for (const [id, entry] of Object.entries(registry)) {
    assert(Array.isArray(entry.paths) && entry.paths.length, `Routes absentes : ${id}`)
    for (const path of entry.paths) assert(routes.has(path), `Route inconnue pour ${id} : ${path}`)
    assert(Array.isArray(entry.collectionSteps) && entry.collectionSteps.length, `Étapes de collecte absentes : ${id}`)
    assert(entry.tools.every(tool => typeof tool === 'string' && tool.length), `Libellés d’outils invalides : ${id}`)
  }
  const withPaths = automationOverview(status, now).find(r => r.id === 'update-investor-13f.yml')
  assert.deepEqual(withPaths.paths, ['/portefeuilles-investisseurs'])
  assert.equal(withPaths.age, 'il y a 10 h')
  assert.equal(relativeAge('2026-10-13T19:45:00Z', now), 'il y a 15 min')
  assert.equal(relativeAge('2026-10-10T10:00:00Z', now), 'il y a 3 j')
  assert.equal(relativeAge('invalid', now), null)
  const withCause = automationOverview({ schemaVersion: 1, workflows: { x: { name: 'X', status: 'failure', failures: [{ job: 'deploy / build', step: 'Run npm run audit:etf-annual-performance' }], dataFailures: { a: { cause: 'HTTP 403' } } } } }, now).find(r => r.id === 'x')
  assert.equal(withCause.cause, 'deploy / build : Run npm run audit:etf-annual-performance ; HTTP 403')
  console.log(`Automation manifest: ${collectors.length} collectors supervised, routes, phases, age and causes verified.`)
}


const recovering = structuredClone(status)
recovering.recovery = { partial: { status: 'waiting', reason: 'transient-source', nextAttemptAt: '2026-10-13T21:00:00Z' } }
const recoveryRow = automationOverview(recovering, now).find(r => r.id === 'partial')
assert.equal(recoveryRow.state, 'failure', 'Une relance ne vaut pas une récupération de la source')
assert.equal(recoveryRow.recovery.status, 'waiting')
assert.equal(recoveryRow.recovery.nextAttemptAt, '2026-10-13T21:00:00Z')
assert.equal(automationOverview(status, now).find(r => r.id === 'partial').recovery, null)
