import { useState } from 'react'
import { COMPARISON_FAMILIES, comparisonFamily, comparisonTags, filterComparisons } from './comparisonCatalog.js'

export default function ComparisonPicker({ categories, sources, value, onChange }) {
  const selected = categories.find(c => c.id === value)
  const selectedFamily = selected ? comparisonFamily(selected, sources) : 'etfs'
  const [browse, setBrowse] = useState(null)
  const family = browse?.owner === value ? browse.family : selectedFamily
  const [tag, setTag] = useState('')
  const [query, setQuery] = useState('')
  const available = categories.filter(c => comparisonFamily(c, sources) === family)
  const tags = [...new Set(available.flatMap(c => comparisonTags(c, sources)))].sort((a, b) => a.localeCompare(b, 'fr'))
  const filtered = filterComparisons(categories, sources, { family, tag, query })
  function chooseFamily(id) { setBrowse({ owner: value, family: id }); setTag(''); setQuery('') }
  return <section className="rk-catalog" aria-label="Choisir une comparaison">
    <fieldset className="rk-modes"><legend>Famille de comparaison</legend>
      {COMPARISON_FAMILIES.map(f => <button key={f.id} type="button" aria-pressed={family === f.id} onClick={() => chooseFamily(f.id)}>{f.label}</button>)}
    </fieldset>
    <div className="rk-catalog-filters">
      <label className="rk-field">Pays ou type d’actif<select aria-label="Pays ou type d’actif" value={tags.includes(tag) ? tag : ''} onChange={e => setTag(e.target.value)}>
        <option value="">Tous</option>{tags.map(t => <option key={t} value={t}>{t}</option>)}
      </select></label>
      <label className="rk-field">Rechercher une comparaison<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nom, actif ou ISIN…" /></label>
    </div>
    <p className="rk-note" aria-live="polite">{filtered.length} comparaison{filtered.length > 1 ? 's' : ''}{selected ? ` · Sélection actuelle : ${selected.label}` : ''}</p>
    <div className="rk-catalog-list" role="group" aria-label="Catégorie" data-value={value}>
      {filtered.map(c => <button type="button" key={c.id} data-option data-value={c.id} aria-pressed={value === c.id} onClick={() => onChange(c.id)}>
        <strong>{c.label}</strong>
        <span>{c.ids.map(id => sources[id]?.shortLabel ?? sources[id]?.label ?? id).join(' · ')}</span>
        <small>{comparisonTags(c, sources).join(' · ')}</small>
      </button>)}
      {!filtered.length && <p>Aucune comparaison pour ces filtres.</p>}
    </div>
    {(tag || query) && <button type="button" className="rk-text-button" onClick={() => { setTag(''); setQuery('') }}>Effacer les filtres</button>}
  </section>
}
