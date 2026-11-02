import { useState } from 'react'
import Button from '../../design-system/Button'
import { parisToday, publicationLabel, validPublicationDate } from './publication.js'

export default function PublicationStatus({ published, date, onSave }) {
  const [editing, setEditing] = useState(false), [selectedDate, setSelectedDate] = useState(''), [error, setError] = useState(''), [removed, setRemoved] = useState(null)
  const today = parisToday()
  function open() { setSelectedDate(date || today); setError(''); setEditing(true) }
  function save() {
    if (!validPublicationDate(selectedDate) || selectedDate > today) { setError('Choisis une date valide, aujourd’hui ou dans le passé.'); return }
    if (onSave(true, selectedDate)) { setEditing(false); setRemoved(null); setError('') }
  }
  return <div className="budget-publication">
    <label className="budget-check"><input type="checkbox" checked={published} onChange={e => {
      if (e.target.checked) open()
      else if (published) { if (onSave(false)) { setRemoved({ date }); setEditing(false) } }
      else setEditing(false)
    }}/>Profil publié</label>
    {published && <><p>{publicationLabel(date)}</p><Button variant="secondary" onClick={open}>Modifier la date de publication</Button></>}
    {editing && <fieldset><legend>{published ? 'Modifier la date déclarée' : 'Confirmer la publication'}</legend>
      <label>Date de publication sur X<input type="date" min="1900-01-01" max={today} value={selectedDate} onChange={e => setSelectedDate(e.target.value)}/></label>
      <p className="dca-note">Date déclarée manuellement. La date proposée suit l’heure de Paris ; aucune vérification sur X.</p>
      <Button onClick={save}>{published ? 'Enregistrer la date' : 'Confirmer la publication'}</Button><Button variant="secondary" onClick={() => setEditing(false)}>Annuler</Button>
      {error && <p role="alert">{error}</p>}
    </fieldset>}
    {removed && !published && <p>Statut publié retiré. <Button variant="secondary" onClick={() => { if (onSave(true, removed.date)) setRemoved(null) }}>Annuler le retrait</Button></p>}
  </div>
}
