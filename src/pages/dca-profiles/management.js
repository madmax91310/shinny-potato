import { ASSETS } from './data.js'
import { validateProfile, references } from './engine.js'
const legacyAliases={'novo-nordisk':'novo','saint-gobain':'saintgobain',linde:'lin',moodys:'mco'}
export const profileSelection = profile => profile?.selection === 'controversial' ? 'controversial' : 'classic'
export function migrateProfile(profile){return profile&&Array.isArray(profile.lines)?{...profile,selection:profileSelection(profile),lines:profile.lines.map(line=>({...line,asset:legacyAliases[line.asset]||line.asset}))}:profile}
export const SAVED_KEY='el-dca-portfolios-v2'
const thematic=new Set(['timber','agribusiness','materials','utilities','healthcare','industrials','semiconductors','water','cybersecurity','infrastructure','reit'])
export function assetKind(asset){return ['btc','eth'].includes(asset)?'crypto':['gold','silver'].includes(asset)?'metal':thematic.has(asset)?'thematic':references[asset]?.kind==='equity'?'equity':'etf'}
const clean = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
export function searchAssets(query,filter=''){const q=clean(query.trim());return Object.keys(ASSETS).filter(asset=>clean([ASSETS[asset][1],references[asset]?.name,references[asset]?.isin,...(references[asset]?.aliases||[]),...(references[asset]?.tickers||[])].join(' ')).includes(q)&&(!filter||(filter==='pea'?references[asset]?.pea===true:filter==='nonpea'?references[asset]?.pea===false:filter==='equity'?references[asset]?.kind==='equity':references[asset]?.kind!=='equity')))}
export function filterProfiles(profiles,filters,used=[]){return profiles.filter(p=>{
 const budget=p.lines.reduce((s,l)=>s+l.amount,0)
 return profileSelection(p)===(filters.selection || 'classic')
 && (!filters.budget || (filters.budget==='small'?budget<=200:filters.budget==='medium'?budget>200&&budget<=500:filters.budget==='large'?budget>500&&budget<=1000:budget>1000))
 && (!filters.lines || p.lines.length===Number(filters.lines))
 && (!filters.kind || p.lines.some(l=>assetKind(l.asset)===filters.kind))
 && (!filters.unused || !used.includes(p.id))
})}
export function validSaved(record){
 try{return record&&typeof record.id==='string'&&record.id.length<=100&&typeof record.title==='string'&&record.title.length<=80&&typeof record.draft==='string'&&record.draft.length<=20000&&['countries','sectors','both','all','overlap'].includes(record.field)&&!validateProfile(record.profile).length}catch{return false}
}
export function readSavedState(storage,{recoverInvalidRoot=false}={}){
 const raw=storage.getItem(SAVED_KEY)
 if(!raw)return {items:[],rejected:[]}
 let parsed
 try{
  parsed=JSON.parse(raw)
  if(parsed?.version!==2||!Array.isArray(parsed.items)||parsed.items.length>50)throw Error('Sauvegarde illisible ou incompatible.')
 }catch(error){if(!recoverInvalidRoot)throw error;return {items:[],rejected:[raw]}}
 const items=[],rejected=[],ids=new Set()
 for(const record of parsed.items){
  let item
  try{item=record&&{...record,profile:migrateProfile(record.profile)}}catch{rejected.push(record);continue}
  if(!validSaved(item)||ids.has(item.id)){rejected.push(record);continue}
  ids.add(item.id);items.push(item)
 }
 return {items,rejected}
}
export const readSaved = (storage,options) => readSavedState(storage,options).items
// Preserve the exact original before replacing an unreadable local record.
// If the archive cannot be written, the active record must stay untouched.
export function preserveLocalRecord(storage,key,raw){
 if(raw!==null)storage.setItem(`${key}-recovery-${crypto.randomUUID()}`,raw)
}
export function writeSaved(storage,items){
 if(items.length>50)throw Error('La limite de 50 portefeuilles enregistrés est atteinte.')
 if(!items.every(validSaved)||new Set(items.map(item=>item.id)).size!==items.length)throw Error('Corrige le portefeuille avant de l’enregistrer.')
 const raw=storage.getItem(SAVED_KEY)
 let damaged=false
 try{damaged=readSavedState(storage).rejected.length>0}catch{damaged=true}
 if(damaged)preserveLocalRecord(storage,SAVED_KEY,raw)
 storage.setItem(SAVED_KEY,JSON.stringify({version:2,items}))
}
