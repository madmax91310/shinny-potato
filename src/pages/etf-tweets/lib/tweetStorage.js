const STORAGE_KEY = 'etf_tweet_gen_themes_v1'

export function loadStoredThemes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveThemes(themes) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes))
  } catch {
    // stockage indisponible ou plein : l'app continue en mémoire uniquement
  }
}
