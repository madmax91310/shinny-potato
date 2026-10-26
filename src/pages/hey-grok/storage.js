import { readLocalPreferenceRecord, writeLocalPreference } from '../../lib/publication-preferences.js'
import { BANK_BY_ID } from './catalog.js'
import { emptyFilters } from './lib.js'
import { THEMES } from './taxonomy.js'
export const STORAGE_KEY = 'el-hey-grok-v1'
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const strings = value => Array.isArray(value) && value.every(id => typeof id === 'string')
const stringMap = value => object(value) && Object.values(value).every(item => typeof item === 'string')
const validTheme = value => THEMES.some(theme => theme.id === value)
const validEditor = value => value === null || object(value) && (value.sourceId === null || typeof value.sourceId === 'string') && typeof value.text === 'string' && validTheme(value.theme) && typeof value.template === 'string' && stringMap(value.params) && typeof value.customized === 'boolean'
const validFilters = filters => object(filters) && Object.entries(emptyFilters()).every(([key, value]) => typeof filters[key] === typeof value)
const validPersonal = value => Array.isArray(value) && value.every(q => object(q) && typeof q.id === 'string' && q.id && !BANK_BY_ID.has(q.id) && typeof q.text === 'string' && validTheme(q.theme) && (q.deleted === undefined || typeof q.deleted === 'boolean')) && new Set(value.map(q => q.id)).size === value.length
const validHistory = history => object(history) && Object.values(history).every(item => object(item) && (item.markedAt === null || typeof item.markedAt === 'string' && Number.isFinite(Date.parse(item.markedAt))) && typeof item.text === 'string' && validTheme(item.theme))
const validWorkspace = workspace => object(workspace) && ['explorer', 'favoris', 'historique'].includes(workspace.view) && validFilters(workspace.filters) && validEditor(workspace.editor) && [workspace.bankFilters, workspace.personalFilters].every(filters => filters === undefined || validFilters(filters))
export function validRecord(value) {
  if (!object(value) || !strings(value.favorites) || !strings(value.used) || !stringMap(value.drafts)) return false
  if (value.version !== undefined && ![1, 2].includes(value.version)) return false
  if (value.personal !== undefined && !validPersonal(value.personal)) return false
  if (value.history !== undefined && !validHistory(value.history) || value.workspace !== undefined && !validWorkspace(value.workspace)) return false
  if (value.version !== 2) return true
  return validPersonal(value.personal) && validHistory(value.history) && validWorkspace(value.workspace)
}
export const emptyState = () => ({ version: 2, favorites: [], used: [], drafts: {}, personal: [], history: {}, workspace: { view: 'explorer', filters: emptyFilters(), editor: null } })
export function migrate(value) {
  if (value.version === 2) return value
  const result = { ...emptyState(), ...value, version: 2, personal: (value.personal ?? []).map(q => ({ ...q, sourceKind: 'personal' })), history: { ...(value.history ?? {}) }, workspace: value.workspace ?? emptyState().workspace }
  for (const id of result.used) {
    const question = BANK_BY_ID.get(id) ?? result.personal.find(q => q.id === id)
    if (result.history[id]) continue
    result.history[id] = { markedAt: null, text: result.drafts[id] ?? question?.previousText ?? question?.text ?? 'Texte historique non disponible dans cette version.', theme: question?.theme ?? 'patrimoine', legacy: true }
  }
  return result
}
export function readState(storage) {
  const record = readLocalPreferenceRecord(STORAGE_KEY, null, validRecord, storage)
  if (record.raw !== null && record.value === null) record.readable = false
  return { value: record.readable ? migrate(record.value ?? emptyState()) : emptyState(), raw: record.raw,
    error: record.readable ? '' : 'Les données locales sont illisibles ou indisponibles. Elles sont conservées ; les changements restent dans cette session.' }
}
export function saveState(value, expectedRaw, storage) {
  const current = readLocalPreferenceRecord(STORAGE_KEY, null, validRecord, storage)
  if (!current.readable || current.raw !== null && current.value === null) return { error: 'Les données locales ne peuvent pas être relues. Elles sont conservées ; tes changements restent dans cette session.' }
  if (current.raw !== expectedRaw) return { error: 'Les données ont changé dans un autre onglet. Recharge après avoir conservé ton brouillon ; aucun contenu enregistré n’a été remplacé.' }
  if (!validRecord(value)) return { error: 'Le format ne peut pas être sauvegardé. Les données existantes sont conservées.' }
  if (!writeLocalPreference(STORAGE_KEY, value, validRecord, storage)) return { error: 'Sauvegarde locale indisponible. Conserve ton brouillon avant de quitter ; les changements restent dans cette session.' }
  return { raw: JSON.stringify(value), error: '' }
}
export function markUsed(state, question, text, now = new Date().toISOString()) {
  if (state.used.includes(question.id)) {
    const history = { ...state.history }; delete history[question.id]
    return { ...state, used: state.used.filter(id => id !== question.id), history }
  }
  return { ...state, used: [...state.used, question.id], history: { ...state.history, [question.id]: { markedAt: now, text, theme: question.theme, legacy: false } } }
}
export function saveEditor(state, id, now = new Date().toISOString()) {
  const editor = state.workspace.editor
  if (!editor) return state
  const previous = state.personal.find(q => q.id === editor.sourceId)
  const question = { ...previous, id: previous?.id ?? id, text: editor.text, theme: editor.theme, sourceKind: 'personal', originId: previous?.originId ?? (BANK_BY_ID.has(editor.sourceId) ? editor.sourceId : null), createdAt: previous?.createdAt ?? now, updatedAt: now, deleted: false, public: previous?.public ?? false, debate: false }
  const drafts = { ...state.drafts }; if (editor.sourceId) delete drafts[editor.sourceId]
  return { ...state, drafts, personal: [...state.personal.filter(q => q.id !== question.id), question], workspace: { ...state.workspace, editor: null } }
}
export function deletePersonal(state, id) {
  return { ...state, personal: state.personal.flatMap(q => q.id !== id ? [q] : state.used.includes(id) ? [{ ...q, deleted: true }] : []),
    favorites: state.favorites.filter(value => value !== id), drafts: Object.fromEntries(Object.entries(state.drafts).filter(([key]) => key !== id)),
    workspace: { ...state.workspace, editor: state.workspace.editor?.sourceId === id ? null : state.workspace.editor } }
}
