import { QUESTIONS, SUBJECTS, MECHANICS } from './data.js'
import { NEW_SELECTION, SELECTION_EDITS } from './selection.js'
import { THEMES, SUBJECT_THEME, THEME_OVERRIDES, ARCHIVE_REASONS } from './taxonomy.js'
export { THEMES, SUBJECTS }
export const ALL_MECHANICS = [...MECHANICS, { id: 'scenario', label: 'Situation chiffrée' }, { id: 'invest-hypothesis', label: 'Hypothèse d’investissement' }]
const selected = new Map(NEW_SELECTION.map(q => [q.id, q]))
const oldIds = new Set(QUESTIONS.map(q => q.id))
function selectionRecord(q) {
  return { ...q, text: SELECTION_EDITS[q.reference] ?? q.text, collection: 'new-selection', sourceKind: 'bank', archived: false }
}
const legacy = QUESTIONS.map(question => {
  const record = { ...question, theme: THEME_OVERRIDES[question.id] ?? SUBJECT_THEME[question.subject], sourceKind: 'bank', archived: Boolean(ARCHIVE_REASONS[question.id]), archiveReason: ARCHIVE_REASONS[question.id] }
  const replacement = selected.get(question.id)
  return replacement ? { ...record, ...selectionRecord(replacement), previousText: question.text } : record
})
// La collection validée arrive en premier ; les anciens textes gardent leur ordre et leur identité.
export const BANK = [
  ...NEW_SELECTION.map(q => oldIds.has(q.id) ? legacy.find(old => old.id === q.id) : selectionRecord(q)),
  ...legacy.filter(q => !selected.has(q.id)),
]
export const BANK_BY_ID = new Map(BANK.map(q => [q.id, q]))
export const themeLabel = id => THEMES.find(theme => theme.id === id)?.label ?? 'Question personnelle'
