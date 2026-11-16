import Button from '../../design-system/Button'
import { budgetDisplayName } from './lib.js'
import { publicationLabel } from './publication.js'
import { moveQueuedProfile, scheduledLabel, plannedBudgetDate } from './queue.js'

export default function PublicationQueue({ profiles, queued, scheduledDates, published, publicationDates, onChange, onChoose }) {
  return <section aria-label="File de publication" className="budget-queue">
    <p>L’ordre et les dates sont prévus manuellement. Une date prévue ne marque jamais le profil publié.</p>
    {!queued.length && <p>Aucun profil dans la file.</p>}
    <ol>{queued.map((id, index) => {
      const p = profiles.find(p => p.id === id), name = p ? budgetDisplayName(p) || 'Profil sans prénom' : id
      return <li key={id}><strong>{name}</strong><p>{scheduledLabel(scheduledDates[id])}{published.includes(id) ? ` · ${publicationLabel(publicationDates[id])}` : ''}</p>
        <label>Date prévue<input type="date" aria-label={`Date prévue pour ${name}`} value={Object.hasOwn(scheduledDates, id) ? scheduledDates[id] : ''} onChange={e => onChange(queued, plannedBudgetDate(scheduledDates, id, e.target.value))}/></label>
        <div className="budget-queue-actions"><Button variant="secondary" disabled={!index} aria-label={`Monter ${name} dans la file`} onClick={() => onChange(moveQueuedProfile(queued, id, -1), scheduledDates)}>Monter</Button><Button variant="secondary" disabled={index === queued.length - 1} aria-label={`Descendre ${name} dans la file`} onClick={() => onChange(moveQueuedProfile(queued, id, 1), scheduledDates)}>Descendre</Button><Button variant="secondary" disabled={!p} onClick={() => onChoose(p)}>Ouvrir le budget de {name}</Button><Button variant="secondary" aria-label={`Retirer ${name} de la file`} onClick={() => onChange(queued.filter(value => value !== id), Object.fromEntries(Object.entries(scheduledDates).filter(([key]) => key !== id)))}>Retirer</Button></div>
      </li>
    })}</ol>
  </section>
}
