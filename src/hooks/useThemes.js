import { useEffect, useState } from 'react'
import { DEFAULT_THEMES, createEtf } from '../data/themes'
import { loadStoredThemes, saveThemes } from '../lib/tweetStorage'

export function useThemes() {
  const [themes, setThemes] = useState(() => loadStoredThemes() ?? DEFAULT_THEMES)

  useEffect(() => {
    saveThemes(themes)
  }, [themes])

  function updateTheme(themeId, patch) {
    setThemes((prev) => prev.map((t) => (t.id === themeId ? { ...t, ...patch } : t)))
  }

  function addEtf(themeId) {
    setThemes((prev) =>
      prev.map((t) => (t.id === themeId ? { ...t, etfs: [...t.etfs, createEtf()] } : t)),
    )
  }

  function updateEtf(themeId, etfId, patch) {
    setThemes((prev) =>
      prev.map((t) =>
        t.id === themeId
          ? { ...t, etfs: t.etfs.map((e) => (e.id === etfId ? { ...e, ...patch } : e)) }
          : t,
      ),
    )
  }

  function removeEtf(themeId, etfId) {
    setThemes((prev) =>
      prev.map((t) =>
        t.id === themeId ? { ...t, etfs: t.etfs.filter((e) => e.id !== etfId) } : t,
      ),
    )
  }

  function resetTheme(themeId) {
    const original = DEFAULT_THEMES.find((t) => t.id === themeId)
    if (!original) return
    setThemes((prev) => prev.map((t) => (t.id === themeId ? original : t)))
  }

  return { themes, updateTheme, addEtf, updateEtf, removeEtf, resetTheme }
}
