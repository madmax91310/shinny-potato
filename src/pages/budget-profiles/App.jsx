import { useEffect, useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import Button from '../../design-system/Button'
import { copyPublicationText } from '../../design-system/publicationActions.js'
import { BUDGET_PROFILES, EXPENSE_CATEGORIES } from './data.js'
import { analyzeBudget, blankBudget, budgetKind, buildBudgetText, dateLabel, euro, MAX_BUDGET_LINES, sourceReply } from './lib.js'
import { loadDraft, loadUsage, saveDraft, saveUsage } from './storage.js'
import { useBudgetImage } from './useBudgetImage.js'
import '../dca-profiles/dca-profiles.css'
import './budget-profiles.css'

const profiles = [...BUDGET_PROFILES].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
const number = value => value === '' ? null : Number(value)

export default function App() {
  const [initial] = useState(() => loadDraft({ profile: profiles[0], text: buildBudgetText(profiles[0]), edited: false }))
  const [record, setRecord] = useState(initial.value)
  const { profile, text, edited } = record
  const [usageInitial] = useState(loadUsage), [used, setUsed] = useState(usageInitial.value)
  const [unused, setUnused] = useState(false), [query, setQuery] = useState(''), [feedback, setFeedback] = useState('')
  const seen = useRef(new Set([profile.id]))
  const [approved, setApproved] = useState(false)
  useEffect(() => { if (!saveDraft(record)) setFeedback('Le brouillon précédent est conservé : l’enregistrement local est indisponible ou illisible.') }, [record])
  const a = analyzeBudget(profile), image = useBudgetImage(profile, !a.errors.length)
  const prepared = profile.kind !== 'participant'
  const filtered = profiles.filter(p => (!unused || !used.includes(p.id)) &&
    `${p.name} ${p.job} ${p.household} ${p.period} ${p.source.publisher} ${analyzeBudget(p).income}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr').trim()))
  function update(next) { setApproved(false); setRecord(current => ({ profile: next, text: current.edited ? current.text : buildBudgetText(next), edited: current.edited })); setFeedback('') }
  function edit(patch) { update({ ...profile, ...patch }) }
  function choose(next) {
    if (!next) return
    const p = structuredClone(next); setApproved(false); setRecord({ profile: p, text: buildBudgetText(p), edited: false }); seen.current.add(p.id); setFeedback('')
  }
  function random() {
    let pool = filtered.filter(p => p.id !== profile.id && !seen.current.has(p.id))
    if (!pool.length) { seen.current = new Set([profile.id]); pool = filtered.filter(p => p.id !== profile.id) }
    choose(pool[Math.floor(Math.random() * pool.length)])
  }
  function adapt() {
    const p = { ...structuredClone(profile), id: 'participation', kind: 'participant', source: null, publishedAt: null, checkedAt: null,
      incomeNote: '', context: '', caveat: '', hook: '', question: 'Quel poste pèse le plus dans ton budget ?' }
    choose(p)
  }
  function toggleUsed() {
    const next = used.includes(profile.id) ? used.filter(id => id !== profile.id) : [...used, profile.id]
    if (saveUsage(next)) { setUsed(next); setFeedback('Historique mis à jour.') }
    else setFeedback('L’historique n’a pas pu être enregistré. Les données précédentes sont conservées.')
  }
  async function copy(value) { try { await copyPublicationText(value); setFeedback('Texte copié.') } catch { setFeedback('Copie impossible. Sélectionne le texte.') } }
  function changeRow(key, index, patch) { edit({ [key]: profile[key].map((row, i) => i === index ? { ...row, ...patch } : row) }) }
  function rows(key, title) {
    return <fieldset className="budget-lines"><legend>{title}</legend>
      {profile[key].map((row, index) => <div className="budget-row" key={index}>
        <label>Poste {index + 1}<input aria-label={`${title} · poste ${index + 1}`} maxLength={90} value={row.label} onChange={e => changeRow(key, index, { label: e.target.value })}/></label>
        <label>Montant (€ / mois)<input aria-label={`${title} · montant ${index + 1}`} type="number" min="0" max="10000000" step="0.01" value={row.amount ?? ''} onChange={e => changeRow(key, index, { amount: number(e.target.value) })}/></label>
        <button type="button" className="dca-remove" aria-label={`Retirer ${title.toLowerCase()} ${index + 1}`} onClick={() => edit({ [key]: profile[key].filter((_, i) => i !== index) })}>×</button>
        {key === 'expenses' && <label className="budget-category">Catégorie<select value={row.category || 'other'} onChange={e => changeRow(key, index, { category: e.target.value })}>{EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>}
      </div>)}
      <Button variant="secondary" disabled={profile[key].length >= MAX_BUDGET_LINES} onClick={() => edit({ [key]: [...profile[key], { label: '', amount: null, ...(key === 'expenses' && { category: 'other' }) }] })}>Ajouter un poste</Button>
    </fieldset>
  }
  return <div className="dca-profiles-scope dca-simple budget-profiles-scope">
    <PageHeader title="Le budget de…" subtitle="Choisis un budget public sourcé ou prépare une participation, puis récupère le texte et l’image."/>
    {(!initial.readable || !usageInitial.readable) && <p role="alert">Un ancien enregistrement local est illisible. Il est conservé sans modification.</p>}
    <div className="dca-simple-grid">
      <section className="dca-simple-card" aria-label="Composer le budget">
        <div className="dca-mode"><button aria-pressed={prepared} onClick={() => choose(profiles[0])}>Profils sourcés</button><button aria-pressed={!prepared} onClick={() => choose(blankBudget())}>Créer une participation</button></div>
        {prepared && <>
          <label>Rechercher un profil<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Profil, revenu, mois…"/></label>
          <label className="budget-check"><input type="checkbox" checked={unused} onChange={e => setUnused(e.target.checked)}/>Masquer les profils déjà utilisés</label>
          <p className="dca-note">{filtered.length} profil{filtered.length > 1 ? 's' : ''} · du plus récent au plus ancien</p>
          {filtered.length ? <ChoicePicker aria-label="Choisir un profil budget" value={profile.id} onChange={e => choose(filtered.find(p => p.id === e.target.value))}>
            {filtered.map(p => <option key={p.id} value={p.id}>{p.name} · {euro(analyzeBudget(p).income)} · {p.period}{used.includes(p.id) ? ' · utilisé' : ''}</option>)}
          </ChoicePicker> : <p role="status">Aucun profil ne correspond. Le budget ouvert reste affiché.</p>}
          <div className="dca-buttons"><Button variant="secondary" disabled={!filtered.some(p => p.id !== profile.id)} onClick={random}>Autre profil aléatoire</Button><Button variant="secondary" onClick={toggleUsed}>{used.includes(profile.id) ? 'Marquer non utilisé' : 'Marquer utilisé'}</Button></div>
          <h2>{profile.name}</h2>
          <p>{[profile.job, profile.household, profile.location].filter(Boolean).join(' · ')}</p>
          <p>{budgetKind(profile)} · {profile.period}{profile.approximate && ' · montants approximatifs'}</p>
          <p>{profile.incomeNote}</p>
          <dl className="budget-breakdown"><div><dt>Revenus mensuels</dt><dd>{euro(a.income)}</dd></div>{profile.expenses.map((row, i) => <div key={i}><dt>{row.label}</dt><dd>{euro(row.amount)}</dd></div>)}</dl>
          <p>{profile.context}</p>
          <Button variant="secondary" onClick={adapt}>Adapter ce budget</Button>
        </>}
        {!prepared && <>
          <label>Prénom ou pseudonyme<input maxLength={70} value={profile.name} onChange={e => edit({ name: e.target.value })}/></label>
          <details><summary>Présentation du profil</summary><div className="dca-fields">
            <label>Âge, facultatif<input type="number" min="18" max="110" value={profile.age ?? ''} onChange={e => edit({ age: number(e.target.value) })}/></label>
            <label>Activité<input maxLength={250} value={profile.job} onChange={e => edit({ job: e.target.value })}/></label>
            <label>Localisation générale<input maxLength={250} value={profile.location} onChange={e => edit({ location: e.target.value })}/></label>
            <label>Situation familiale / logement<input maxLength={250} value={profile.household} onChange={e => edit({ household: e.target.value })}/></label>
            <label>Mois du budget<input maxLength={250} value={profile.period} onChange={e => edit({ period: e.target.value })} placeholder="Octobre 2026"/></label>
            <label>Base des revenus<input maxLength={250} value={profile.incomeBasis} onChange={e => edit({ incomeBasis: e.target.value })}/></label>
          </div><label className="budget-check"><input type="checkbox" checked={profile.approximate} onChange={e => edit({ approximate: e.target.checked })}/>Montants approximatifs</label></details>
          {rows('income', 'Revenus')}{rows('expenses', 'Dépenses')}
          <details><summary>Épargne et projets</summary>{rows('savings', 'Épargne prévue')}<p className="dca-note">Ces versements sont retirés du solde. Une simple capacité envisagée reste séparée.</p>
            <label>Capacité d’épargne annoncée, facultative<input type="number" min="0" max="10000000" step="0.01" value={profile.capacity ?? ''} onChange={e => edit({ capacity: number(e.target.value) })}/></label>
          </details>
          <label>Contexte<textarea maxLength={3000} value={profile.context} onChange={e => edit({ context: e.target.value })}/></label>
        </>}
        {!!a.errors.length && <div className="dca-errors" role="alert">{a.errors.map(error => <p key={error}>{error}</p>)}</div>}
        {!a.errors.length && <dl className="budget-totals"><div><dt>Dépenses</dt><dd>{euro(a.expenses)}</dd></div><div><dt>{a.available < 0 ? 'Déficit avant épargne' : 'Reste avant épargne'}</dt><dd>{euro(a.available)}</dd></div>{!!profile.savings.length && <div><dt>Solde après épargne prévue</dt><dd>{euro(a.balance)}</dd></div>}</dl>}
        {profile.source && <details className="dca-evidence"><summary>Source et vérification du profil</summary>
          <a href={profile.source.url} target="_blank" rel="noreferrer">{profile.source.publisher} · {profile.source.title}</a>
          <p>Publié le {dateLabel(profile.publishedAt)}. Consulté le {dateLabel(profile.checkedAt)}.</p>
          <p>Budget autodéclaré, sans accès aux comptes bancaires. Les postes groupés et les arrondis sont conservés.</p><p>{profile.caveat}</p>
          <Button variant="secondary" onClick={() => copy(sourceReply(profile))}>Copier la source pour une réponse</Button>
        </details>}
      </section>
      <div className="dca-publication-column">
        <section className="dca-simple-card dca-simple-preview" aria-label="Image du budget" aria-busy={image.busy}>
          <h2>Mon aperçu</h2>
          {image.url ? <img src={image.url} alt={`Le budget de ${profile.name} : revenus, dépenses et reste avant épargne`}/> : <p>{a.errors.length ? 'Complète le budget pour préparer l’image.' : 'Préparation de l’image…'}</p>}
          <div className="dca-export-actions"><Button disabled={!image.url} onClick={() => { try { image.download(`budget-${profile.id}.png`); setFeedback('Téléchargement lancé.') } catch { setFeedback('L’image n’est pas encore disponible.') } }}>Télécharger le PNG</Button>
            {image.url && <a href={image.url} target="_blank" rel="noreferrer">Ouvrir l’image</a>}
            {image.error && <Button variant="secondary" onClick={image.retry}>Réessayer l’image</Button>}
          </div><p role="status">{image.error || (image.busy ? 'Préparation de l’image…' : '')}</p>
        </section>
        <section className="dca-simple-card dca-text-card">
          <label htmlFor="budget-draft">Texte prêt à publier</label><textarea id="budget-draft" maxLength={20000} value={text} onChange={e => { setApproved(false); setRecord({ ...record, text: e.target.value, edited: true }) }}/>
          <div className="dca-buttons"><Button disabled={!text.trim() || !!a.errors.length} onClick={() => copy(text)}>Copier le texte</Button><Button variant="secondary" onClick={() => { setApproved(false); setRecord({ ...record, text: buildBudgetText(profile), edited: false }) }}>Rétablir le texte</Button></div>
          {edited && <p className="dca-note">Texte personnalisé conservé. « Rétablir le texte » reprend les chiffres du budget.</p>}
          {!prepared && <label className="budget-check"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)}/>La personne a validé les informations à publier.</label>}
          {!prepared && !approved && <p className="dca-note">Participation à faire valider avant publication.</p>}
          <p role="status" aria-live="polite">{feedback}</p>
        </section>
      </div>
    </div>
  </div>
}
