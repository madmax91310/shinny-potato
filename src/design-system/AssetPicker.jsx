import { firstGrapheme } from '../lib/first-grapheme.js'
import { useAssetPickerPreferences } from '../lib/useAssetPickerPreferences.js'
import { assetPreferenceKey, filterAssetOptions } from '../lib/asset-picker-preferences.js'
import { useId, useMemo, useState } from 'react'
import './asset-picker.css'

export default function AssetPicker({ items, value, onChange, label, id, className = '', emptyOption, selectOnGroupChange = false, hideIdleResults = false, clearSearchOnSelect = false, searchPlaceholder = 'Nom, indice, ticker ou ISIN…', optionsClassName = '', disabled = false, compact = false, inputClassName = '', persistent = true }) {
  const { favorites, recents, toggleFavorite, remember } = useAssetPickerPreferences(items, `favorites:${globalThis.location?.pathname ?? ''}:${id ?? label ?? 'assets'}`, persistent)
  const favoriteItems = items.filter(item => favorites.includes(assetPreferenceKey(item)))
  const recentItems = recents.flatMap(key => { const item = items.find(item => assetPreferenceKey(item) === key); return item ? [item] : [] })
  const [mode, setMode] = useState('search')
  const [open, setOpen] = useState(false)
  const [limit, setLimit] = useState(30)
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
  const filtered = filterAssetOptions(items, { query: mode === 'search' ? query : '', group: mode === 'browse' ? group : 'Tous', peaOnly })
  function select(id) {
    const item = items.find(item => String(item.id) === String(id))
    if (item) remember(item)
    if (compact) setOpen(false)
    if (clearSearchOnSelect) setQuery('')
    onChange(String(id))
  }
  return <div className="asset-picker"><div className="asset-picker-shell" id={selectId} role="group" aria-label={label} data-selector data-value={String(value ?? '')}>
    {label && <span className="asset-picker-label">{label}</span>}
    {(current || (emptyOption && String(value) === String(emptyOption.id))) && <p className="picker-selection"><span aria-hidden="true">✓</span><span><small>Sélection actuelle</small><strong>{current?.label ?? emptyOption.label}</strong></span></p>}
    {compact && current && <button type="button" className="asset-picker-open" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Fermer' : 'Modifier'}</button>}
    <div className="asset-picker-panel" hidden={compact && current && !open}>
    {persistent && current && <button type="button" className="asset-picker-more" aria-pressed={favorites.includes(assetPreferenceKey(current))}
      onClick={() => toggleFavorite(current)}>
      {favorites.includes(assetPreferenceKey(current)) ? '★ Retirer des favoris' : '☆ Ajouter aux favoris'}
    </button>}
    {favoriteItems.length > 0 && <div className="asset-picker-groups" role="group" aria-label={`Favoris : ${label ?? 'actif'}`}>
      {favoriteItems.map(item => <button type="button" key={item.id} disabled={disabled} aria-pressed={String(item.id) === String(value)}
        onClick={() => { setQuery(''); setGroup('Tous'); setPeaOnly(false); select(item.id) }}>{item.label}</button>)}
    </div>}
    {recentItems.length > 0 && <details className="asset-picker-details"><summary>Derniers actifs utilisés</summary>
      <div className="asset-picker-groups" role="group" aria-label={`Récents : ${label ?? 'actif'}`}>
        {recentItems.map(item => <button type="button" key={item.id} disabled={disabled} onClick={() => { setPeaOnly(false); setQuery(''); setGroup('Tous'); select(item.id) }}>{item.label}</button>)}
      </div>
    </details>}
    <div className="asset-picker-modes" role="group" aria-label={`Mode de sélection : ${label ?? 'actif'}`}>
      <button type="button" aria-pressed={mode === 'search'} onClick={() => { setMode('search'); setLimit(30) }}>Rechercher</button>
      <button type="button" aria-pressed={mode === 'browse'} onClick={() => { setMode('browse'); setQuery(''); setLimit(30) }}>Parcourir</button>
    </div>
    {mode === 'search' && <input className={inputClassName} type="search" value={query} onChange={event => { setQuery(event.target.value); setLimit(30) }}
      aria-label={`Rechercher : ${label ?? 'actif'}`} placeholder={searchPlaceholder} />}
    {mode === 'browse' && <div className="asset-picker-groups" role="group" aria-label={`Expositions : ${label ?? 'actif'}`}>
      {['Tous', ...displayedGroups].map(name => <button type="button" key={name} aria-pressed={group === name}
        onClick={() => {
          setGroup(name); setLimit(30)
          if (selectOnGroupChange) {
            setQuery('')
            const matches = items.filter(item => (!peaOnly || item.badges?.includes('PEA')) && (name === 'Tous' || (item.group ?? 'Autres actifs') === name))
            if (!matches.includes(current) && matches.length) select(matches[0].id)
          }
        }}>{name}</button>)}
    </div>}
    {mode === 'browse' && groups.length > 5 && <button type="button" className="asset-picker-more" aria-expanded={showAllGroups}
      onClick={() => setShowAllGroups(!showAllGroups)}>{showAllGroups ? 'Moins d’expositions' : `Toutes les expositions (${groups.length})`}</button>}
    {items.some(item => item.badges?.includes('PEA')) && <div className="asset-picker-eligibility" role="group" aria-label="Éligibilité des supports">
      <button type="button" aria-pressed={!peaOnly} onClick={() => { setPeaOnly(false); setLimit(30) }}>Tous les supports</button>
      <button type="button" aria-pressed={peaOnly} onClick={() => { setPeaOnly(true); setLimit(30) }}>Éligibles PEA</button>
    </div>}
    <div className={`asset-picker-options ${className} ${optionsClassName}`}>
      {emptyOption && <button type="button" className="asset-option" data-option data-value={emptyOption.id}
        aria-pressed={String(value) === String(emptyOption.id)} onClick={() => onChange(String(emptyOption.id))}>{emptyOption.label}</button>}
      {(!hideIdleResults || mode === 'browse' || query.trim()) && filtered.slice(0, limit).map(item => <button disabled={disabled} type="button" className="asset-option" data-option data-value={String(item.id)} data-asset-id={String(item.id)} key={item.id}
        aria-pressed={String(item.id) === String(value)} onClick={() => select(item.id)}>
        <span className="asset-option-icon" aria-hidden="true">{firstGrapheme(item.name ?? item.label)}</span>
        <span className="asset-option-copy"><strong>{item.label}</strong>
          {item.detail && <small>{item.detail}</small>}
          {item.isin && <small>{item.isin}</small>}
          {item.badges?.length > 0 && <span className="asset-option-badges">{item.badges.map(badge => <small key={badge}>{badge}</small>)}</span>}
        </span><span className="asset-option-check" aria-hidden="true">{String(item.id) === String(value) ? '✓' : '+'}</span>
      </button>)}
    </div>
    {filtered.length > limit && (!hideIdleResults || mode === 'browse' || query.trim()) && <button type="button" className="asset-picker-more" onClick={() => setLimit(limit + 30)}>Afficher davantage ({filtered.length - limit} restants)</button>}
    {current && !filtered.includes(current) && <p className="asset-picker-detail">Sélection actuelle : <strong>{current.label}</strong></p>}
    {(query || (mode === 'browse' && group !== 'Tous') || peaOnly) && <div className="asset-picker-results" aria-live="polite">
      {filtered.length ? `${filtered.length} résultat${filtered.length > 1 ? 's' : ''}` : 'Aucun résultat. La sélection actuelle est conservée.'}
      <button type="button" onClick={() => { setQuery(''); setGroup('Tous'); setPeaOnly(false) }}>Tout afficher</button>
    </div>}
    </div>
    {current?.detail && <p className="asset-picker-detail">{current.detail}</p>}
    {current?.isin && <details className="asset-picker-details"><summary>Identité du support</summary>
      <p>{current.name ?? current.label}</p><p>{current.isin}</p>
    </details>}
  </div></div>
}

