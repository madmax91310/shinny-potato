import assert from 'node:assert/strict'
import { parisToday, validPublicationDate, publicationLabel } from '../src/pages/budget-profiles/publication.js'
import { budgetFinancialReference, staleBudgetText } from '../src/pages/budget-profiles/completion.js'
import { BUDGET_PROFILES, BUDGET_ORIGINAL_PROFILES } from '../src/pages/budget-profiles/data.js'
import { analyzeBudget, budgetImageExpenses, matchesBudgetFilters, compareBudgetRecency, refreshBudgetDraft, buildBudgetText, budgetHeading } from '../src/pages/budget-profiles/lib.js'
import { DRAFT_KEY, USAGE_KEY, PUBLISHED_KEY, WORKSPACE_KEY, loadWorkspace, loadDraft, saveDraft, findSavedDraft, loadPublished, savePublished, saveUsage, saveQueued, exportBudgetBackup, parseBudgetBackup, previewBudgetImport, restoreBudgetBackup, budgetStorageSnapshot, listBudgetRecoveries } from '../src/pages/budget-profiles/storage.js'
const memory = new Map(), previous = globalThis.localStorage
const storage = { get length() { return memory.size }, key: i => [...memory.keys()][i], getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }
globalThis.localStorage = storage
try {
  assert.equal(parisToday(new Date('2026-07-01T22:30:00Z')), '2026-07-02')
  assert.equal(parisToday(new Date('2026-01-01T22:30:00Z')), '2026-01-01')
  assert.equal(parisToday(new Date('2026-01-01T23:30:00Z')), '2026-01-02')
  assert(validPublicationDate('2024-02-29')); assert(!validPublicationDate('2026-02-29')); assert(!validPublicationDate('2026-13-01'))
  assert.equal(publicationLabel(null), 'Publié — date non renseignée')
  const p = BUDGET_PROFILES[0], q = BUDGET_PROFILES[1], custom = { profile: p, text: 'Mes paragraphes\n\nà conserver € CHF', edited: true }
  memory.set(DRAFT_KEY, JSON.stringify(custom)); memory.set(USAGE_KEY, JSON.stringify([p.id])); memory.set(PUBLISHED_KEY, JSON.stringify([p.id]))
  assert.equal(loadPublished().dates[p.id], null)
  assert.deepEqual(loadPublished().value, [p.id])
  assert.deepEqual(loadDraft(null).value, custom)
  assert(saveDraft(custom)); assert(savePublished([p.id])); assert(saveQueued([q.id])); assert(saveUsage([q.id]))
  assert(saveDraft({ profile: q, text: buildBudgetText(q), edited: false }))
  assert.equal(findSavedDraft(p.id).text, custom.text, 'Switching profiles preserves a personal draft')
  assert(savePublished([p.id], { [p.id]: '2026-10-14' }))
  const backup = exportBudgetBackup(), incoming = parseBudgetBackup(JSON.stringify(backup))
  assert.equal(incoming.publicationDates[p.id], '2026-10-14'); assert.equal(backup.version, 4)
  // A dated v3 snapshot migrates on read without changing bytes or inventing dates.
  const source=BUDGET_ORIGINAL_PROFILES[0], oldText='Mon budget avant compléments : 307 € restants.'
  const datedV3={...backup,version:3,workspace:{...backup.workspace,version:3,drafts:[{profile:source,text:oldText,edited:true}],activeId:source.id}}
  const migrated=parseBudgetBackup(JSON.stringify(datedV3));assert.equal(migrated.version,4)
  assert.equal(migrated.drafts[0].textFinance,budgetFinancialReference(source));assert.equal(migrated.publicationDates[p.id],'2026-10-14')
  assert(staleBudgetText(refreshBudgetDraft(migrated.drafts[0])));assert.equal(refreshBudgetDraft(migrated.drafts[0]).text,oldText)
  const bytesBefore=memory.get(WORKSPACE_KEY);parseBudgetBackup(JSON.stringify(datedV3));assert.equal(memory.get(WORKSPACE_KEY),bytesBefore,'Import preview cannot write a migration')
  const invalidRef={...backup,workspace:{...backup.workspace,drafts:[{...custom,textFinance:3}]}};assert.throws(()=>parseBudgetBackup(JSON.stringify(invalidRef)))
  const oldBackup = { ...backup, version: 2, workspace: { ...backup.workspace, version: 2 } }; delete oldBackup.workspace.publicationDates
  assert.equal(parseBudgetBackup(JSON.stringify(oldBackup)).publicationDates[p.id], null)
  assert.equal(parseBudgetBackup(JSON.stringify(oldBackup)).drafts[0].text, custom.text)
  for (const dates of [{}, { [p.id]: '2026-02-30' }, { [p.id]: 1 }, { [p.id]: '2026-10-14', extra: null }]) assert.throws(() => parseBudgetBackup(JSON.stringify({ ...backup, workspace: { ...incoming, publicationDates: dates } })))
  const dateConflict = structuredClone(incoming); dateConflict.publicationDates[p.id] = '2026-10-13'
  assert(previewBudgetImport(dateConflict).conflicts.includes(p.id), 'A date-only change is a conflict')
  let dateSnapshot = budgetStorageSnapshot(); assert(restoreBudgetBackup(dateConflict, 'keep-local', dateSnapshot)); assert.equal(loadPublished().dates[p.id], '2026-10-14')
  dateSnapshot = budgetStorageSnapshot(); assert(restoreBudgetBackup(dateConflict, 'use-imported', dateSnapshot)); assert.equal(loadPublished().dates[p.id], '2026-10-13')
  assert(savePublished([p.id], { [p.id]: '2026-10-14' }))
  assert.equal(incoming.drafts.length, 2); assert.equal(incoming.queued[0], q.id); assert.equal(incoming.published[0], p.id)
  assert.equal(refreshBudgetDraft(incoming.drafts.find(d => d.edited)).text, custom.text)
  const legacy = parseBudgetBackup(JSON.stringify(custom)); assert.equal(legacy.drafts[0].text, custom.text)
  for (const bad of ['{bad', '{}', JSON.stringify({ ...backup, version: 999 }), JSON.stringify({ ...backup, workspace: { ...incoming, used: [3] } }), JSON.stringify({ ...backup, workspace: { ...incoming, drafts: [custom, custom] } }), JSON.stringify({ ...backup, readable: false }), JSON.stringify({ ...backup, workspace: { ...incoming, drafts: [{ ...custom, profile: { ...p, preparedAt: 'bad-date' } }] } })]) assert.throws(() => parseBudgetBackup(bad))
  incoming.drafts[0].text = 'Autre appareil'; incoming.published = []; incoming.publicationDates = {}; incoming.queued = [p.id]
  let preview = previewBudgetImport(incoming); assert(preview.conflicts.includes(p.id))
  let snapshot = budgetStorageSnapshot()
  assert(restoreBudgetBackup(incoming, 'keep-local', snapshot)); assert.equal(findSavedDraft(p.id).text, custom.text); assert.deepEqual(loadPublished().value, [p.id])
  snapshot = budgetStorageSnapshot()
  assert(restoreBudgetBackup(incoming, 'use-imported', snapshot)); assert.equal(findSavedDraft(p.id).text, 'Autre appareil'); assert.deepEqual(loadPublished().value, [])
  assert(listBudgetRecoveries().some(v => v.workspace.drafts.some(d => d.text === custom.text)), 'Replaced personal drafts remain restorable from the UI'); assert(exportBudgetBackup().recovery[WORKSPACE_KEY]); assert([...memory.keys()].some(key => key.startsWith('el-budget-recovery-')))
  const personalBeforeFlagsOnly = findSavedDraft(p.id).text
  snapshot = budgetStorageSnapshot(); assert(restoreBudgetBackup({ ...incoming, drafts: [], activeId: null, used: [p.id], published: [], queued: [] }, 'use-imported', snapshot))
  assert.equal(findSavedDraft(p.id).text, personalBeforeFlagsOnly, 'An import containing only statuses must never delete a local draft')
  snapshot = budgetStorageSnapshot(); const before = JSON.parse(memory.get(WORKSPACE_KEY)); before.queued.push('other-tab'); memory.set(WORKSPACE_KEY, JSON.stringify(before))
  assert.equal(saveDraft(custom), false, 'Concurrent tab never silently overwritten'); assert.equal(savePublished([p.id], { [p.id]: '2026-10-15' }), false, 'A stale tab cannot replace a publication date'); assert.equal(restoreBudgetBackup(incoming, 'use-imported', snapshot), false)
  loadWorkspace(); assert(saveDraft(custom))
  memory.set(WORKSPACE_KEY, '{broken'); loadWorkspace(); assert.equal(saveDraft(custom), false); assert.equal(savePublished([]), false)
  assert.equal(memory.get(WORKSPACE_KEY), '{broken'); assert.equal(exportBudgetBackup().recovery[WORKSPACE_KEY], '{broken')
  assert.equal(exportBudgetBackup().readable, false)
  snapshot = budgetStorageSnapshot(); assert(restoreBudgetBackup(incoming, 'use-imported', snapshot)); assert([...memory.values()].some(raw => raw.includes('"{broken"')))
  memory.clear(); memory.set(DRAFT_KEY, '{old-broken'); loadWorkspace(); assert.equal(saveDraft(custom), false); assert.equal(memory.get(DRAFT_KEY), '{old-broken')
  snapshot = budgetStorageSnapshot(); assert(restoreBudgetBackup(incoming, 'use-imported', snapshot)); assert.equal(memory.get(DRAFT_KEY), '{old-broken')
  loadWorkspace(); const realSet = storage.setItem; storage.setItem = () => { throw new Error('quota') }
  assert.equal(saveDraft(custom), false); assert.equal(restoreBudgetBackup(incoming, 'use-imported', budgetStorageSnapshot()), false); storage.setItem = realSet
} finally { globalThis.localStorage = previous }
for (const profile of BUDGET_PROFILES) {
  const a = analyzeBudget(profile), summary = budgetImageExpenses(profile, 'summary')
  assert.equal(summary.reduce((n, r) => n + Math.round(r.amount * 100), 0), Math.round(a.expenses * 100), profile.id)
  assert(summary.length <= profile.expenses.length)
  assert.equal(matchesBudgetFilters(profile, { country: profile.country || 'unknown', family: profile.family || 'unknown', children: profile.children || 'unknown', housing: profile.housing || 'unknown', income: `${profile.currency || 'EUR'}:0:Infinity` }), true)
  assert.equal(matchesBudgetFilters(profile, { income: `${profile.currency === 'CHF' ? 'EUR' : 'CHF'}:0:Infinity` }), false)
}
assert(compareBudgetRecency({ id:'a',budgetAsOf:'2025-05-01',preparedAt:'2026-11-01' },{id:'b',budgetAsOf:'2026-01-01',preparedAt:'2026-01-01'}) > 0)
assert.match(budgetHeading(BUDGET_PROFILES.find(p => p.name === 'Inès')), /d’Inès/)
assert.equal(analyzeBudget(BUDGET_PROFILES.find(p => p.id === 'reddit-famille-bourges-2026-07-12')).balance, 291.98)
for (const [id, expenses, savings, balance] of [['personne_seule',2480,20,0],['monoparent_1enfant',3160,80,60],['monoparent_2enfants',3890,100,10]]) {
  const a = analyzeBudget(BUDGET_ORIGINAL_PROFILES.find(p => p.id === `budget-conseil-${id}-2025-2026`))
  assert.deepEqual([a.expenses,a.savings,a.balance],[expenses,savings,balance])
}
console.log('Budget portability: legacy migration, all drafts, three independent statuses, validated backup, both conflict choices, concurrency, corrupt-byte recovery, blocked storage, filters and exact summary totals passed.')
