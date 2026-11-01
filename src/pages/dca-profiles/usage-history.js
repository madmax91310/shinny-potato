// Keep the historical key: v2 stores manual publication dates; legacy dates stay unknown.
export const USED_KEY = 'el-dca-used-v1'
const validDate = value => value === null || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value)
const validId = id => typeof id === 'string' && id.length < 100
const unreadable = 'L’historique des publications ne peut pas être lu. Il est conservé sur cet appareil ; recharge la page avant de réessayer.'

export function readUsageHistory(storage) {
  try {
    const raw = (storage ?? globalThis.localStorage).getItem(USED_KEY)
    const value = raw === null ? [] : JSON.parse(raw)
    const legacy = Array.isArray(value)
    const entries = legacy ? value.filter(validId).map(id=>({id,publishedAt:null})) : Array.isArray(value?.entries) ? value.entries.filter(entry=>entry && validId(entry.id) && validDate(entry.publishedAt)) : []
    const readable = legacy ? value.every(validId) : value?.version === 2 && Array.isArray(value.entries) && entries.length === value.entries.length
    // Recognized entries may inform display, but never authorize a partial rewrite.
    const ids = entries.map(entry=>entry.id)
    return { ids, entries, raw, readable, error: readable ? '' : unreadable }
  } catch {
    return { ids: [], entries: [], raw: null, readable: false, error: unreadable }
  }
}

export function toggleUsageHistory(previous, id, storage) {
  if (!previous.readable) return previous
  try {
    const target = storage ?? globalThis.localStorage
    const current = readUsageHistory(target)
    if (!current.readable) return { ...previous, error: current.error }
    // Same observed-snapshot protection as the bank (#974), with this list's contract.
    if (current.raw !== previous.raw) return { ...previous, error: 'L’historique a changé dans un autre onglet. Recharge la page avant de réessayer ; la version enregistrée est conservée.' }
    if (!validId(id)) return { ...previous, error: 'Ce marquage ne peut pas être enregistré dans l’historique.' }
    const entries = previous.ids.includes(id) ? previous.entries.filter(entry=>entry.id!==id) : [...previous.entries,{id,publishedAt:new Date().toISOString()}]
    const ids = entries.map(entry=>entry.id)
    const raw = JSON.stringify({version:2,entries})
    target.setItem(USED_KEY, raw)
    return { ids, entries, raw, readable: true, error: '' }
  } catch {
    return { ...previous, error: 'L’historique des publications ne peut pas être enregistré sur cet appareil. La version enregistrée est conservée ; tu peux réessayer.' }
  }
}
