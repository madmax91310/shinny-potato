const PREFIX = 'epargnant-publication:v1:'
export function readPreference(key, fallback, validate = () => true) {
  try {
    const value = JSON.parse(globalThis.localStorage.getItem(PREFIX + key))
    return value !== null && validate(value) ? value : fallback
  } catch { return fallback }
}
export function writePreference(key, value) {
  try { globalThis.localStorage.setItem(PREFIX + key, JSON.stringify(value)) } catch { /* Storage is optional. */ }
}
