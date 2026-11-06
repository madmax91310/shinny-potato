import assert from 'node:assert/strict'

// This contract belongs to code, not to the automation data overlay. A qualified
// data snapshot must never be republished with consumers that ignore its refusals.
export const HISTORY_CONSUMER_CONTRACT = 'scripts/history-consumer-capabilities.json'

function contract(ref, git) {
  if (!git('ls-tree', '--name-only', ref, '--', HISTORY_CONSUMER_CONTRACT)) return null
  const value = JSON.parse(git('show', `${ref}:${HISTORY_CONSUMER_CONTRACT}`))
  assert.equal(value.schemaVersion, 1, 'Unknown financial history consumer contract')
  assert(Array.isArray(value.features) && value.features.length > 0)
  assert(value.features.every(f => typeof f === 'string' && f.length > 0))
  assert.equal(new Set(value.features).size, value.features.length)
  return value
}

export function requireHistoryPublicationCompatibility({codeSha, dataSha, git}) {
  const required = contract(dataSha, git)
  if (!required) return // Existing snapshots before these protections keep their contract.
  const supported = contract(codeSha, git)
  const missing = required.features.filter(feature => !supported?.features.includes(feature))
  assert.equal(missing.length, 0,
    `Publication refusée : le code ${codeSha} ne sait pas appliquer les restrictions financières des données ${dataSha} (${missing.join(', ')}). Le code qualifié doit passer le portail complet ; les données ne peuvent pas être publiées avec un ancien consommateur.`)
}
