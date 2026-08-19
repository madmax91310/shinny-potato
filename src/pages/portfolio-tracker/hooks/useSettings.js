import { useCallback, useState } from 'react'
import { storage } from '../lib/storage'

export function useSettings() {
  const [settings, setSettingsState] = useState(() => storage.getSettings())

  const updateSettings = useCallback((partial) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial }
      storage.setSettings(next)
      return next
    })
  }, [])

  return { settings, updateSettings }
}
