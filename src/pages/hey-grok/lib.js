import parseTweet from 'twitter-text/dist/parseTweet.js'

export const STORAGE_KEY = 'el-hey-grok-v1'
export const emptyFilters = () => ({ subject: '', mechanic: '', search: '', publicOnly: false, debateOnly: false, unusedOnly: false, favoritesOnly: false })
export const emptyPreferences = () => ({ favorites: [], used: [], drafts: {} })
export const normalizeSearch = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr')

export function tweetStatus(text) {
  const parsed = parseTweet(text)
  const prefix = text.startsWith('Hey @grok,')
  return { length: parsed.weightedLength, over: Math.max(0, parsed.weightedLength - 280),
    canCopy: parsed.valid && prefix && text.slice('Hey @grok,'.length).trim().length > 0, prefix }
}

export function filterQuestions(questions, filters, preferences) {
  const search = normalizeSearch(filters.search.trim())
  return questions.filter(question =>
    (!filters.subject || question.subject === filters.subject) &&
    (!filters.mechanic || question.mechanic === filters.mechanic) &&
    (!filters.debateOnly || question.debate) &&
    (!filters.publicOnly || question.public) &&
    (!filters.unusedOnly || !preferences.used.includes(question.id)) &&
    (!filters.favoritesOnly || preferences.favorites.includes(question.id)) &&
    (!search || normalizeSearch(question.text).includes(search)))
}

// The session remembers all visited questions, even when filters change. A cycle
// restarts only on explicit request after exhaustion; random never silently repeats.
export function drawQuestion(questions, seen, random = Math.random) {
  const remaining = questions.filter(question => !seen.includes(question.id))
  return remaining.length ? remaining[Math.floor(random() * remaining.length)] : null
}

export function toggleId(ids, id) {
  return ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]
}

export function readPreferences(storage) {
  try {
    const raw = (storage ?? window.localStorage).getItem(STORAGE_KEY)
    if (raw === null) return { value: emptyPreferences(), error: '' }
    const parsed = JSON.parse(raw)
    if (!parsed || !['favorites', 'used'].every(key => Array.isArray(parsed[key]) && parsed[key].every(id => typeof id === 'string')) ||
      !parsed.drafts || typeof parsed.drafts !== 'object' || Array.isArray(parsed.drafts) ||
      !Object.values(parsed.drafts).every(value => typeof value === 'string')) throw new Error('format')
    return { value: parsed, error: '' }
  } catch {
    // Keep unreadable data intact. No effect writes to storage on initial mount.
    return { value: emptyPreferences(), error: 'Les données locales ne peuvent pas être lues. Elles sont conservées ; les changements de cette session ne seront pas enregistrés.' }
  }
}

export function savePreferences(storage, value) {
  try { (storage ?? window.localStorage).setItem(STORAGE_KEY, JSON.stringify(value)); return true } catch { return false }
}
