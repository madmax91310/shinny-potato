import parseTweet from 'twitter-text/dist/parseTweet.js'
import { THEMES, TEMPLATES } from './taxonomy.js'
export const normalizeSearch = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr')
export const emptyFilters = () => ({ theme: '', subject: '', mechanic: '', search: '', newOnly: false, debateOnly: false, publicOnly: false, unusedOnly: false, personalOnly: false, draftsOnly: false, archivedOnly: false })
export function tweetStatus(text) {
  const parsed = parseTweet(text)
  const prefix = /^Hey @grok(?=[\s,.:;!?—–-]|$)/u.test(text)
  const content = text.replace(/^Hey @grok[\s,.:;!?—–-]*/u, '').trim()
  return { length: parsed.weightedLength, over: Math.max(0, parsed.weightedLength - 280), canCopy: parsed.valid && prefix && Boolean(content), prefix }
}
export const toggleId = (ids, id) => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]
export function filterQuestions(questions, filters, preferences, view = 'explorer') {
  const search = normalizeSearch(filters.search.trim())
  return questions.filter(q => {
    const favorite = preferences.favorites.includes(q.id)
    const used = preferences.used.includes(q.id)
    const historic = preferences.history?.[q.id]
    if (view === 'favoris' && !favorite || view === 'historique' && !used) return false
    if (view === 'explorer' && (q.deleted || (filters.archivedOnly ? !q.archived : q.archived && !filters.draftsOnly))) return false
    if (filters.personalOnly && q.sourceKind !== 'personal' || filters.draftsOnly && !Object.hasOwn(preferences.drafts, q.id)) return false
    const text = view === 'historique' && historic ? historic.text : q.text
    const theme = view === 'historique' && historic ? historic.theme : q.theme
    const themeName = THEMES.find(t => t.id === theme)?.label ?? ''
    return (!filters.theme || theme === filters.theme) && (!filters.subject || q.subject === filters.subject) &&
      (!filters.mechanic || q.mechanic === filters.mechanic) && (!filters.newOnly || q.collection === 'new-selection') &&
      (!filters.debateOnly || q.debate) && (!filters.publicOnly || q.public) && (!filters.unusedOnly || !used) &&
      (!search || normalizeSearch([text, themeName, ...(q.tags ?? []).map(id => THEMES.find(t => t.id === id)?.label ?? id)].join(' ')).includes(search))
  })
}
// A renewal draws only unseen IDs. Unused questions come first, including at the end
// of a cycle; no implicit restart and no relaxation of the caller's filters.
export function drawBatch(questions, seen, used = [], count = 6, random = null) {
  const available = questions.filter(q => !seen.includes(q.id))
  const groups = [available.filter(q => !used.includes(q.id)), available.filter(q => used.includes(q.id))]
  const result = []
  for (const group of groups) while (group.length && result.length < count) {
    const index = random ? Math.floor(random() * group.length) : 0
    result.push(group.splice(index, 1)[0])
  }
  return result
}
export function templateDefaults(id) { return Object.fromEntries((TEMPLATES.find(t => t.id === id)?.fields ?? []).map(field => [field.key, field.value])) }
export function renderTemplate(id, params) {
  const p = key => params[key]?.trim() || `[${key}]`
  if (id === 'retraite') return `Hey @grok, peut-on arrêter de travailler avec ${p('montant')} à ${p('age')} ? Quel niveau de vie cela permettrait-il et quels risques pourraient faire échouer ce projet ?`
  if (id === 'objectif') return `Hey @grok, combien investir par mois pour atteindre ${p('objectif')} en ${p('duree')} ? Compare trois hypothèses, inflation comprise.`
  if (id === 'revenu') return `Hey @grok, avec ${p('revenu')} par mois, peut-on ${p('projet')} sans mettre ses finances en difficulté ? Compare des situations concrètes.`
  if (id === 'duel') return `Hey @grok, vaut-il mieux ${p('optionA')} ou ${p('optionB')} ? Quelles conditions feraient basculer le choix ?`
  return 'Hey @grok\n\n'
}
export function newEditor(question = null, draft = undefined) {
  return { sourceId: question?.id ?? null, sourceKind: question?.sourceKind ?? 'personal', text: draft ?? question?.text ?? renderTemplate('libre', {}), theme: question?.theme ?? 'patrimoine', template: 'libre', params: {}, customized: Boolean(question || draft), paramsPending: false, paramsDirty: false }
}

// Personal questions have an independent filter context. Switching back restores
// the bank's exact filters rather than silently erasing an active collection/search.
export function switchPersonalWorkspace(workspace) {
  const personal = !workspace.filters.personalOnly
  const saved = personal ? workspace.personalFilters : workspace.bankFilters
  return { ...workspace, [personal ? 'bankFilters' : 'personalFilters']: workspace.filters,
    view: 'explorer', filters: { ...emptyFilters(), ...(saved ?? {}), personalOnly: personal } }
}
