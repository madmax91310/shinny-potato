import { validBudget } from './lib.js'
import { readLocalPreferenceRecord, writeLocalPreference } from '../../lib/publication-preferences.js'

export const DRAFT_KEY = 'el-budget-draft-v1'
export const USAGE_KEY = 'el-budget-usage-v1'
// A manual publication declaration is separate from the historical "used" flag.
export const PUBLISHED_KEY = 'el-budget-published-v1'
export const validDraft = item => !!item && validBudget(item.profile) && typeof item.text === 'string' && item.text.length <= 20000 && typeof item.edited === 'boolean'
export const validUsage = ids => Array.isArray(ids) && ids.length <= 5000 && ids.every(id => typeof id === 'string' && id.length <= 100)
export function loadDraft(fallback) { return readLocalPreferenceRecord(DRAFT_KEY, fallback, validDraft) }
export function saveDraft(value) { return writeLocalPreference(DRAFT_KEY, value, validDraft) }
export function loadUsage() { return readLocalPreferenceRecord(USAGE_KEY, [], validUsage) }
export function saveUsage(ids) { return writeLocalPreference(USAGE_KEY, ids, validUsage) }
export function loadPublished() { return readLocalPreferenceRecord(PUBLISHED_KEY, [], validUsage) }
export function savePublished(ids) { return writeLocalPreference(PUBLISHED_KEY, ids, validUsage) }
