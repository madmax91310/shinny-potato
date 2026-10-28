// Independent from reading. Existing read/favourite/draft keys are untouched.
const KEY='epargnantlibre-radar-editorial-v1'
export const EDITORIAL_EVENT='editorial-radar-treatment'
function stored(){const raw=localStorage.getItem(KEY);if(raw===null)return {version:1,entries:{}};const value=JSON.parse(raw);if(value?.version!==1||!value.entries||Array.isArray(value.entries)||typeof value.entries!=='object')throw Error('État éditorial non reconnu');return value}
export function editorialTreatments(){try{return stored().entries}catch{return {}}}
export function treatmentFor(ids,entries=editorialTreatments()) {
  return ids.map(id=>entries[id]).filter(row=>row&&['dismissed','used'].includes(row.status)).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0]?.status??'active'
}
export function processedIds(entries=editorialTreatments()){return Object.keys(entries).filter(id=>['dismissed','used'].includes(entries[id]?.status))}
export function saveTreatment(ids,status) {
  if(!['active','dismissed','used'].includes(status)||!Array.isArray(ids)||ids.some(id=>typeof id!=='string'||!id))return false
  try {
    const value=stored(),updatedAt=new Date().toISOString()
    for(const id of ids)value.entries[id]={status,updatedAt}
    localStorage.setItem(KEY,JSON.stringify(value))
    window.dispatchEvent(new Event(EDITORIAL_EVENT))
    return true
  }catch{return false}
}
