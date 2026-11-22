import {record,keys,inflate,checkedJSON} from './checked-json.js'
// Wire transport only: restore every proof and clock before existing reducers.
const MAX_BYTES = 256 * 1024 * 1024
const MAX_RECEIPT_BYTES = 8 * 1024 * 1024
async function expandProofChecks(state) {
  if (!state || typeof state !== 'object') return state
  if (!Object.hasOwn(state,'proofCheckStorage') && !Object.hasOwn(state,'proofCheckRecords')) {
    for (const row of Object.values(state.workflows ?? {})) if (row?.proofChecks && Object.values(row.proofChecks).some(value=>record(value) && Object.hasOwn(value,'proofCheckRef'))) throw Error()
    return state
  }
  if (state.proofCheckStorage !== 'sha256-records-v1' || !record(state.proofCheckRecords) || !record(state.workflows)) throw Error()
  const records = new Map(), used = new Set(), encoder = new TextEncoder()
  for (const [key,body] of Object.entries(state.proofCheckRecords)) {
    if (!/^[a-f0-9]{64}$/.test(key) || typeof body !== 'string') throw Error()
    const bytes = encoder.encode(body)
    if (bytes.byteLength > MAX_RECEIPT_BYTES) throw Error()
    const value = await checkedJSON(bytes,key)
    if (!record(value) || !Object.keys(value).length || Object.hasOwn(value,'proofCheckRef')) throw Error()
    records.set(key,value)
  }
  const workflows = []
  for (const [name,row] of Object.entries(state.workflows)) {
    if (!row || typeof row !== 'object' || !Object.hasOwn(row,'proofChecks')) { workflows.push([name,row]); continue }
    if (!record(row.proofChecks)) throw Error()
    const checks = []
    for (const [id,ref] of Object.entries(row.proofChecks)) {
      if (!keys(ref,['proofCheckRef']) || !records.has(ref.proofCheckRef)) throw Error()
      used.add(ref.proofCheckRef)
      checks.push([id,records.get(ref.proofCheckRef)])
    }
    workflows.push([name,{...row,proofChecks:Object.fromEntries(checks)}])
  }
  if (used.size !== records.size) throw Error()
  const {proofCheckStorage,proofCheckRecords,...rest} = state
  return {...rest,workflows:Object.fromEntries(workflows)}
}
export async function decodeMonitorStorage(input) {
  try {
    let state = input
    if (input && typeof input === 'object' && Object.hasOwn(input,'monitorStorage')) {
      if (!keys(input,['schemaVersion','monitorStorage','decodedBytes','sha256','data']) || input.schemaVersion !== 2 || input.monitorStorage !== 'gzip+base64-v1') throw Error()
      state = await inflate(input,MAX_BYTES)
      if (!record(state) || state.schemaVersion !== 1 || Object.hasOwn(state,'monitorStorage')) throw Error()
    }
    if (state && (Object.hasOwn(state,'reportScopeStorage') || Object.hasOwn(state,'reportScopeArchives'))) {
      const {expandScopeArchives} = await import('./monitor-scope-storage.js')
      state = await expandScopeArchives(state)
    }
    if (state && (Object.hasOwn(state, 'incidentHistoryStorage') || Object.hasOwn(state, 'incidentHistoryArchives'))) {
      const { expandIncidentHistory } = await import('./monitor-incident-history.js')
      state = await expandIncidentHistory(state)
    }
    return await expandProofChecks(state)
  } catch { throw Error('Transport du moniteur invalide ; dernières preuves conservées.') }
}
