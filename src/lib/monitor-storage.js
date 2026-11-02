// Wire transport only. All scopes, incidents, clocks and financial values are
// restored before the existing readers/reducers see this document.
const MAX_BYTES = 256 * 1024 * 1024
const MAX_RECEIPT_BYTES = 8 * 1024 * 1024
async function expandProofChecks(state) {
  if (!state || typeof state !== 'object') return state
  if (!Object.hasOwn(state, 'proofCheckStorage') && !Object.hasOwn(state, 'proofCheckRecords')) {
    for (const row of Object.values(state.workflows ?? {})) if (row?.proofChecks && Object.values(row.proofChecks).some(value => value && typeof value === 'object' && Object.hasOwn(value, 'proofCheckRef'))) throw Error('Missing receipt registry')
    return state
  }
  const registry = state.proofCheckRecords
  if (state.proofCheckStorage !== 'sha256-records-v1' || !registry || typeof registry !== 'object' || Array.isArray(registry)) throw Error('Invalid receipt registry')
  if (!state.workflows || typeof state.workflows !== 'object' || Array.isArray(state.workflows)) throw Error('Invalid receipt workflows')
  const records = new Map(), used = new Set(), encoder = new TextEncoder()
  for (const [key, body] of Object.entries(registry)) {
    if (!/^[a-f0-9]{64}$/.test(key) || typeof body !== 'string') throw Error('Invalid receipt identity')
    const bytes = encoder.encode(body)
    if (bytes.byteLength > MAX_RECEIPT_BYTES) throw Error('Receipt size limit')
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('')
    if (hash !== key) throw Error('Receipt checksum mismatch')
    const value = JSON.parse(body)
    if (!value || typeof value !== 'object' || Array.isArray(value) || !Object.keys(value).length || Object.hasOwn(value, 'proofCheckRef')) throw Error('Invalid receipt schema')
    records.set(key, value)
  }
  const workflows = []
  for (const [name, row] of Object.entries(state.workflows ?? {})) {
    if (!row || typeof row !== 'object' || !Object.hasOwn(row, 'proofChecks')) { workflows.push([name, row]); continue }
    if (!row.proofChecks || typeof row.proofChecks !== 'object' || Array.isArray(row.proofChecks)) throw Error('Invalid receipt list')
    const checks = []
    for (const [id, ref] of Object.entries(row.proofChecks)) {
      if (!ref || typeof ref !== 'object' || Object.keys(ref).length !== 1 || !Object.hasOwn(ref, 'proofCheckRef') || !records.has(ref.proofCheckRef)) throw Error('Missing receipt reference')
      used.add(ref.proofCheckRef)
      checks.push([id, records.get(ref.proofCheckRef)])
    }
    workflows.push([name, {...row, proofChecks: Object.fromEntries(checks)}])
  }
  if (used.size !== records.size) throw Error('Unreferenced receipt preserved as an error')
  const {proofCheckStorage, proofCheckRecords, ...rest} = state
  return {...rest, workflows: Object.fromEntries(workflows)}
}
export async function decodeMonitorStorage(input) {
  try {
    if (!input || typeof input !== 'object' || !Object.hasOwn(input, 'monitorStorage')) return await expandProofChecks(input)
    const keys = ['schemaVersion', 'monitorStorage', 'decodedBytes', 'sha256', 'data']
    if (Object.keys(input).length !== keys.length || keys.some(key => !Object.hasOwn(input, key)) || input.schemaVersion !== 2 || input.monitorStorage !== 'gzip+base64-v1' || !Number.isSafeInteger(input.decodedBytes) || input.decodedBytes <= 0 || input.decodedBytes > MAX_BYTES || !/^[a-f0-9]{64}$/.test(input.sha256) || typeof input.data !== 'string' || !input.data || input.data.length > MAX_BYTES * 2) throw Error('Unknown envelope')
    const binary = atob(input.data)
    if (btoa(binary) !== input.data) throw Error('Non-canonical base64')
    const compressed = Uint8Array.from(binary, c => c.charCodeAt(0))
    const reader = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip')).getReader()
    const chunks = []; let size = 0
    try {
      while (true) {
        const {done, value} = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > input.decodedBytes) throw Error('Decoded size limit')
        chunks.push(value)
      }
    } catch (error) { await reader.cancel().catch(() => {}); throw error }
    if (size !== input.decodedBytes) throw Error('Decoded size mismatch')
    const raw = new Uint8Array(size); let offset = 0
    for (const chunk of chunks) { raw.set(chunk, offset); offset += chunk.byteLength }
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', raw)), b => b.toString(16).padStart(2, '0')).join('')
    if (hash !== input.sha256) throw Error('Checksum mismatch')
    const state = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(raw))
    if (!state || typeof state !== 'object' || Array.isArray(state) || state.schemaVersion !== 1 || Object.hasOwn(state, 'monitorStorage')) throw Error('Invalid or nested state')
    return await expandProofChecks(state)
  } catch { throw Error('Transport du moniteur invalide ; dernières preuves conservées.') }
}
