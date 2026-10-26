import { useEffect, useEffectEvent, useState } from 'react'
import { readPreference, writePreference } from './publication-preferences.js'
// Persist inputs and identities only; generated figures are always recomputed.
export function usePublicationPreference(key, fallback, validate) {
  const [value, setValue] = useState(() => readPreference(key, typeof fallback === 'function' ? fallback() : fallback, validate))
  // Inline validators may change identity without resaving an unchanged selection.
  const persist = useEffectEvent((key, value) => writePreference(key, value, validate))
  useEffect(() => { persist(key, value) }, [key, value])
  return [value, setValue]
}
