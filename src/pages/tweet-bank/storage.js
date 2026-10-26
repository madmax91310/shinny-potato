// These unversioned maps are the existing on-device format. Keep keys and unknown
// fields/IDs so loading a newer draft never strips user content.
export const LAST_PUBLICATION_KEY = 'pc-tweet-bank-last-pub'
export const DRAFTS_KEY = 'pc-tweet-bank-drafts-v1'
const objectMap = value => value !== null && typeof value === 'object' && !Array.isArray(value)
function validRecord(key, value) {
  if (!objectMap(value)) return false
  if (key === LAST_PUBLICATION_KEY) return Object.values(value).every(date => typeof date === 'string' || date === null)
  if (key === DRAFTS_KEY) return Object.values(value).every(draft => objectMap(draft) && (draft.text === undefined || typeof draft.text === 'string') &&
    ['asOf', 'checkedAt', 'verifiedText', 'verifiedAsOf'].every(field => draft[field] == null || typeof draft[field] === 'string'))
  return false
}
export function readBankRecord(key, storage) {
  try {
    const raw = (storage ?? globalThis.localStorage).getItem(key)
    const value = raw === null ? {} : JSON.parse(raw)
    if (!validRecord(key, value)) throw new Error('format')
    return { value, raw, error: '' }
  } catch {
    return { value: {}, raw: null, error: 'Les données locales ne peuvent pas être lues. Elles sont conservées ; les changements restent dans cette session.' }
  }
}
export function saveBankRecord(key, value, expectedRaw, storage) {
  try {
    const target = storage ?? globalThis.localStorage
    const current = readBankRecord(key, target)
    if (current.error) return { error: current.error }
    // Do not silently replace a different tab's edits, or a record that became
    // unreadable since this page mounted. Reloading will read that version.
    if (current.raw !== expectedRaw) return { error: 'La sauvegarde a changé dans un autre onglet. Recharge la page avant de modifier la version enregistrée ; tes changements restent dans cette session.' }
    if (!validRecord(key, value)) return { error: 'Le format ne peut pas être enregistré. Les données locales sont conservées.' }
    const raw = JSON.stringify(value)
    target.setItem(key, raw)
    return { raw, error: '' }
  } catch {
    return { error: 'Le stockage local est indisponible. Conserve tes modifications avant de quitter la page.' }
  }
}
