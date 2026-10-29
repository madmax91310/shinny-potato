import { useEffect, useState } from 'react'
import Button from '../../design-system/Button'
import { readSaved, readSavedState, writeSaved } from './management.js'
import { validateProfile } from './engine.js'
export default function Portfolios({profile, draft = '', field, onLoad, resetSignal = 0}) {
  const [items, setItems] = useState([]), [title, setTitle] = useState(''), [selected, setSelected] = useState(''), [feedback, setFeedback] = useState('')
  useEffect(() => {setSelected('');setTitle('')}, [resetSignal])
  useEffect(() => {
    const record = items.find(item => item.id === selected)
    if (record && record.profile.id !== profile.id) {setSelected('');setTitle('')}
  }, [profile.id, items, selected])
  function refresh() { try { const state=readSavedState(localStorage); setItems(state.items); setFeedback(state.rejected.length ? 'Certaines sauvegardes sont illisibles. Les autres restent disponibles ; les données d’origine sont conservées.' : '') } catch { setItems([]); setFeedback('Sauvegardes illisibles. Les données existantes sont conservées.') } }
  function save(asCopy = false) {
    try {
      if (!title.trim()) throw Error('Donne un nom à la sauvegarde.')
      // Read immediately before writing: the other workspace may have saved meanwhile.
      const previous = readSaved(localStorage,{recoverInvalidRoot:true})
      const id = !asCopy && previous.some(x => x.id === selected) ? selected : crypto.randomUUID()
      const item = {id, title:title.trim(), profile:structuredClone(profile), draft, field}
      const next = previous.some(x => x.id === id) ? previous.map(x => x.id === id ? item : x) : [...previous, item]
      writeSaved(localStorage, next); setItems(next); setSelected(id); setFeedback('Portefeuille enregistré sur cet appareil.')
    } catch(error) { setFeedback(error.message || 'Enregistrement impossible sur cet appareil.') }
  }
  function remove(id) {
    try { const next = readSaved(localStorage).filter(x => x.id !== id); writeSaved(localStorage, next); setItems(next); if(selected === id) setSelected(''); setFeedback('Sauvegarde supprimée. Le portefeuille affiché reste ouvert.') }
    catch { setFeedback('Suppression impossible. Les données existantes sont conservées.') }
  }
  return <details className="dca-saved" onToggle={e => {if(e.currentTarget.open) refresh()}}><summary>Mes portefeuilles</summary>
    <label>Nom de la sauvegarde<input maxLength={80} value={title} onChange={e => setTitle(e.target.value)}/></label>
    <div className="dca-buttons"><Button variant="secondary" disabled={!!validateProfile(profile).length} onClick={() => save()}>{selected ? 'Mettre à jour la sauvegarde' : 'Enregistrer ce portefeuille'}</Button>{selected && <Button variant="secondary" disabled={!!validateProfile(profile).length} onClick={() => save(true)}>Enregistrer une copie</Button>}</div>
    {items.filter(item => !!item.profile.imageOnly === !!profile.imageOnly).map(item => <div className="dca-saved-row" key={item.id}><span>{item.title}</span><button aria-label={`Ouvrir ${item.title}`} onClick={() => {onLoad(structuredClone(item)); setSelected(item.id); setTitle(item.title); setFeedback('Portefeuille ouvert.')}}>Ouvrir</button><button aria-label={`Supprimer ${item.title}`} onClick={() => remove(item.id)}>Supprimer</button></div>)}
    <p role="status">{feedback}</p><p className="dca-note">Brouillon enregistré automatiquement sur cet appareil. Tes sauvegardes nommées restent distinctes. Les allocations sont dans « Analyser une allocation », les profils dans « Le DCA de… ».</p>
  </details>
}
