import { COLORS } from './palette.js'

// In-memory working copies only. Never attach UI state to the catalog objects.
export function workingColors(ids, previous = {}) {
  const next = Object.fromEntries(ids.filter(id => previous[id]).map(id => [id, previous[id]]))
  for (const id of ids) if (!next[id]) next[id] = COLORS.find(color => !Object.values(next).includes(color))
  return next
}

export function selectionFilename(result, presentation) {
  const slug = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `classement-${presentation}-${result.assets.map(a => slug(a.id)).join('-')}-${result.coverage.currency}-${result.start}-${result.end}.png`
}

export function publicationDraft(generated, snapshot, draft) {
  return { text: draft ? draft.value : generated, stale: Boolean(draft && draft.owner !== snapshot) }
}
