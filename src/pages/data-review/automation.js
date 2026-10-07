export const AUTOMATION_STATUS_URL = 'https://raw.githubusercontent.com/madmax91310/shinny-potato/automation-status/automation-status.json'

export function automationFailures(status) {
  if (status?.schemaVersion !== 1 || !status.workflows || typeof status.workflows !== 'object') throw new Error('Statut des automatisations indisponible')
  return Object.entries(status.workflows).filter(([, value]) => value.status === 'failure').flatMap(([id, value]) => {
    const failures = Object.entries(value.dataFailures ?? {})
    return failures.length ? failures.map(([dataId, data]) => ({ id: `${id}:${dataId}`, ...value, ...data })) : [{ id, ...value }]
  })
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}
