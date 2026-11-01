// Build-generated records use a content hash in their filename. Verify those bytes
// before exposing data to consumers or keeping a successful result in the cache.
export function createRecordLoader(urls, base, timeoutMs = 15000) {
  const cache = new Map()
  return function loadRecord(id) {
    if (!Object.hasOwn(urls, id)) return Promise.reject(new Error('Données introuvables'))
    if (!cache.has(id)) {
      const pending = (async () => {
        const response = await fetch(base + urls[id], { signal: AbortSignal.timeout(timeoutMs) })
        if (!response.ok) throw new Error('Chargement impossible. Réessaie les données.')
        const bytes = await response.arrayBuffer()
        const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('')
        if (!urls[id].endsWith('/' + hash.slice(0, 20) + '.json')) throw new Error('Données reçues incohérentes. Réessaie les données.')
        return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
      })().catch(error => { cache.delete(id); throw error })
      cache.set(id, pending)
    }
    return cache.get(id)
  }
}
