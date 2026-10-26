const PREFIX = 'epargnant-publication:v1:'
function readRecord(key, fallback, validate, storage) {
  try {
    const raw = (storage ?? globalThis.localStorage).getItem(key)
    const value = raw === null ? null : JSON.parse(raw)
    if (value === null) return { value: fallback, readable: true, raw }
    return validate(value) ? { value, readable: true, raw } : { value: fallback, readable: false, raw }
  } catch { return { value: fallback, readable: false, raw: null } }
}
// Raw-key entry points preserve the historical Home namespace.
export function readLocalPreference(key, fallback, validate = () => true) {
  return readRecord(key, fallback, validate).value
}
export function writeLocalPreference(key, value, validate = () => true, storage) {
  try {
    const target = storage ?? globalThis.localStorage
    const raw = target.getItem(key)
    if (raw !== null) {
      const previous = JSON.parse(raw)
      // A fallback is usable in memory, but must never erase an unreadable record.
      if (previous !== null && !validate(previous)) return false
    }
    target.setItem(key, JSON.stringify(value))
    return true
  } catch { return false }
}
export function readPreferenceRecord(key, fallback, validate = () => true) {
  const { value, readable } = readRecord(PREFIX + key, fallback, validate)
  return { value, readable }
}
export function readPreference(key, fallback, validate = () => true) {
  return readPreferenceRecord(key, fallback, validate).value
}
export function writePreference(key, value, validate = () => true) {
  return writeLocalPreference(PREFIX + key, value, validate)
}

// Raw-key snapshot for consumers with a historical key and compare-before-write contract.
// Existing readPreferenceRecord keeps its exact public return shape.
export function readLocalPreferenceRecord(key, fallback, validate = () => true, storage) {
  return readRecord(key, fallback, validate, storage)
}
