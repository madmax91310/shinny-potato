import { migrateProfile, validSaved } from './management.js'

export const MAX_PORTFOLIO_FILE_BYTES = 1_000_000
const format = 'epargnant-libre-portfolio'
function checked(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw Error('Fichier de portefeuille invalide.')
  const item = {...record, profile: migrateProfile(record.profile)}
  if (!validSaved(item) || typeof item.profile.id !== 'string' || item.profile.id.length > 100 ||
    item.profile.lines.some(line => typeof line.label !== 'string' || line.label.length > 250 ||
      (line.emoji !== undefined && (typeof line.emoji !== 'string' || line.emoji.length > 30))) ||
    ['name','job','family','location','emoji'].some(key=>item.profile[key]!==undefined && (typeof item.profile[key]!=='string' || item.profile[key].length>250)) ||
    ['age','income','monthly'].some(key=>item.profile[key]!==undefined && item.profile[key]!==null && (!Number.isFinite(item.profile[key]) || item.profile[key]<0)) ||
    ['imageOnly','showCompanies','variable'].some(key=>item.profile[key]!==undefined && typeof item.profile[key]!=='boolean') ||
    (item.profile.mode !== undefined && !['prepared', 'participant', 'custom'].includes(item.profile.mode)) ||
    (item.profile.exposureLimit !== undefined && ![3, 4, 6].includes(item.profile.exposureLimit)) ||
    (item.profile.analysisView !== undefined && (!item.profile.analysisView ||
      !['held', 'flows', 'future'].includes(item.profile.analysisView.mode) ||
      String(item.profile.analysisView.groupKey || '').length > 1000 ||
      (item.profile.analysisView.mode==='future' && (!(Number(item.profile.analysisView.capital)>0) || !Number.isFinite(Number(item.profile.analysisView.capital)) ||
        !Number.isInteger(Number(item.profile.analysisView.months)) || Number(item.profile.analysisView.months)<1 || Number(item.profile.analysisView.months)>120)))))
    throw Error('Fichier de portefeuille invalide ou incompatible.')
  // Import never carries publication consent, even from a previously approved file.
  return {id: item.id, title: item.title, draft: item.draft, field: item.field,
    profile: {...structuredClone(item.profile), approved: false}}
}
export function exportPortfolio(record) {
  const text = JSON.stringify({format, version: 1, portfolio: checked(record)}, null, 2)
  if (new TextEncoder().encode(text).length > MAX_PORTFOLIO_FILE_BYTES) throw Error('Fichier de portefeuille trop volumineux.')
  return text
}
export function importPortfolio(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_PORTFOLIO_FILE_BYTES)
    throw Error('Fichier de portefeuille trop volumineux.')
  let parsed
  try { parsed = JSON.parse(text) } catch { throw Error('Le fichier ne contient pas un JSON lisible.') }
  if (parsed?.format !== format || parsed.version !== 1) throw Error('Format de portefeuille incompatible.')
  return checked(parsed.portfolio)
}
