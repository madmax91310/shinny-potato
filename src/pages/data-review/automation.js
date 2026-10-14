import registry from '../../data/automation-workflows.json' with { type: 'json' }
export const AUTOMATION_STATUS_URL = 'https://raw.githubusercontent.com/madmax91310/shinny-potato/automation-status/automation-status.json'

export function automationOverview(status, now = new Date()) {
  // Un état absent ou inconnu ne vaut jamais une collecte réussie.
  if (status?.schemaVersion !== 1 || !status.workflows || typeof status.workflows !== 'object' || Array.isArray(status.workflows)) throw new Error('Statut des automatisations indisponible')
  const configured = Object.fromEntries(Object.entries(registry).map(([id, entry]) => [id, { name: entry.name }]))
  return Object.entries({ ...configured, ...status.workflows }).map(([id, value]) => {
    if (!value || typeof value !== 'object' || typeof value.name !== 'string') throw new Error('Statut de collecte invalide')
    const failures = Object.keys(value.dataFailures ?? {}).length
    const maxAge = registry[id]?.maxAgeHours
    const completed = Date.parse(value.completedAt)
    const validCompleted = Number.isFinite(completed) && completed <= now.getTime()
    const overdue = validCompleted && maxAge && now.getTime() - completed > maxAge * 3600000
    const state = value.status === 'failure' || failures ? 'failure'
      : overdue ? 'overdue' : validCompleted && value.collectionStatus === 'success' ? 'success' : 'unknown'
    return { ...value, id, state, failureCount: failures, maxAgeHours: maxAge }
  }).sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

export function automationFailures(status) {
  if (status?.schemaVersion !== 1 || !status.workflows || typeof status.workflows !== 'object') throw new Error('Statut des automatisations indisponible')
  return automationOverview(status).filter(value => value.state === 'failure').map(value => [value.id, value]).flatMap(([id, value]) => {
    const failures = Object.entries(value.dataFailures ?? {})
    return failures.length ? failures.map(([dataId, data]) => ({ ...value, ...data, id: `${id}:${dataId}` })) : [{ id, ...value }]
  })
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}
