// Historical unversioned format: an array of IDs, including unknown/older IDs.
export const USED_KEY = 'el-dca-used-v1'
const validId = id => typeof id === 'string' && id.length < 100
const unreadable = 'L’historique des usages ne peut pas être lu. Il est conservé sur cet appareil ; recharge la page avant de réessayer.'

export function readUsageHistory(storage) {
  try {
    const raw = (storage ?? globalThis.localStorage).getItem(USED_KEY)
    const value = raw === null ? [] : JSON.parse(raw)
    const readable = Array.isArray(value) && value.every(validId)
    // Recognized entries may inform display, but never authorize a partial rewrite.
    const ids = Array.isArray(value) ? value.filter(validId) : []
    return { ids, raw, readable, error: readable ? '' : unreadable }
  } catch {
    return { ids: [], raw: null, readable: false, error: unreadable }
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
    if (!validId(id)) return { ...previous, error: 'Cet usage ne peut pas être enregistré dans l’historique.' }
    const ids = previous.ids.includes(id) ? previous.ids.filter(value => value !== id) : [...previous.ids, id]
    const raw = JSON.stringify(ids)
    target.setItem(USED_KEY, raw)
    return { ids, raw, readable: true, error: '' }
  } catch {
    return { ...previous, error: 'L’historique des usages ne peut pas être enregistré sur cet appareil. La version enregistrée est conservée ; tu peux réessayer.' }
  }
}
