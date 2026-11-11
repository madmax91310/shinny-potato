import assert from 'node:assert/strict'

// This contract belongs to code, not to the automation data overlay. A qualified
// data snapshot must never be republished with consumers that ignore its refusals.
export const HISTORY_CONSUMER_CONTRACT = 'scripts/history-consumer-capabilities.json'
const histories=['src/data/automated-monthly.json','src/data/automated-etf-monthly.json','src/data/non-bond-monthly-records.json']

function observedRequirements(ref,git){
  const features=new Set()
  for(const file of histories){
    if(!git('ls-tree','--name-only',ref,'--',file))continue
    for(const record of Object.values(JSON.parse(git('show',`${ref}:${file}`)))){
      if(record.anniversaryPriceReview)features.add('quoted-price-windows')
      if(record.scaleInvestigation)features.add('isolated-observation-windows')
      if(record.splitAdjustmentEvidence){
        features.add('split-price-comparability')
        if(record.splitAdjustmentEvidence.identityUnqualifiedMonths?.length)features.add('instrument-identity-windows')
      }
    }
  }
  return [...features]
}

function contract(ref, git) {
  if (!git('ls-tree', '--name-only', ref, '--', HISTORY_CONSUMER_CONTRACT)) return null
  const value = JSON.parse(git('show', `${ref}:${HISTORY_CONSUMER_CONTRACT}`))
  assert.equal(value.schemaVersion, 1, 'Unknown financial history consumer contract')
  assert(Array.isArray(value.features) && value.features.length > 0)
  assert(value.features.every(f => typeof f === 'string' && f.length > 0))
  assert.equal(new Set(value.features).size, value.features.length)
  return value
}

// Listing authorities are compiled into the financial consumer. Only hosts
// actually used by a listing in this data snapshot require newer code; an unused
// registry addition does not hold back unrelated observations.
function requireListingAuthorities({codeSha, dataSha, git}) {
  const read = (ref, file) => git('ls-tree', '--name-only', ref, '--', file)
    ? JSON.parse(git('show', `${ref}:${file}`)) : null
  const registry = 'scripts/listing-source-hosts.json'
  const dataHosts = new Set(read(dataSha, registry)?.hosts ?? [])
  const codeHosts = new Set(read(codeSha, registry)?.hosts ?? [])
  const metadata = read(dataSha, 'src/data/automated-instrument-metadata.json') ?? {}
  const previous = read(dataSha, 'src/data/qualified-listing-records.json') ?? {}
  const required = new Set()
  for (const rows of [...Object.values(metadata).map(record => record.listings?.value ?? []), ...Object.values(previous)]) {
    for (const row of rows) {
      try {
        const url = new URL(row.sourceUrl)
        if (url.protocol === 'https:' && dataHosts.has(url.hostname)) required.add(url.hostname)
      } catch { /* Invalid evidence remains rejected by the financial consumer. */ }
    }
  }
  const missing = [...required].filter(host => !codeHosts.has(host)).sort()
  assert.equal(missing.length, 0,
    `Publication refusée : le code ${codeSha} ne reconnaît pas les autorités de cotation utilisées par les données ${dataSha} (${missing.join(', ')}). Attendre le code qualifié ; ne pas publier ces preuves avec un consommateur qui les ignore.`)
}

export function requireHistoryPublicationCompatibility({codeSha, dataSha, git}) {
  requireListingAuthorities({codeSha, dataSha, git})
  // Earlier prepared snapshots already contain refusals, even before the marker
  // was introduced. Missing metadata must never downgrade their protection.
  const declared = contract(dataSha, git)
  const required=[...new Set([...(declared?.features??[]),...observedRequirements(dataSha,git)])]
  if (!required.length) return // Existing snapshots without these protections.
  const supported = contract(codeSha, git)
  const missing = required.filter(feature => !supported?.features.includes(feature))
  assert.equal(missing.length, 0,
    `Publication refusée : le code ${codeSha} ne sait pas appliquer les restrictions financières des données ${dataSha} (${missing.join(', ')}). Le code qualifié doit passer le portail complet ; les données ne peuvent pas être publiées avec un ancien consommateur.`)
}
