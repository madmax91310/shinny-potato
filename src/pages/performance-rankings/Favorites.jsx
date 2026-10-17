import { useEffect, useState } from 'react'
import { deleteFavorite, FAVORITES_KEY, readFavorites, saveFavorite, validateFavoriteSelection } from './favorites.js'

function read() {
  try { return { items: readFavorites(localStorage), error: '' } }
  catch { return { items: [], error: 'Impossible de lire les favoris sur cet appareil. Les données existantes sont conservées.' } }
}
export default function Favorites({ selection, disabled, onRestore }) {
  const [state, setState] = useState(read)
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  useEffect(() => {
    const refresh = event => { if (!event.key || event.key === FAVORITES_KEY) setState(read()) }
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])
  function save() {
    try { setState({ items: saveFavorite(localStorage, name, selection), error: '' }); setMessage('Favori enregistré sur cet appareil.') }
    catch (e) { setMessage(`Enregistrement impossible : ${e.message}`) }
  }
  function restore(item) {
    try { onRestore(validateFavoriteSelection(item.selection)); setName(item.name); setMessage('Favori restauré avec sa devise et sa période.') }
    catch (e) { setMessage(`Ce favori ne peut pas être ouvert : ${e.message}`) }
  }
  function remove(id) {
    try { setState({ items: deleteFavorite(localStorage, id), error: '' }); setMessage('Favori supprimé.') }
    catch { setMessage('Impossible de supprimer ce favori sur cet appareil.') }
  }
  return <details className="rk-favorites"><summary>Mes confrontations favorites ({state.items.length})</summary>
    <p className="rk-note">Actifs, devise, période et référence ETF sont conservés sur ce navigateur. Un nom déjà utilisé met le favori à jour.</p>
    <label className="rk-field">Nom du favori<input value={name} maxLength={80} placeholder={selection.title || 'Ma confrontation'} onChange={e => setName(e.target.value)} /></label>
    <button type="button" onClick={save} disabled={disabled}>Enregistrer la confrontation</button>
    <ul>{state.items.map(item => <li key={item.id}>
      <button type="button" onClick={() => restore(item)} aria-label={`Ouvrir le favori ${item.name}`}>{item.name}</button>
      <button type="button" onClick={() => remove(item.id)} aria-label={`Supprimer le favori ${item.name}`}>Supprimer</button>
    </li>)}</ul>
    {(message || state.error) && <p role="status">{message || state.error}</p>}
  </details>
}
