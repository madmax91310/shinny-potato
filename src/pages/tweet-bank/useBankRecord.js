import { useEffect, useRef, useState } from 'react'
import { readBankRecord, saveBankRecord } from './storage.js'

// The bank owns two independent maps: drafts/reviews and publication dates.
// A failed read locks only its map for this mount; editing stays possible in memory.
export function useBankRecord(key) {
  const [initial] = useState(() => readBankRecord(key))
  const [value, setValue] = useState(initial.value)
  const [error, setError] = useState(initial.error)
  const expectedRaw = useRef(initial.raw)
  useEffect(() => {
    // Reading/mounting must never create a write, including in React StrictMode.
    if (value === initial.value || initial.error) return
    const saved = saveBankRecord(key, value, expectedRaw.current)
    if (!saved.error) expectedRaw.current = saved.raw
    setError(saved.error)
  }, [key, initial, value])
  return [value, setValue, error]
}
