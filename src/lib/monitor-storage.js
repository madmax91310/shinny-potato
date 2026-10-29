// Wire transport only. All scopes, incidents, clocks and financial values are
// restored before the existing readers/reducers see this document.
const MAX_BYTES = 256 * 1024 * 1024
export async function decodeMonitorStorage(input) {
  if (!input || typeof input !== 'object' || !Object.hasOwn(input, 'monitorStorage')) return input
  try {
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
    return state
  } catch { throw Error('Transport du moniteur invalide ; dernières preuves conservées.') }
}
