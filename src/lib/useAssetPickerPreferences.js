import { useEffect, useSyncExternalStore } from 'react'
import { readPreference, readPreferenceRecord, writePreference } from './publication-preferences.js'
import { ASSET_FAVORITES_KEY, ASSET_RECENTS_KEY, assetPreferenceKey, updateAssetKeys, validAssetKeys } from './asset-picker-preferences.js'
const snapshot = () => JSON.stringify({favorites:readPreference(ASSET_FAVORITES_KEY, [], validAssetKeys),recents:readPreference(ASSET_RECENTS_KEY, [], validAssetKeys)})
const subscribe = callback => {
  globalThis.addEventListener('asset-picker-preferences', callback)
  globalThis.addEventListener('storage', callback)
  return () => { globalThis.removeEventListener('asset-picker-preferences', callback); globalThis.removeEventListener('storage', callback) }
}
export function useAssetPickerPreferences(items, legacyKey, persistent = true) {
  const {favorites,recents} = JSON.parse(useSyncExternalStore(subscribe, snapshot, () => '{"favorites":[],"recents":[]}'))
  useEffect(() => {
    if (!persistent) return
    const migratedKey = `asset-picker:migrated:${legacyKey}`
    const migration = readPreferenceRecord(migratedKey, false, value => typeof value === 'boolean')
    if (!migration.readable || migration.value) return
    const previous = readPreferenceRecord(legacyKey, [], validAssetKeys)
    if (!previous.readable) return
    const keys = items.filter(item => previous.value.includes(String(item.id))).map(assetPreferenceKey)
    if (keys.length && !updateAssetKeys(ASSET_FAVORITES_KEY, all => [...all,...keys])) return
    writePreference(migratedKey, true, value => typeof value === 'boolean')
  }, [items, legacyKey, persistent])
  return { favorites, recents,
    toggleFavorite: item => persistent && updateAssetKeys(ASSET_FAVORITES_KEY, all => all.includes(assetPreferenceKey(item)) ? all.filter(key => key !== assetPreferenceKey(item)) : [assetPreferenceKey(item),...all]),
    remember: item => persistent && updateAssetKeys(ASSET_RECENTS_KEY, all => [assetPreferenceKey(item),...all], 8),
  }
}

