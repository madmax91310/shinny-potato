import { readSavedState, writeSaved } from './management.js'

export const isSubscriberRecord = record => record?.profile?.mode === 'participant' && !record.profile.imageOnly
export const subscriberId = record => (typeof record.profile.id==='string'&&record.profile.id.startsWith('subscriber:')) ? record.profile.id : `subscriber:${record.id}`
export function newSubscriberProfile() {
 return {id:`subscriber:${crypto.randomUUID()}`,mode:'participant',selection:'classic',name:'',job:'',location:'',scope:'Portefeuille investi',lines:[],approved:false,imageOnly:false}
}
export const subscriberSignature = ({profile,draft,field}) => JSON.stringify({profile:{...profile,approved:false},draft,field})
export function saveSubscriberProfile(storage, record, session) {
 if(!isSubscriberRecord(record))throw Error('Ouvre une participation pour enregistrer un profil d’abonné.')
 const state=readSavedState(storage)
 const previous=session ? state.items.find(item=>item.id===session.id) : null
 if(session && (!isSubscriberRecord(previous) || JSON.stringify(previous)!==session.source))throw Error('Ce profil a changé dans un autre onglet ou a été supprimé. Rouvre sa version enregistrée avant de le mettre à jour. Ton brouillon est conservé.')
 const id=previous?.id || crypto.randomUUID()
 const title=previous?.title.trim()&&previous.profile.name===record.profile.name?previous.title:record.profile.name.trim()
 const item={id,title,profile:{...structuredClone(record.profile),id:previous?subscriberId(previous):(typeof record.profile.id==='string'&&record.profile.id.startsWith('subscriber:'))?record.profile.id:`subscriber:${id}`,mode:'participant',approved:false},draft:record.draft,field:record.field}
 if(!item.title)throw Error('Indique le pseudonyme avant d’enregistrer ce profil.')
 writeSaved(storage,previous?state.items.map(row=>row.id===id?item:row):[...state.items,item])
 return item
}
export function removeSubscriberProfile(storage,record) {
 const state=readSavedState(storage),current=state.items.find(item=>item.id===record.id)
 if(!current||JSON.stringify(current)!==JSON.stringify(record))throw Error('Ce profil a changé dans un autre onglet. Actualise la liste avant de le supprimer.')
 writeSaved(storage,state.items.filter(item=>item.id!==record.id))
}
export function filterSubscriberProfiles(items,query='') {
 const clean=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 const terms=clean(query.trim()).split(/\s+/).filter(Boolean)
 return items.filter(isSubscriberRecord).filter(item=>terms.every(term=>clean(`${item.title} ${item.profile.name} ${item.profile.job||''}`).includes(term)))
}
