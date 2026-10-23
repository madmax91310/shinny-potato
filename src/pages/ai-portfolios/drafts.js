export const DRAFT_KEY='ai-portfolios-owner-draft-v1'
export function readDraft(storage=globalThis.localStorage){try{const value=JSON.parse(storage.getItem(DRAFT_KEY)??'null');return value?.version===1?value:null}catch{return null}}
export function writeDraft(value,storage=globalThis.localStorage){try{storage.setItem(DRAFT_KEY,JSON.stringify({version:1,...value,updatedAt:new Date().toISOString()}));return true}catch{return false}}
export function deleteDraft(storage=globalThis.localStorage){try{storage.removeItem(DRAFT_KEY);return true}catch{return false}}
