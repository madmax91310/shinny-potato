import { localToday, validPublicationDate } from '../../lib/publication-date.js'
// Keep the historical key: v2 stores manual publication dates; legacy dates stay unknown.
export const USED_KEY = 'el-dca-used-v1'
const validDate = value => value === null || validPublicationDate(value) || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value)
const validId = id => typeof id === 'string' && id.length < 100
const unreadable = 'L’historique des publications ne peut pas être lu. Il est conservé sur cet appareil ; recharge la page avant de réessayer.'

export function readUsageHistory(storage) {
  try {
    const raw = (storage ?? globalThis.localStorage).getItem(USED_KEY)
    const value = raw === null ? [] : JSON.parse(raw)
    const legacy = Array.isArray(value)
    const entries = legacy ? value.filter(validId).map(id=>({id,publishedAt:null})) : Array.isArray(value?.entries) ? value.entries.filter(entry=>entry && validId(entry.id) && validDate(entry.publishedAt)) : []
    const readable = legacy ? value.every(validId) : [2,3].includes(value?.version) && (value.version!==3 || Array.isArray(value.history)) && Array.isArray(value.entries) && entries.length === value.entries.length
    // Recognized entries may inform display, but never authorize a partial rewrite.
    const ids = entries.map(entry=>entry.id)
    return { ids, entries, history: legacy ? [] : value?.history ?? [], raw, readable, error: readable ? '' : unreadable }
  } catch {
    return { ids: [], entries: [], raw: null, readable: false, error: unreadable }
  }
}

export function saveUsageHistory(previous, id, published, date, storage) {
  if (!previous.readable) return previous
  try {
    const target = storage ?? globalThis.localStorage
    const current = readUsageHistory(target)
    if (!current.readable) return { ...previous, error: current.error }
    // Same observed-snapshot protection as the bank (#974), with this list's contract.
    if (current.raw !== previous.raw) return { ...previous, error: 'L’historique a changé dans un autre onglet. Recharge la page avant de réessayer ; la version enregistrée est conservée.' }
    if (!validId(id)) return { ...previous, error: 'Ce marquage ne peut pas être enregistré dans l’historique.' }
    if (published && !validPublicationDate(date)) return {...previous,error:'Choisis une date de publication valide.'}
    const entries = [...previous.entries.filter(entry=>entry.id!==id), ...(published?[{id,publishedAt:date}]:[])]
    const history = [...(previous.history??[]), {id, action:published?(previous.ids.includes(id)?'date-corrected':'published'):'unpublished', previous:previous.entries.filter(entry=>entry.id===id), date:published?date:null, recordedAt:new Date().toISOString()}]
    const ids = entries.map(entry=>entry.id)
    const raw = JSON.stringify({version:3,entries,history})
    target.setItem(USED_KEY, raw)
    return { ids, entries, history, raw, readable: true, error: '' }
  } catch {
    return { ...previous, error: 'L’historique des publications ne peut pas être enregistré sur cet appareil. La version enregistrée est conservée ; tu peux réessayer.' }
  }
}

export function toggleUsageHistory(previous,id,storage){return saveUsageHistory(previous,id,!previous.ids.includes(id),localToday(),storage)}
export function usageDate(entry){
 const date=entry?.publishedAt
 if(!date)return null
 if(validPublicationDate(date))return date
 return localToday(new Date(date))
}
