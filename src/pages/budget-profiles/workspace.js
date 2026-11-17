import { validBudget } from './lib.js'
import { validPublicationDate } from './publication.js'
import { budgetFinancialReference } from './completion.js'

export const DRAFT_KEY = 'el-budget-draft-v1'
export const USAGE_KEY = 'el-budget-usage-v1'
export const PUBLISHED_KEY = 'el-budget-published-v1'
export const WORKSPACE_KEY = 'el-budget-workspace-v2'
export const validDraft = item => !!item && validBudget(item.profile) && typeof item.text === 'string' && item.text.length <= 20000 && typeof item.edited === 'boolean' && (item.textFinance === undefined || typeof item.textFinance === 'string' && item.textFinance.length <= 20000)
export const validUsage = ids => Array.isArray(ids) && ids.length <= 5000 && new Set(ids).size === ids.length && ids.every(id => typeof id === 'string' && id.length > 0 && id.length <= 100)
export const BUDGET_WORKSPACE_VERSION = 5
export const emptyBudgetWorkspace = () => ({ version: BUDGET_WORKSPACE_VERSION, drafts: [], activeId: null, used: [], published: [], queued: [], publicationDates: {}, scheduledDates: {} })
const validLegacyWorkspace = value => !!value && value.version === 2 && Array.isArray(value.drafts) && value.drafts.length <= 500 && value.drafts.every(validDraft) && new Set(value.drafts.map(d => d.profile.id)).size === value.drafts.length && (value.activeId === null || typeof value.activeId === 'string' && value.activeId.length <= 100) && ['used', 'published', 'queued'].every(key => validUsage(value[key]))
// Keep the atomic key: old v4 tabs refuse v5 instead of dropping planned dates.
// Legacy bytes migrate only on a successful write; corrupted bytes stay intact.
const validV3Workspace = value => !!value && value.version === 3 && validLegacyWorkspace({ ...value, version: 2 }) &&
  !!value.publicationDates && typeof value.publicationDates === 'object' && !Array.isArray(value.publicationDates) &&
  Object.keys(value.publicationDates).length === value.published.length && value.published.every(id => Object.hasOwn(value.publicationDates, id) && (value.publicationDates[id] === null || validPublicationDate(value.publicationDates[id])))
const validV4Workspace = value => !!value && value.version === 4 && validV3Workspace({ ...value, version: 3 })
const validScheduledDates = (dates, queued) => !!dates && typeof dates === 'object' && !Array.isArray(dates) && Object.keys(dates).length <= queued.length && Object.entries(dates).every(([id, date]) => queued.includes(id) && validPublicationDate(date))
export const validWorkspace = value => !!value && value.version === BUDGET_WORKSPACE_VERSION && validV4Workspace({ ...value, version: 4 }) && validScheduledDates(value.scheduledDates, value.queued)
export const normalizeBudgetWorkspace = value => validWorkspace(value) ? value : validV4Workspace(value) ? { ...value, version: BUDGET_WORKSPACE_VERSION, scheduledDates: {} } : validV3Workspace(value) ? normalizeBudgetWorkspace({ ...value, version: 4,
  drafts: value.drafts.map(draft => ({ ...draft, textFinance: draft.textFinance ?? budgetFinancialReference(draft.profile) })) }) :
  validLegacyWorkspace(value) ? normalizeBudgetWorkspace({ ...value, version: 3, publicationDates: Object.fromEntries(value.published.map(id => [id, null])) }) : null

let expectedRaw
export function readBudgetWorkspace() {
  let raw = null
  try {
    raw = localStorage.getItem(WORKSPACE_KEY)
    if (raw !== null) {
      const value = normalizeBudgetWorkspace(JSON.parse(raw))
      return { value: value || emptyBudgetWorkspace(), readable: !!value, raw }
    }
    raw = `legacy:${JSON.stringify([DRAFT_KEY, USAGE_KEY, PUBLISHED_KEY].map(key => localStorage.getItem(key)))}`
    const value = emptyBudgetWorkspace()
    for (const [key, field, validate] of [[DRAFT_KEY, 'draft', validDraft], [USAGE_KEY, 'used', validUsage], [PUBLISHED_KEY, 'published', validUsage]]) {
      const old = localStorage.getItem(key)
      if (old === null || old === 'null') continue
      const parsed = JSON.parse(old)
      if (!validate(parsed)) return { value, readable: false, raw }
      if (field === 'draft') { value.drafts = [parsed]; value.activeId = parsed.profile.id } else value[field] = parsed
    }
    value.publicationDates = Object.fromEntries(value.published.map(id => [id, null]))
    return { value, readable: true, raw }
  } catch { return { value: emptyBudgetWorkspace(), readable: false, raw } }
}
// Observe status updates without authorizing a stale editor to overwrite other tabs.
export const peekWorkspace = () => readBudgetWorkspace()
export function loadWorkspace() {
  const result = readBudgetWorkspace(); expectedRaw = result.raw; return result
}
function commit(value) {
  try {
    const current = readBudgetWorkspace()
    if (!current.readable || current.raw !== expectedRaw || !validWorkspace(value)) return false
    const raw = JSON.stringify(value)
    localStorage.setItem(WORKSPACE_KEY, raw); expectedRaw = raw
    return true
  } catch { return false }
}
export function loadDraft(fallback) {
  const result = loadWorkspace()
  return { ...result, value: result.value.drafts.find(d => d.profile.id === result.value.activeId) || fallback }
}
export function loadSavedDrafts() { return readBudgetWorkspace().value.drafts }
export function saveDraft(record) {
  if (!validDraft(record)) return false
  const current = readBudgetWorkspace().value
  return commit({ ...current, activeId: record.profile.id, drafts: [...current.drafts.filter(d => d.profile.id !== record.profile.id), record] })
}
export function findSavedDraft(id) { return readBudgetWorkspace().value.drafts.find(d => d.profile.id === id) }
const loadFlag = key => { const r = loadWorkspace(); return { ...r, value: r.value[key] } }
const saveFlag = (key, ids) => validUsage(ids) && commit({ ...readBudgetWorkspace().value, [key]: ids })
export const loadUsage = () => loadFlag('used')
export const saveUsage = ids => saveFlag('used', ids)
export const loadPublished = () => { const r = loadFlag('published'); return { ...r, dates: readBudgetWorkspace().value.publicationDates } }
export const savePublished = (ids, dates = readBudgetWorkspace().value.publicationDates) => validUsage(ids) && commit({ ...readBudgetWorkspace().value, published: ids, publicationDates: Object.fromEntries(ids.map(id => [id, Object.hasOwn(dates, id) ? dates[id] : null])) })
export const loadQueued = () => { const r = loadFlag('queued'); return { ...r, dates: readBudgetWorkspace().value.scheduledDates } }
export const saveQueued = (ids, dates = readBudgetWorkspace().value.scheduledDates) => validUsage(ids) && commit({ ...readBudgetWorkspace().value, queued: ids,
  scheduledDates: Object.fromEntries(ids.filter(id => Object.hasOwn(dates, id)).map(id => [id, dates[id]])) })

export const budgetStorageSnapshot = () => readBudgetWorkspace().raw
export const budgetExpectedSnapshot = () => expectedRaw
export function commitBudgetRestoration(value, snapshot) {
  if (snapshot !== expectedRaw || snapshot !== readBudgetWorkspace().raw || !validWorkspace(value)) return false
  const raw = JSON.stringify(value); localStorage.setItem(WORKSPACE_KEY, raw); expectedRaw = raw
  return true
}
