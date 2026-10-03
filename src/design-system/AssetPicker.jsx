import { useId, useMemo, useState } from 'react'
import { normalizeSearch } from '../data/asset-selection.js'
import './asset-picker.css'

export default function AssetPicker({ items, value, onChange, label, id, className = '', emptyOption, selectOnGroupChange = false, renderResults }) {
  const uniqueId = useId()
  const selectId = id ?? uniqueId
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('Tous')
  const groups = useMemo(() => [...new Set(items.map(item => item.group ?? 'Autres actifs'))], [items])
  const current = items.find(item => String(item.id) === String(value))
  const filtered = items.filter(item => (group === 'Tous' || item.group === group) &&
    normalizeSearch(`${item.label} ${item.search ?? ''} ${item.detail ?? ''} ${item.isin ?? ''}`).includes(normalizeSearch(query)))
  const visible = current && !filtered.includes(current) ? [current, ...filtered] : filtered
  const visibleGroups = [...new Set(visible.map(item => item.group ?? 'Autres actifs'))]
  return <div className="asset-picker">
    {label && <label className="asset-picker-label" htmlFor={selectId}>{label}</label>}
    <input type="search" value={query} onChange={event => setQuery(event.target.value)}
      aria-label={`Rechercher : ${label ?? 'actif'}`} placeholder="Nom, indice, ticker ou ISIN…" />
    <div className="asset-picker-groups" role="group" aria-label={`Expositions : ${label ?? 'actif'}`}>
      {['Tous', ...groups].map(name => <button type="button" key={name} aria-pressed={group === name}
        onClick={() => {
          setGroup(name)
          if (selectOnGroupChange) {
            setQuery('')
            const matches = items.filter(item => name === 'Tous' || (item.group ?? 'Autres actifs') === name)
            if (!matches.includes(current) && matches.length) onChange(String(matches[0].id))
          }
        }}>{name}</button>)}
    </div>
    <select id={selectId} aria-label={label} className={className} value={value} onChange={event => onChange(event.target.value)}>
      {emptyOption && <option value={emptyOption.id}>{emptyOption.label}</option>}
      {visibleGroups.map(name => <optgroup label={name} key={name}>
        {visible.filter(item => (item.group ?? 'Autres actifs') === name).map(item =>
          <option value={item.id} key={item.id}>{item.label}{item.badges?.length ? ` · ${item.badges.join(' · ')}` : ''}</option>)}
      </optgroup>)}
    </select>
    {(query || group !== 'Tous') && <div className="asset-picker-results" aria-live="polite">
      {filtered.length ? `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}` : 'Aucun résultat. La sélection actuelle est conservée.'}
      <button type="button" onClick={() => { setQuery(''); setGroup('Tous') }}>Tout afficher</button>
    </div>}
    {current?.detail && <p className="asset-picker-detail">{current.detail}</p>}
    {current?.isin && <details className="asset-picker-details"><summary>Identité du support</summary>
      <p>{current.name ?? current.label}</p><p>{current.isin}</p>
    </details>}
    {(query || group !== 'Tous') && renderResults?.(filtered)}
  </div>
}
