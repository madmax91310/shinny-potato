import { useRef } from 'react'
import ChoicePicker from '../../design-system/ChoicePicker'
import Button from '../../design-system/Button'
import { THEMES, SUBJECTS, ALL_MECHANICS, themeLabel } from './catalog.js'
export default function Filters({ filters, onChange, onReset, count }) {
  const themes = useRef(null)
  const active = [filters.theme && themeLabel(filters.theme), filters.newOnly && 'Nouvelle sélection', filters.debateOnly && 'Ça va débattre', filters.unusedOnly && 'Non utilisés', filters.publicOnly && 'Tout public', filters.draftsOnly && 'Brouillons', filters.archivedOnly && 'Archives', filters.subject && SUBJECTS.find(s => s.id === filters.subject)?.label, filters.mechanic && ALL_MECHANICS.find(m => m.id === filters.mechanic)?.label, filters.search && `« ${filters.search} »`].filter(Boolean)
  return <section className="hg-controls" aria-label="Trouver une question">
    <details className="hg-theme-picker" ref={themes}><summary><span>De quoi veux-tu parler ?</span><strong>{filters.theme ? themeLabel(filters.theme) : 'Tout'} <small>· Tous les thèmes</small></strong></summary>
      <div className="hg-chips" role="group" aria-label="Thèmes">{[{ id: '', label: 'Tout' }, ...THEMES].map(theme => <button type="button" key={theme.id} aria-pressed={filters.theme === theme.id} onClick={() => { onChange({ theme: theme.id }); themes.current.open = false }}>{theme.label}</button>)}</div>
    </details>
    <div className="hg-quick hg-chips" role="group" aria-label="Accès rapides">{[['newOnly', 'Nouvelle sélection'], ['debateOnly', 'Ça va débattre'], ['unusedOnly', 'Non utilisés']].map(([key, label]) => <button key={key} type="button" aria-pressed={filters[key]} onClick={() => onChange({ [key]: !filters[key] })}>{label}</button>)}</div>
    <label className="hg-search">Rechercher<input type="search" value={filters.search} placeholder="Montant, retraite, entreprise…" onChange={event => onChange({ search: event.target.value })} /></label>
    <div className="hg-result-bar"><p role="status">{count} question{count > 1 ? 's' : ''}</p><details className="hg-advanced"><summary>Plus de filtres{active.length ? ` (${active.length})` : ''}</summary><div className="hg-advanced-body">
      <label><input type="checkbox" checked={filters.publicOnly} onChange={event => onChange({ publicOnly: event.target.checked })} /> Tout public</label>
      <label><input type="checkbox" checked={filters.archivedOnly} onChange={event => onChange({ archivedOnly: event.target.checked })} /> Archives de la banque</label>
      <details><summary>Anciennes catégories</summary><ChoicePicker aria-label="Ancienne catégorie" value={filters.subject} onChange={event => onChange({ subject: event.target.value })}><option value="">Toutes</option>{SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</ChoicePicker></details>
      <details><summary>Mécaniques</summary><ChoicePicker aria-label="Mécanique" value={filters.mechanic} onChange={event => onChange({ mechanic: event.target.value })}><option value="">Toutes</option>{ALL_MECHANICS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</ChoicePicker></details>
    </div></details></div>
    {active.length > 0 && <div className="hg-active"><p>Filtres actifs : {active.join(' · ')}</p><Button variant="ghost" onClick={onReset}>Réinitialiser les filtres</Button></div>}
  </section>
}
