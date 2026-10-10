import { useId, useMemo, useState } from 'react'
import { normalizeSearch } from '../data/asset-selection.js'
import './asset-picker.css'

export default function AssetPicker({ items, value, onChange, label, id, className = '', emptyOption, selectOnGroupChange = false }) {
  const uniqueId = useId()
  const selectId = id ?? uniqueId
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('Tous')
  const [peaOnly, setPeaOnly] = useState(false)
  const [showAllGroups, setShowAllGroups] = useState(false)
  const groups = useMemo(() => [...new Set(items.map(item => item.group ?? 'Autres actifs'))], [items])
  const priority = ['Monde', 'États-Unis', 'Europe', 'Émergents', 'Obligations et monétaire']
  const orderedGroups = [...priority.filter(name => groups.includes(name)), ...groups.filter(name => !priority.includes(name))]
  const displayedGroups = showAllGroups ? orderedGroups : orderedGroups.slice(0, 5)
  const current = items.find(item => String(item.id) === String(value))
  const filtered = items.filter(item => (!peaOnly || item.badges?.includes('PEA')) && (group === 'Tous' || item.group === group) &&
    normalizeSearch(`${item.label} ${item.search ?? ''} ${item.detail ?? ''} ${item.isin ?? ''}`).includes(normalizeSearch(query)))
  return <div className="asset-picker">
    {label && <span className="asset-picker-label">{label}</span>}
    {(current || (emptyOption && String(value) === String(emptyOption.id))) && <p className="picker-selection"><span aria-hidden="true">✓</span><span><small>Sélection actuelle</small><strong>{current?.label ?? emptyOption.label}</strong></span></p>}
    <input type="search" value={query} onChange={event => setQuery(event.target.value)}
      aria-label={`Rechercher : ${label ?? 'actif'}`} placeholder="Nom, indice, ticker ou ISIN…" />
    <div className="asset-picker-groups" role="group" aria-label={`Expositions : ${label ?? 'actif'}`}>
      {['Tous', ...displayedGroups].map(name => <button type="button" key={name} aria-pressed={group === name}
        onClick={() => {
          setGroup(name)
          if (selectOnGroupChange) {
            setQuery('')
            const matches = items.filter(item => (!peaOnly || item.badges?.includes('PEA')) && (name === 'Tous' || (item.group ?? 'Autres actifs') === name))
            if (!matches.includes(current) && matches.length) onChange(String(matches[0].id))
          }
        }}>{name}</button>)}
    </div>
    {groups.length > 5 && <button type="button" className="asset-picker-more" aria-expanded={showAllGroups}
      onClick={() => setShowAllGroups(!showAllGroups)}>{showAllGroups ? 'Moins d’expositions' : `Toutes les expositions (${groups.length})`}</button>}
    {items.some(item => item.badges?.includes('PEA')) && <div className="asset-picker-eligibility" role="group" aria-label="Éligibilité des supports">
      <button type="button" aria-pressed={!peaOnly} onClick={() => setPeaOnly(false)}>Tous les supports</button>
      <button type="button" aria-pressed={peaOnly} onClick={() => setPeaOnly(true)}>Éligibles PEA</button>
    </div>}
    <div id={selectId} role="group" aria-label={label} data-selector data-value={String(value ?? '')}
      className={`asset-picker-options ${className}`}>
      {emptyOption && <button type="button" className="asset-option" data-option data-value={emptyOption.id}
        aria-pressed={String(value) === String(emptyOption.id)} onClick={() => onChange(String(emptyOption.id))}>{emptyOption.label}</button>}
      {filtered.map(item => <button type="button" className="asset-option" data-option data-value={String(item.id)} key={item.id}
        aria-pressed={String(item.id) === String(value)} onClick={() => onChange(String(item.id))}>
        <span className="asset-option-icon" aria-hidden="true">{(item.name ?? item.label).slice(0, 1)}</span>
        <span className="asset-option-copy"><strong>{item.label}</strong>
          {item.detail && <small>{item.detail}</small>}
          {item.isin && <small>{item.isin}</small>}
          {item.badges?.length > 0 && <span className="asset-option-badges">{item.badges.map(badge => <small key={badge}>{badge}</small>)}</span>}
        </span><span className="asset-option-check" aria-hidden="true">{String(item.id) === String(value) ? '✓' : '+'}</span>
      </button>)}
    </div>
    {current && !filtered.includes(current) && <p className="asset-picker-detail">Sélection actuelle : <strong>{current.label}</strong></p>}
    {(query || group !== 'Tous' || peaOnly) && <div className="asset-picker-results" aria-live="polite">
      {filtered.length ? `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}` : 'Aucun résultat. La sélection actuelle est conservée.'}
      <button type="button" onClick={() => { setQuery(''); setGroup('Tous'); setPeaOnly(false) }}>Tout afficher</button>
    </div>}
    {current?.detail && <p className="asset-picker-detail">{current.detail}</p>}
    {current?.isin && <details className="asset-picker-details"><summary>Identité du support</summary>
      <p>{current.name ?? current.label}</p><p>{current.isin}</p>
    </details>}
  </div>
}
