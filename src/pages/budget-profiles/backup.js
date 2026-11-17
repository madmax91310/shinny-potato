import { DRAFT_KEY, USAGE_KEY, PUBLISHED_KEY, WORKSPACE_KEY, BUDGET_WORKSPACE_VERSION, validDraft, validWorkspace, validUsage, readBudgetWorkspace, normalizeBudgetWorkspace, emptyBudgetWorkspace, budgetExpectedSnapshot, commitBudgetRestoration } from './workspace.js'
export function exportBudgetBackup() {
  const r = readBudgetWorkspace(), recovery = {}
  // Preserve unreadable bytes and pre-import snapshots for manual recovery too.
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if ([DRAFT_KEY, USAGE_KEY, PUBLISHED_KEY, WORKSPACE_KEY].includes(key) || key?.startsWith('el-budget-recovery-')) recovery[key] = localStorage.getItem(key)
  }
  return { format: 'le-budget-de', version: BUDGET_WORKSPACE_VERSION, exportedAt: new Date().toISOString(), workspace: r.value, recovery, readable: r.readable }
}
export function parseBudgetBackup(raw) {
  if (typeof raw !== 'string' || raw.length > 10000000) throw new Error('Fichier trop volumineux (10 Mo maximum).')
  let value
  try { value = JSON.parse(raw) } catch { throw new Error('Le fichier ne contient pas un JSON lisible.') }
  // Historical single drafts are accepted without changing their personal text.
  if (validDraft(value)) return { ...emptyBudgetWorkspace(), drafts: [value], activeId: value.profile.id }
  if (value?.format !== 'le-budget-de' || ![2, 3, 4, BUDGET_WORKSPACE_VERSION].includes(value.version) || value.readable !== true || value.workspace?.version !== value.version || !normalizeBudgetWorkspace(value.workspace)) throw new Error('Format, version ou données de sauvegarde invalides. Les données locales sont conservées.')
  return normalizeBudgetWorkspace(value.workspace)
}
const idsIn = w => new Set([...w.drafts.map(d => d.profile.id), ...w.used, ...w.published, ...w.queued])
const entry = (w, id) => JSON.stringify([w.drafts.find(d => d.profile.id === id) || null, ...['used', 'published', 'queued'].map(key => w[key].includes(id)), w.publicationDates[id] ?? null, w.scheduledDates[id] ?? null])
function queueOrderConflicts(local, incoming) {
  const shared = new Set(local.filter(id => incoming.includes(id)))
  const a = local.filter(id => shared.has(id)), b = incoming.filter(id => shared.has(id))
  return a.some((id, index) => id !== b[index]) ? [...shared] : []
}
const withDrafts = (workspace, drafts = []) => ({ ...workspace, drafts: [...new Map([...workspace.drafts, ...drafts.filter(validDraft)].map(d => [d.profile.id, d])).values()] })
export function previewBudgetImport(incoming, drafts = []) {
  const local = readBudgetWorkspace(); local.value = withDrafts(local.value, drafts)
  const localIds = idsIn(local.value)
  const ids = [...idsIn(incoming)]
  return { readable: local.readable, drafts: incoming.drafts.length, custom: incoming.drafts.filter(d => d.edited).length,
    conflicts: [...new Set([...ids.filter(id => localIds.has(id) && entry(local.value, id) !== entry(incoming, id)),
      ...queueOrderConflicts(local.value.queued, incoming.queued)])],
    additions: ids.filter(id => !localIds.has(id)), ids }
}
export function restoreBudgetBackup(incoming, strategy, expectedSnapshot, drafts = []) {
  if (!validWorkspace(incoming) || !['keep-local', 'use-imported'].includes(strategy)) return false
  const r = readBudgetWorkspace()
  if (r.raw !== expectedSnapshot || r.raw !== budgetExpectedSnapshot()) return false
  try {
    // Explicit import archives even corrupt records before any replacement.
    const recovery = Object.fromEntries([DRAFT_KEY, USAGE_KEY, PUBLISHED_KEY, WORKSPACE_KEY].map(key => [key, localStorage.getItem(key)]))
    const local = withDrafts(r.value, drafts)
    recovery.memoryDrafts = drafts.filter(validDraft)
    localStorage.setItem(`el-budget-recovery-${Date.now()}-${crypto.randomUUID()}`, JSON.stringify(recovery))
    const localIds = idsIn(local), incomingIds = idsIn(incoming)
    const take = new Set([...incomingIds].filter(id => strategy === 'use-imported' || !localIds.has(id)))
    const value = { version: BUDGET_WORKSPACE_VERSION,
      publicationDates: Object.fromEntries([...local.published.filter(id => !take.has(id)).map(id => [id, local.publicationDates[id]]), ...incoming.published.filter(id => take.has(id)).map(id => [id, incoming.publicationDates[id]])]),
      scheduledDates: Object.fromEntries([...Object.entries(local.scheduledDates).filter(([id]) => !take.has(id)), ...Object.entries(incoming.scheduledDates).filter(([id]) => take.has(id))]),
      drafts: [...local.drafts.filter(d => !take.has(d.profile.id) || !incoming.drafts.some(imported => imported.profile.id === d.profile.id)), ...incoming.drafts.filter(d => take.has(d.profile.id))],
      activeId: local.activeId || incoming.activeId,
      ...Object.fromEntries(['used', 'published', 'queued'].map(key => [key, [...new Set([...local[key].filter(id => !take.has(id)), ...incoming[key].filter(id => take.has(id))])]])) }
    value.queued = strategy === 'use-imported' ? [...incoming.queued.filter(id => take.has(id)), ...local.queued.filter(id => !take.has(id))] : value.queued
    if (!validWorkspace(value)) return false
    // Corrupt bytes have been archived above. Only this explicit restoration
    // can replace them; ordinary draft/status writes always remain blocked.
    return commitBudgetRestoration(value, r.raw)
  } catch { return false }
}

export function listBudgetRecoveries() {
  const versions = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith('el-budget-recovery-')) continue
      const raw = JSON.parse(localStorage.getItem(key))
      let workspace = null
      try {
        workspace = normalizeBudgetWorkspace(JSON.parse(raw[WORKSPACE_KEY]))
      } catch { /* Corrupt bytes remain downloadable in the recovery export. */ }
      if (!workspace) {
        try {
          const draft = JSON.parse(raw[DRAFT_KEY])
          if (validDraft(draft)) workspace = { ...emptyBudgetWorkspace(), drafts: [draft], activeId: draft.profile.id,
            ...Object.fromEntries([[USAGE_KEY, 'used'], [PUBLISHED_KEY, 'published']].map(([old, flag]) => {
              const ids = JSON.parse(raw[old] || '[]'); return [flag, validUsage(ids) ? ids : []]
            })) }
        } catch { /* The unmodified snapshot is still retained. */ }
      }
      if (!workspace && Array.isArray(raw.memoryDrafts) && raw.memoryDrafts.some(validDraft)) workspace = emptyBudgetWorkspace()
      if (workspace && !validWorkspace(workspace)) workspace.publicationDates = Object.fromEntries(workspace.published.map(id => [id, null]))
      if (workspace) workspace = withDrafts(workspace, Array.isArray(raw.memoryDrafts) ? raw.memoryDrafts : [])
      if (workspace) versions.push({ key, workspace, createdAt: Number(key.split('-')[3]) })
    }
  } catch { return versions }
  return versions.sort((a, b) => b.createdAt - a.createdAt)
}
