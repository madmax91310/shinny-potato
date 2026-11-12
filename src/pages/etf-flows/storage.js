import { readLocalPreferenceRecord, writeLocalPreference } from '../../lib/publication-preferences.js'
import { addObservation, validateObservation } from './lib.js'
export const STORAGE_KEY = 'el-etf-flows-v1'
export function validStore(value) {
  if (value?.version !== 1 || !Array.isArray(value.observations)) return false
  try { value.observations.reduce((all, o) => addObservation(all, o), []); return true } catch { return false }
}
export function loadFlows(storage) {
  const record = readLocalPreferenceRecord(STORAGE_KEY, null, validStore, storage)
  return { ...record, value: record.value ?? {version: 1, observations: []}, error: !record.readable || record.raw !== null && record.value === null ? 'Stockage illisible ou indisponible. Les données existantes sont conservées ; importe uniquement pour cette session.' : '' }
}
export function saveFlows(observations, expectedRaw, storage) {
  const current = loadFlows(storage)
  if (current.error || current.raw !== expectedRaw) return {error: 'Stockage indisponible ou modifié dans un autre onglet. Aucun contenu remplacé ; conserve le JSON avant de quitter.'}
  const value = {version: 1, observations}
  if (observations.some(o => validateObservation(o).length) || !writeLocalPreference(STORAGE_KEY, value, validStore, storage)) return {error: 'Sauvegarde impossible ; les données restent dans cette session. Conserve le JSON.'}
  return {raw: JSON.stringify(value), error: ''}
}
