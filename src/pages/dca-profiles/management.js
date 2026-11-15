import { validManualIdentity } from './placements.js'
import { ASSETS } from './data.js'
import { validateProfile, MAX_EXPOSURE_POSITIONS, PROFILE_SCOPES, references } from './engine.js'
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
// Storage validation accepts partial inputs; publication keeps validateProfile's stricter rules.
export function validDraftProfile(profile){
 try{
  return profile && typeof profile.id==='string' && profile.id.length>0 && profile.id.length<=100
   && typeof profile.name==='string' && profile.name.length<=45 && PROFILE_SCOPES.includes(profile.scope)
   && ['name','job','family','location','emoji'].every(key=>profile[key]===undefined || typeof profile[key]==='string' && profile[key].length<=250)
   && ['age','income','monthly'].every(key=>profile[key]===undefined || profile[key]===null || Number.isFinite(profile[key]) && profile[key]>=0)
   && Array.isArray(profile.lines) && profile.lines.length<=MAX_EXPOSURE_POSITIONS
   && profile.lines.every(line=>line && (Object.hasOwn(ASSETS,line.asset) || validManualIdentity(line))
    && typeof line.label==='string' && line.label.length<=250
    && (line.emoji===undefined || typeof line.emoji==='string' && line.emoji.length<=30)
    && (line.isin===undefined || typeof line.isin==='string' && line.isin.length<=12)
    && (line.weight===null || Number.isFinite(line.weight) || Number.isNaN(line.weight))
    && (line.amount===null || Number.isFinite(line.amount) || Number.isNaN(line.amount) || profile.imageOnly && line.amount===undefined))
 }catch{return false}
}
export function savedRecord(record){
 if(!validDraftProfile(record.profile))throw Error('Le brouillon contient des données illisibles.')
 const {status:_status,...item}=record
 // JSON null preserves an empty numeric input across reloads; it must never become zero.
 const profile=JSON.parse(JSON.stringify({...item.profile,approved:false}))
 return {...item,profile,...(validateProfile(restoreSavedProfile(profile),MAX_EXPOSURE_POSITIONS).length?{status:'draft'}:{})}
}
export function restoreSavedProfile(profile){
 return {...profile,approved:false,lines:profile.lines.map(line=>({...line,
  weight:line.weight===null?NaN:line.weight,
  amount:line.amount===null?NaN:profile.imageOnly&&line.amount===undefined?0:line.amount}))}
}
export function validSaved(record){
 try{return record&&typeof record.id==='string'&&record.id.length<=100&&typeof record.title==='string'&&record.title.length<=80&&typeof record.draft==='string'&&record.draft.length<=20000&&['countries','sectors','both','all','overlap'].includes(record.field)&&(record.status==='draft'?validDraftProfile(record.profile):!validateProfile(record.profile,MAX_EXPOSURE_POSITIONS).length)}catch{return false}
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
