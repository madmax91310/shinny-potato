const KEYS = {
  positions: 'pt_positions',
  settings: 'pt_settings',
  snapshots: 'pt_snapshots',
  lastPrices: 'pt_last_prices',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage full or unavailable: fail silently, app keeps working in-memory
  }
}

export const storage = {
  getPositions: () => read(KEYS.positions, []),
  setPositions: (positions) => write(KEYS.positions, positions),

  getSettings: () => read(KEYS.settings, { twelveDataApiKey: '' }),
  setSettings: (settings) => write(KEYS.settings, settings),

  getSnapshots: () => read(KEYS.snapshots, []),
  setSnapshots: (snapshots) => write(KEYS.snapshots, snapshots),

  getLastPrices: () => read(KEYS.lastPrices, {}),
  setLastPrices: (prices) => write(KEYS.lastPrices, prices),
}
