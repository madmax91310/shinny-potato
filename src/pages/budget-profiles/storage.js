import { validBudget } from './lib.js'

export const DRAFT_KEY = 'el-budget-draft-v1'
export const USAGE_KEY = 'el-budget-usage-v1'
export const PUBLISHED_KEY = 'el-budget-published-v1'
export const WORKSPACE_KEY = 'el-budget-workspace-v2'
export const validDraft = item => !!item && validBudget(item.profile) && typeof item.text === 'string' && item.text.length <= 20000 && typeof item.edited === 'boolean'
export const validUsage = ids => Array.isArray(ids) && ids.length <= 5000 && new Set(ids).size === ids.length && ids.every(id => typeof id === 'string' && id.length > 0 && id.length <= 100)
const empty = () => ({ version: 2, drafts: [], activeId: null, used: [], published: [], queued: [] })
export const validWorkspace = value => !!value && value.version === 2 && Array.isArray(value.drafts) && value.drafts.length <= 500 && value.drafts.every(validDraft) && new Set(value.drafts.map(d => d.profile.id)).size === value.drafts.length && (value.activeId === null || typeof value.activeId === 'string' && value.activeId.length <= 100) && ['used', 'published', 'queued'].every(key => validUsage(value[key]))
let expectedRaw
function read() {
  let raw = null
  try {
    raw = localStorage.getItem(WORKSPACE_KEY)
    if (raw !== null) {
      const value = JSON.parse(raw)
      return { value: validWorkspace(value) ? value : empty(), readable: validWorkspace(value), raw }
    }
    raw = `legacy:${JSON.stringify([DRAFT_KEY, USAGE_KEY, PUBLISHED_KEY].map(key => localStorage.getItem(key)))}`
    const value = empty()
    for (const [key, field, validate] of [[DRAFT_KEY, 'draft', validDraft], [USAGE_KEY, 'used', validUsage], [PUBLISHED_KEY, 'published', validUsage]]) {
      const old = localStorage.getItem(key)
      if (old === null || old === 'null') continue
      const parsed = JSON.parse(old)
      if (!validate(parsed)) return { value, readable: false, raw }
      if (field === 'draft') { value.drafts = [parsed]; value.activeId = parsed.profile.id } else value[field] = parsed
    }
    return { value, readable: true, raw }
  } catch { return { value: empty(), readable: false, raw } }
}
export function loadWorkspace() {
  const result = read(); expectedRaw = result.raw; return result
}
function commit(value) {
  try {
    const current = read()
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
export function loadSavedDrafts() { return read().value.drafts }
export function saveDraft(record) {
  if (!validDraft(record)) return false
  const current = read().value
  return commit({ ...current, activeId: record.profile.id, drafts: [...current.drafts.filter(d => d.profile.id !== record.profile.id), record] })
}
export function findSavedDraft(id) { return read().value.drafts.find(d => d.profile.id === id) }
const loadFlag = key => { const r = loadWorkspace(); return { ...r, value: r.value[key] } }
const saveFlag = (key, ids) => validUsage(ids) && commit({ ...read().value, [key]: ids })
export const loadUsage = () => loadFlag('used')
export const saveUsage = ids => saveFlag('used', ids)
export const loadPublished = () => loadFlag('published')
export const savePublished = ids => saveFlag('published', ids)
export const loadQueued = () => loadFlag('queued')
export const saveQueued = ids => saveFlag('queued', ids)

export function exportBudgetBackup() {
  const r = read(), recovery = {}
  // Preserve unreadable bytes and pre-import snapshots for manual recovery too.
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if ([DRAFT_KEY, USAGE_KEY, PUBLISHED_KEY, WORKSPACE_KEY].includes(key) || key?.startsWith('el-budget-recovery-')) recovery[key] = localStorage.getItem(key)
  }
  return { format: 'le-budget-de', version: 2, exportedAt: new Date().toISOString(), workspace: r.value, recovery, readable: r.readable }
}
export function parseBudgetBackup(raw) {
  if (typeof raw !== 'string' || raw.length > 10000000) throw new Error('Fichier trop volumineux (10 Mo maximum).')
  let value
  try { value = JSON.parse(raw) } catch { throw new Error('Le fichier ne contient pas un JSON lisible.') }
  // Historical single drafts are accepted without changing their personal text.
  if (validDraft(value)) return { ...empty(), drafts: [value], activeId: value.profile.id }
  if (value?.format !== 'le-budget-de' || value.version !== 2 || value.readable !== true || !validWorkspace(value.workspace)) throw new Error('Format, version ou données de sauvegarde invalides. Les données locales sont conservées.')
  return value.workspace
}
const idsIn = w => new Set([...w.drafts.map(d => d.profile.id), ...w.used, ...w.published, ...w.queued])
const entry = (w, id) => JSON.stringify([w.drafts.find(d => d.profile.id === id) || null, ...['used', 'published', 'queued'].map(key => w[key].includes(id))])
const withDrafts = (workspace, drafts = []) => ({ ...workspace, drafts: [...new Map([...workspace.drafts, ...drafts.filter(validDraft)].map(d => [d.profile.id, d])).values()] })
export function previewBudgetImport(incoming, drafts = []) {
  const local = read(); local.value = withDrafts(local.value, drafts)
  const localIds = idsIn(local.value)
  const ids = [...idsIn(incoming)]
  return { readable: local.readable, drafts: incoming.drafts.length, custom: incoming.drafts.filter(d => d.edited).length,
    conflicts: ids.filter(id => localIds.has(id) && entry(local.value, id) !== entry(incoming, id)),
    additions: ids.filter(id => !localIds.has(id)), ids }
}
export function restoreBudgetBackup(incoming, strategy, expectedSnapshot, drafts = []) {
  if (!validWorkspace(incoming) || !['keep-local', 'use-imported'].includes(strategy)) return false
  const r = read()
  if (r.raw !== expectedSnapshot || r.raw !== expectedRaw) return false
  try {
    // Explicit import archives even corrupt records before any replacement.
    const recovery = Object.fromEntries([DRAFT_KEY, USAGE_KEY, PUBLISHED_KEY, WORKSPACE_KEY].map(key => [key, localStorage.getItem(key)]))
    const local = withDrafts(r.value, drafts)
    recovery.memoryDrafts = drafts.filter(validDraft)
    localStorage.setItem(`el-budget-recovery-${Date.now()}-${crypto.randomUUID()}`, JSON.stringify(recovery))
    const localIds = idsIn(local), incomingIds = idsIn(incoming)
    const take = new Set([...incomingIds].filter(id => strategy === 'use-imported' || !localIds.has(id)))
    const value = { version: 2,
      drafts: [...local.drafts.filter(d => !take.has(d.profile.id)), ...incoming.drafts.filter(d => take.has(d.profile.id))],
      activeId: local.activeId || incoming.activeId,
      ...Object.fromEntries(['used', 'published', 'queued'].map(key => [key, [...new Set([...local[key].filter(id => !take.has(id)), ...incoming[key].filter(id => take.has(id))])]])) }
    if (!validWorkspace(value)) return false
    // Corrupt bytes have been archived above. Only this explicit restoration
    // can replace them; ordinary draft/status writes always remain blocked.
    const raw = JSON.stringify(value); localStorage.setItem(WORKSPACE_KEY, raw); expectedRaw = raw
    return true
  } catch { return false }
}
export const budgetStorageSnapshot = () => read().raw

export function listBudgetRecoveries() {
  const versions = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('el-budget-recovery-')) continue
      const raw = JSON.parse(localStorage.getItem(key))
      let workspace = null
      try {
        const candidate = JSON.parse(raw[WORKSPACE_KEY])
        if (validWorkspace(candidate)) workspace = candidate
      } catch { /* Corrupt bytes remain downloadable in the recovery export. */ }
      if (!workspace) {
        try {
          const draft = JSON.parse(raw[DRAFT_KEY])
          if (validDraft(draft)) workspace = { ...empty(), drafts: [draft], activeId: draft.profile.id,
            ...Object.fromEntries([[USAGE_KEY, 'used'], [PUBLISHED_KEY, 'published']].map(([old, flag]) => {
              const ids = JSON.parse(raw[old] || '[]'); return [flag, validUsage(ids) ? ids : []]
            })) }
        } catch { /* The unmodified snapshot is still retained. */ }
      }
      if (!workspace && Array.isArray(raw.memoryDrafts) && raw.memoryDrafts.some(validDraft)) workspace = empty()
      if (workspace) workspace = withDrafts(workspace, Array.isArray(raw.memoryDrafts) ? raw.memoryDrafts : [])
      if (workspace) versions.push({ key, workspace, createdAt: Number(key.split('-')[3]) })
    }
  } catch { return versions }
  return versions.sort((a, b) => b.createdAt - a.createdAt)
}
