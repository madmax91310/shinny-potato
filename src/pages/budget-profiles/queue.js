import { validPublicationDate } from './publication.js'
import { analyzeBudget, compareBudgetRecency } from './lib.js'
const signature = p => {
  const income = analyzeBudget(p).income
  return [p.country || 'unknown', p.currency || 'EUR', p.family || 'unknown', p.children || 'unknown', p.housing || 'unknown', `${p.currency || 'EUR'}:${income < 1500 ? 'low' : income < 3000 ? 'middle' : 'higher'}`]
}
// Deterministic diversity within each currency; these buckets never convert CHF.
export function suggestBudgetPublications(profiles, { published = [], queued = [], used = [], limit = 12 } = {}) {
  const available = profiles.filter(p => !published.includes(p.id) && !queued.includes(p.id)).sort(compareBudgetRecency)
  const selected = [], frequencies = Array.from({ length: 6 }, () => new Map())
  while (selected.length < limit && available.length) {
    const cost = p => signature(p).reduce((sum, value, i) => sum + (frequencies[i].get(value) || 0), 0) + (used.includes(p.id) ? 1 : 0)
    let best = 0
    for (let i = 1; i < available.length; i++) if (cost(available[i]) < cost(available[best])) best = i
    const [p] = available.splice(best, 1); selected.push(p)
    signature(p).forEach((value, i) => frequencies[i].set(value, (frequencies[i].get(value) || 0) + 1))
  }
  return selected
}
export function moveQueuedProfile(ids, id, direction) {
  const next = [...ids], index = next.indexOf(id), target = index + direction
  if (index < 0 || ![-1, 1].includes(direction) || target < 0 || target >= next.length) return next
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}
export function plannedBudgetDate(dates, id, date) {
  const rest = Object.fromEntries(Object.entries(dates).filter(([key]) => key !== id))
  return date ? { ...rest, [id]: date } : rest
}
export const scheduledLabel = date => validPublicationDate(date) ? `Prévu le ${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}` : 'Date prévue non renseignée'
