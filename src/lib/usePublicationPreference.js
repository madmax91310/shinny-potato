import { useEffect, useState } from 'react'
import { readPreference, writePreference } from './publication-preferences.js'
// Persist inputs and identities only; generated figures are always recomputed.
export function usePublicationPreference(key, fallback, validate) {
  const [value, setValue] = useState(() => readPreference(key, typeof fallback === 'function' ? fallback() : fallback, validate))
  useEffect(() => { writePreference(key, value) }, [key, value])
  return [value, setValue]
}
