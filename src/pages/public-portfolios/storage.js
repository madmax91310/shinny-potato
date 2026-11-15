import { STORAGE_KEY } from './data.js'
let expected
export function load() {
 try { expected=localStorage.getItem(STORAGE_KEY); const v=expected?JSON.parse(expected):{version:1,profiles:[]}; if(v.version!==1||!Array.isArray(v.profiles))throw Error(); return v }
 catch { return {version:1,profiles:[],error:'Stockage illisible ou indisponible. Les données existantes sont préservées.'} }
}
export function save(value) {
 try { if(localStorage.getItem(STORAGE_KEY)!==expected)throw Error(); const raw=JSON.stringify(value); localStorage.setItem(STORAGE_KEY,raw); expected=raw; return true }catch{return false}
}
