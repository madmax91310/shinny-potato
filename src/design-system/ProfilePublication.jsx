import { useState } from 'react'
import Button from './Button'
import { localToday, publicationLabel, validPublicationDate } from '../lib/publication-date.js'

export default function ProfilePublication({ published, date, onSave, disabled=false, lockName, checkbox=false }) {
  const [editing,setEditing]=useState(false), [selectedDate,setSelectedDate]=useState(''), [error,setError]=useState(''), [pending,setPending]=useState(false)
  const today=localToday()
  function open(){setSelectedDate(date||today);setError('');setEditing(true)}
  async function commit(checked){
    if(checked&&(!validPublicationDate(selectedDate)||selectedDate>today)){setError('Choisis une date valide, aujourd’hui ou dans le passé.');return}
    setPending(true);setError('')
    try{
      const save=()=>onSave(checked,checked?selectedDate:null)
      const ok=globalThis.navigator?.locks&&lockName?await navigator.locks.request(lockName,save):await save()
      if(ok)setEditing(false)
      else setError('Le statut n’a pas pu être enregistré. Les données précédentes sont conservées. Recharge la page avant de réessayer.')
    }catch{setError('Le statut n’a pas pu être enregistré. Les données précédentes sont conservées.')}
    finally{setPending(false)}
  }
  return <section className="profile-publication" aria-label="Suivi de publication">
    {checkbox&&<label className="budget-check"><input type="checkbox" checked={published} disabled={disabled||pending} onChange={e=>e.target.checked?open():commit(false)}/>Profil publié</label>}
    <p><strong>{published?publicationLabel(date):'Non publié'}</strong></p>
    <div className="dca-buttons"><Button variant="secondary" disabled={disabled||pending} onClick={open}>{published?'Modifier la date de publication':'Marquer publié'}</Button>
      {published&&<Button variant="secondary" disabled={disabled||pending} onClick={()=>commit(false)}>Retirer le statut publié</Button>}</div>
    {editing&&<fieldset><legend>{published?'Modifier la date déclarée':'Confirmer la publication'}</legend>
      <label>Date de publication<input type="date" min="1900-01-01" max={today} value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></label>
      <div className="dca-buttons"><Button disabled={disabled||pending} onClick={()=>commit(true)}>{published?'Enregistrer la date':'Confirmer la publication'}</Button><Button variant="secondary" disabled={pending} onClick={()=>setEditing(false)}>Annuler</Button></div>
    </fieldset>}
    <p className="dca-note">Suivi manuel, conservé dans ce navigateur sur cet appareil. La date proposée est locale. Aucune publication sur X.</p>
    {error&&<p role="alert">{error}</p>}
  </section>
}
