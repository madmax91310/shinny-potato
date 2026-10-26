import { useRef, useState } from 'react'
import { readState, saveState } from './storage.js'
// No mount-time write: migration stays in memory until an intentional edit.
// Writes happen outside React state-updater functions (including in StrictMode).
export default function useGrokStore() {
  const [loaded] = useState(() => readState())
  const [state, setState] = useState(loaded.value)
  const [error, setError] = useState(loaded.error)
  const current = useRef(loaded.value), raw = useRef(loaded.raw)
  function commit(transform) {
    const next = transform(current.current)
    current.current = next
    setState(next)
    const saved = saveState(next, raw.current)
    if (!saved.error) raw.current = saved.raw
    setError(saved.error)
    return !saved.error
  }
  return { state, error, commit }
}
