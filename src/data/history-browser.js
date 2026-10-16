// Node fallback; the build derives per-asset JSON URLs from the same registry.
export async function loadHistoryRecord(id) {
  const { ASSETS } = await import('./market-history.js')
  if (!ASSETS[id]) throw Error('Historique introuvable')
  return ASSETS[id]
}
