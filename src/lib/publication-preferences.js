const PREFIX = 'epargnant-publication:v1:'
function readRecord(key, fallback, validate) {
  try {
    const raw = globalThis.localStorage.getItem(key)
    const value = raw === null ? null : JSON.parse(raw)
    if (value === null) return { value: fallback, readable: true }
    return validate(value) ? { value, readable: true } : { value: fallback, readable: false }
  } catch { return { value: fallback, readable: false } }
}
// Raw-key entry points preserve the historical Home namespace.
export function readLocalPreference(key, fallback, validate = () => true) {
  return readRecord(key, fallback, validate).value
}
export function writeLocalPreference(key, value, validate = () => true) {
  try {
    const storage = globalThis.localStorage
    const raw = storage.getItem(key)
    if (raw !== null) {
      const previous = JSON.parse(raw)
      // A fallback is usable in memory, but must never erase an unreadable record.
      if (previous !== null && !validate(previous)) return false
    }
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch { return false }
}
export function readPreferenceRecord(key, fallback, validate = () => true) {
  return readRecord(PREFIX + key, fallback, validate)
}
export function readPreference(key, fallback, validate = () => true) {
  return readPreferenceRecord(key, fallback, validate).value
}
export function writePreference(key, value, validate = () => true) {
  return writeLocalPreference(PREFIX + key, value, validate)
}
