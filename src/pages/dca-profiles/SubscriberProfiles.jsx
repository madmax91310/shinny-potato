import { useEffect, useState } from 'react'
import ProfilePublication from '../../design-system/ProfilePublication.jsx'
import { usageDate, USED_KEY } from './usage-history.js'
import { publicationLabel } from '../../lib/publication-date.js'
import Button from '../../design-system/Button'
import { readSavedState, validDraftProfile } from './management.js'
import { euro } from './engine.js'
import { filterSubscriberProfiles, isSubscriberRecord, removeSubscriberProfile, saveSubscriberProfile, subscriberId } from './subscriber-profiles.js'

export default function SubscriberProfiles({profile,draft,field,session,dirty,onNew,onOpen,onSaved,onRemoved,usage,onPublish}) {
 const [items,setItems]=useState([]),[query,setQuery]=useState(''),[feedback,setFeedback]=useState(''),[error,setError]=useState(''),[pending,setPending]=useState(null)
 function refresh(){
  try{const state=readSavedState(localStorage);setItems(state.items);setError(state.rejected.length?'Certaines sauvegardes sont illisibles et restent conservées sur cet appareil.':'')}
  catch{setItems([]);setError('Les sauvegardes ne peuvent pas être lues. Les données existantes sont conservées.')}
 }
 useEffect(()=>{
  refresh()
  const reload=()=>refresh()
  window.addEventListener('storage',reload)
  return()=>window.removeEventListener('storage',reload)
 },[])
 const rows=filterSubscriberProfiles(items,query,true)
 const editable=isSubscriberRecord({profile})
 const invalid=!editable||!validDraftProfile(profile)
 function perform(action){setPending(null);setFeedback('');if(action==='new')onNew();else onOpen(action)}
 function request(action){if(dirty)setPending(action);else perform(action)}
 function save(continueAfter=false){
  try{
   const record=saveSubscriberProfile(localStorage,{profile,draft,field},session)
   refresh();onSaved(record);setFeedback('Profil enregistré sur cet appareil.')
   if(continueAfter&&pending)perform(pending)
  }catch(e){setError(e.message||'Enregistrement impossible. Ton brouillon reste ouvert.')}
 }
 function remove(record){
  try{removeSubscriberProfile(localStorage,record);refresh();onRemoved(record.id);setFeedback('Profil supprimé de la liste. Le brouillon ouvert reste disponible.')}
  catch(e){setError(e.message)}
 }
 return <section className="dca-simple-card dca-subscriber-library" aria-label="Profils d’abonnés enregistrés">
  <h2>Profils sauvegardés</h2>
  <p>Garde les profils reçus, puis rouvre-les pour préparer leur DCA. Les données sont enregistrées dans ce navigateur, sur cet appareil.</p>
  <div className="dca-buttons"><Button onClick={()=>request('new')}>Ajouter un profil d’abonné</Button>{editable&&<Button variant="secondary" disabled={invalid} onClick={()=>save()}>{session?'Mettre à jour ce profil':'Enregistrer ce profil'}</Button>}</div>
  {editable&&invalid&&<p className="dca-note">Certaines données sont illisibles. Le brouillon ouvert reste conservé.</p>}
  {editable&&<p className="dca-note">Tu peux enregistrer un profil incomplet et le reprendre ici plus tard.</p>}
  {editable&&dirty&&<p role="status">Ce profil a des modifications non enregistrées.</p>}
  {pending&&<div className="dca-subscriber-pending" role="group" aria-label="Modifications du profil en cours">
   <p>Enregistre le profil en cours avant de continuer, ou choisis de quitter sans enregistrer ses modifications.</p>
   <div className="dca-buttons"><Button disabled={invalid} onClick={()=>save(true)}>Enregistrer puis continuer</Button><Button variant="secondary" onClick={()=>perform(pending)}>Continuer sans enregistrer</Button><Button variant="secondary" onClick={()=>setPending(null)}>Annuler</Button></div>
  </div>}
  <label>Rechercher un profil<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pseudonyme ou activité"/></label>
  {!rows.length&&<p>{query?'Aucun profil ne correspond à cette recherche.':'Aucun profil enregistré. Ajoute ton premier profil d’abonné.'}</p>}
  <div className="dca-subscriber-list">{rows.map(record=>{
   const id=isSubscriberRecord(record)?subscriberId(record):record.profile.id,published=usage.entries.find(entry=>entry.id===id)
   const monthly=record.profile.lines.reduce((sum,line)=>sum+(Number.isFinite(line.amount)?line.amount:0),0)
   return <article className="dca-subscriber-row" key={record.id} aria-label={`Profil enregistré : ${record.title}`}>
    <div><h3>{record.title}</h3>{record.status==='draft'&&<p>Brouillon à compléter</p>}<p>{record.profile.job||'Activité non renseignée'} · {euro(monthly)}/mois · {record.profile.lines.length} placement{record.profile.lines.length>1?'s':''}</p><p>{published?publicationLabel(usageDate(published)):'Non publié'}{session?.id===record.id?' · Profil ouvert':''}</p></div>
    <div className="dca-buttons"><Button variant="secondary" onClick={()=>request(record)}>Ouvrir {record.title}</Button><Button variant="secondary" onClick={()=>remove(record)}>Supprimer {record.title}</Button></div>
    <ProfilePublication key={id} lockName={USED_KEY} disabled={!usage.readable} published={!!published} date={usageDate(published)} onSave={(checked,date)=>onPublish(id,checked,date)}/>
   </article>
  })}</div>
  <div className="dca-buttons"><Button variant="secondary" onClick={refresh}>Actualiser la liste</Button></div>
  {error&&<p role="alert">{error}</p>}{feedback&&<p role="status">{feedback}</p>}
 </section>
}
