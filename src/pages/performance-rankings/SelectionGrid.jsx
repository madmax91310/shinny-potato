import { useMemo, useState } from 'react'
import { CATEGORIES } from './data.js'
import { EQUITY_GROUPS } from './suggestions.js'
import { isStock, toggleAsset } from './selection.js'
import { normalizeSearch } from '../../data/search-text.js'

const GROUPS = CATEGORIES.filter(c => EQUITY_GROUPS.has(c.id))
const ETF_IDS = new Set(GROUPS.flatMap(c => c.ids))
export default function SelectionGrid({ ids, currency, assets, onChange }) {
  const [group, setGroup] = useState('stocks')
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [limit, setLimit] = useState(30)
  const selectedGroup = GROUPS.find(c => c.id === group)
  const choices = useMemo(() => Object.values(assets).filter(a =>
    (group === 'stocks' ? isStock(a) : group === 'etfs' ? a.isin && ETF_IDS.has(a.id) : selectedGroup?.ids.includes(a.id)) &&
    normalizeSearch(`${a.label} ${a.shortLabel} ${a.ticker ?? ''} ${a.isin ?? ''}`).includes(normalizeSearch(query)))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr')), [assets, group, query, selectedGroup])
  function toggle(id) {
    try { onChange(toggleAsset(ids, id, currency, assets)); setError('') }
    catch (e) { setError(e.message) }
  }
  return <section className="rk-batch" aria-label="Sélection par cases à cocher">
    <p aria-live="polite"><strong>{ids.length}/6 sélectionnés</strong> · de deux à six actifs</p>
    <label className="rk-field">Univers à cocher<select value={group} onChange={e => { setGroup(e.target.value); setLimit(30) }}>
      <option value="stocks">Toutes les actions</option><option value="etfs">ETF actions</option>
      {GROUPS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
    </select></label>
    <label className="rk-field">Rechercher dans l’univers<input type="search" value={query} onChange={e => { setQuery(e.target.value); setLimit(30) }} placeholder="Nom, ticker ou ISIN…" /></label>
    <div className="rk-checkbox-list">{choices.slice(0, limit).map(a => <label key={a.id}>
      <input type="checkbox" checked={ids.includes(a.id)} disabled={ids.length >= 6 && !ids.includes(a.id)} onChange={() => toggle(a.id)} aria-label={`Sélectionner ${a.label}`} />
      <span><strong>{a.shortLabel}</strong><small>{a.label} · {a.currency}</small></span>
    </label>)}</div>
    {!choices.length && <p role="status">Aucun actif ne correspond à cette recherche.</p>}
    {choices.length > limit && <button type="button" onClick={() => setLimit(value => value + 30)}>Afficher plus d’actifs</button>}
    <p className="rk-note">À six actifs, décoche une ligne pour la remplacer. Une sélection en devises différentes active automatiquement la comparaison en euros.</p>
    {error && <p role="alert">{error}</p>}
  </section>
}
