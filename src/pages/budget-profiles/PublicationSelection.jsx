import { useState } from 'react'
import Button from '../../design-system/Button'
import { BUDGET_PROFILES, BUDGET_PUBLICATION_SELECTION } from './data.js'
import { budgetDisplayName } from './lib.js'
import { publicationLabel } from './publication.js'
import { suggestBudgetPublications } from './queue.js'

export default function PublicationSelection({ used, published, publicationDates, queued, onAdd }) {
  const [selected, setSelected] = useState([])
  const [suggestions, setSuggestions] = useState(null)
  const entries = suggestions ? suggestions.map(profile => ({ id: profile.id, profile, topic: profile.job || profile.household || 'Budget à discuter' })) : BUDGET_PUBLICATION_SELECTION.map(item => ({ ...item, profile: BUDGET_PROFILES.find(p => p.id === item.id) })).filter(item => item.profile)
  const eligible = entries.filter(item => !published.includes(item.id) && !queued.includes(item.id))
  const chosen = selected.filter(id => eligible.some(item => item.id === id))
  return <section className="budget-publication-selection" aria-label="Sélection de publications">
    <p>Une sélection variée de situations à discuter. Choisis les profils à ajouter à ta file ; tes textes, dates et autres statuts restent conservés.</p>
    <Button variant="secondary" disabled={!eligible.length} onClick={() => setSelected(eligible.map(item => item.id))}>Sélectionner les profils disponibles</Button>
    <Button variant="secondary" onClick={() => { setSuggestions(suggestBudgetPublications(BUDGET_PROFILES, { published, queued, used })); setSelected([]) }}>Renouveler les suggestions</Button>
    {suggestions && !entries.length && <p>Aucun autre profil disponible après exclusion des publiés et de la file.</p>}
    <ul>{entries.map(({ id, profile, topic }) => <li key={id}>
      <label className="budget-check"><input type="checkbox" aria-label={`Préparer ${budgetDisplayName(profile)}`} checked={chosen.includes(id)} disabled={published.includes(id) || queued.includes(id)} onChange={event => setSelected(event.target.checked ? [...selected, id] : selected.filter(value => value !== id))}/>
        <span><strong>{budgetDisplayName(profile)}</strong> · {topic}
        {published.includes(id) ? ` · ${publicationLabel(publicationDates[id])}` : queued.includes(id) ? ' · déjà dans la file' : used.includes(id) ? ' · déjà utilisé' : ''}</span>
      </label>
    </li>)}</ul>
    <p>{chosen.length} profil(s) sélectionné(s).</p>
    <Button disabled={!chosen.length} onClick={() => { if (onAdd(chosen)) setSelected([]) }}>Ajouter la sélection à la file</Button>
    <p>Ajout manuel à « À publier prochainement », dans ce navigateur. Rien n’est publié sur X. Pour un autre appareil, utilise le transfert des brouillons et statuts.</p>
  </section>
}
