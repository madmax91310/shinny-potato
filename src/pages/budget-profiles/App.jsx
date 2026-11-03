import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import Button from '../../design-system/Button'
import { copyPublicationText } from '../../design-system/publicationActions.js'
import { BUDGET_PROFILES } from './data.js'
import { analyzeBudget, budgetPublicPresentation, blankBudget, compareBudgetRecency, matchesBudgetFilters, budgetDisplayName, budgetKind, buildBudgetText, euro, refreshBudgetDraft } from './lib.js'
import { budgetFinancialReference, staleBudgetText } from './completion.js'
import { findSavedDraft, loadSavedDrafts, loadDraft, loadPublished, loadQueued, loadUsage, saveDraft, savePublished, saveQueued, saveUsage, WORKSPACE_KEY } from './storage.js'
import PublicationStatus from './PublicationStatus.jsx'
import { useBudgetImage } from './useBudgetImage.js'
import '../dca-profiles/dca-profiles.css'
import './budget-profiles.css'

const profiles = [...BUDGET_PROFILES].sort(compareBudgetRecency)
const BackupPanel = lazy(() => import('./BackupPanel.jsx'))
const SourceEvidencePanel = lazy(() => import('./SourceEvidencePanel.jsx'))
const ParticipantEditor = lazy(() => import('./ParticipantEditor.jsx'))

export default function App() {
  const [initial] = useState(() => {
    const loaded = loadDraft({ profile: profiles[0], text: buildBudgetText(profiles[0]), edited: false })
    return { ...loaded, value: refreshBudgetDraft(loaded.value) }
  })
  const [record, setRecord] = useState(initial.value)
  const { profile, text, edited } = record
  const money = value => euro(value, profile.currency)
  const [usageInitial] = useState(loadUsage), [used, setUsed] = useState(usageInitial.value)
  const [publishedInitial] = useState(loadPublished), [published, setPublished] = useState(publishedInitial.value)
  const [publicationDates, setPublicationDates] = useState(publishedInitial.dates)
  const [queuedInitial] = useState(loadQueued), [queued, setQueued] = useState(queuedInitial.value)
  const [saved, setSaved] = useState(loadSavedDrafts)
  const [filters, setFilters] = useState({ country: '', income: '', family: '', children: '', housing: '' })
  const [imageMode, setImageMode] = useState('detailed'), [backupOpen, setBackupOpen] = useState(false)
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [hidePublished, setHidePublished] = useState(false)
  const [unused, setUnused] = useState(false), [query, setQuery] = useState(''), [feedback, setFeedback] = useState('')
  const memoryDrafts = useRef(new Map(loadSavedDrafts().map(d => [d.profile.id, d])))
  const seen = useRef(new Set([profile.id]))
  const [approved, setApproved] = useState(false)
  useEffect(() => {
    memoryDrafts.current.set(record.profile.id, record)
    setSaved([...new Map([...loadSavedDrafts(), ...memoryDrafts.current.values()].map(d => [d.profile.id, d])).values()])
    if (!saveDraft(record)) setFeedback('Brouillon en mémoire : le stockage est indisponible, illisible ou modifié dans un autre onglet. Les données précédentes sont conservées.')
  }, [record])
  useEffect(() => {
    const changed = event => { if (event.key === WORKSPACE_KEY) setFeedback('Les données ont changé dans un autre onglet. Recharge la page après avoir conservé ton texte en cours.') }
    window.addEventListener('storage', changed); return () => window.removeEventListener('storage', changed)
  }, [])
  const a = analyzeBudget(profile), image = useBudgetImage(profile, !a.errors.length, imageMode)
  const prepared = profile.kind !== 'participant'
  const filtered = profiles.filter(p => matchesBudgetFilters(p, filters) && (!unused || !used.includes(p.id)) && (!hidePublished || !published.includes(p.id)) &&
    `${budgetDisplayName(p)} ${p.name} ${p.job} ${p.household} ${p.period} ${p.source.publisher} ${analyzeBudget(p).income}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr').trim()))
  function update(next) { setApproved(false); setRecord(current => ({ ...current, profile: next, text: current.edited ? current.text : buildBudgetText(next), textFinance: current.edited ? current.textFinance : budgetFinancialReference(next) })); setFeedback('') }
  function edit(patch) { update({ ...profile, ...patch }) }
  function choose(next) {
    if (!next) return
    const p = structuredClone(next); setApproved(false); setRecord(refreshBudgetDraft(memoryDrafts.current.get(p.id) || findSavedDraft(p.id) || { profile: p, text: buildBudgetText(p), edited: false })); seen.current.add(p.id); setFeedback('')
  }
  function random() {
    let pool = filtered.filter(p => p.id !== profile.id && !seen.current.has(p.id))
    if (!pool.length) { seen.current = new Set([profile.id]); pool = filtered.filter(p => p.id !== profile.id) }
    choose(pool[Math.floor(Math.random() * pool.length)])
  }
  function adapt() {
    const p = { ...structuredClone(profile), id: `participation-${crypto.randomUUID()}`, name: budgetDisplayName(profile), kind: 'participant', source: null, publishedAt: null, checkedAt: null,
      incomeNote: '', context: '', caveat: '', hook: '', question: 'Quel poste pèse le plus dans ton budget ?' }
    choose(p)
  }
  function toggleUsed() {
    const next = used.includes(profile.id) ? used.filter(id => id !== profile.id) : [...used, profile.id]
    if (saveUsage(next)) { setUsed(next); setFeedback('Historique mis à jour.') }
    else setFeedback('L’historique n’a pas pu être enregistré. Les données précédentes sont conservées.')
  }
  function markPublished(checked, date = null) {
    const next = checked ? [...new Set([...published, profile.id])] : published.filter(id => id !== profile.id)
    const dates = { ...publicationDates, [profile.id]: date }
    if (savePublished(next, dates)) { setPublished(next); setPublicationDates(dates); setFeedback(checked ? 'Publication déclarée enregistrée.' : 'Statut publié retiré.'); return true }
    setFeedback('Le statut publié n’a pas pu être enregistré. Le suivi précédent est conservé.'); return false
  }
  function markQueued(checked) {
    const next = checked ? [...new Set([...queued, profile.id])] : queued.filter(id => id !== profile.id)
    if (saveQueued(next)) { setQueued(next); setFeedback('Statut à publier prochainement mis à jour.') }
    else setFeedback('Le statut n’a pas pu être enregistré. Les données précédentes sont conservées.')
  }
  function restored() {
    memoryDrafts.current = new Map(loadSavedDrafts().map(d => [d.profile.id, d]))
    setRecord(refreshBudgetDraft(loadDraft(record).value)); setUsed(loadUsage().value); setPublished(loadPublished().value); setPublicationDates(loadPublished().dates); setQueued(loadQueued().value); setSaved(loadSavedDrafts())
  }
  function filter(key, title, options) {
    return <label>{title}<ChoicePicker aria-label={title} value={filters[key]} onChange={e => setFilters({ ...filters, [key]: e.target.value })}><option value="">Tous</option>{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</ChoicePicker></label>
  }
  async function copy(value) { try { await copyPublicationText(value); setFeedback('Texte copié.') } catch { setFeedback('Copie impossible. Sélectionne le texte.') } }
  return <div className="dca-profiles-scope dca-simple budget-profiles-scope">
    <PageHeader title="Le budget de…" subtitle="Choisis un budget public sourcé ou prépare une participation, puis récupère le texte et l’image."/>
    {(!initial.readable || !usageInitial.readable || !publishedInitial.readable || !queuedInitial.readable) && <p role="alert">Un ancien enregistrement local est illisible. Il est conservé sans modification.</p>}
    <details className="dca-simple-card" onToggle={e => { if (e.currentTarget.open) setBackupOpen(true) }}><summary>Brouillons et transfert entre appareils</summary>
      {saved.length > 0 && <label>Reprendre un brouillon<ChoicePicker aria-label="Reprendre un brouillon" value={saved.some(d => d.profile.id === profile.id) ? profile.id : ''} onChange={e => { const draft = memoryDrafts.current.get(e.target.value) || findSavedDraft(e.target.value); if (draft) { setRecord(refreshBudgetDraft(draft)); setApproved(false) } }}><option value="">Choisir un brouillon</option>{saved.map(d => <option key={d.profile.id} value={d.profile.id}>{budgetDisplayName(d.profile)}{d.edited ? ' · personnalisé' : ''}</option>)}</ChoicePicker></label>}
      {backupOpen && <Suspense fallback={<p>Chargement…</p>}><BackupPanel drafts={saved} record={record} onRestored={restored}/></Suspense>}
    </details>
    <div className="dca-simple-grid">
      <section className="dca-simple-card" aria-label="Composer le budget">
        <div className="dca-mode"><button aria-pressed={prepared} onClick={() => choose(profiles[0])}>Profils sourcés</button><button aria-pressed={!prepared} onClick={() => choose({ ...blankBudget(), id: `participation-${crypto.randomUUID()}` })}>Créer une participation</button></div>
        {prepared && <>
          <label>Rechercher un profil<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Profil, revenu, mois…"/></label>
          <details><summary>Filtrer les profils</summary><div className="budget-filters">
            {filter('country', 'Pays de résidence', [...new Set(profiles.map(p => p.country).filter(Boolean))].sort().map(c => [c, c]).concat([['unknown', 'Non renseigné']]))}
            {filter('income', 'Ressources mensuelles par devise', ['EUR', 'CHF'].flatMap(c => [[0,1500],[1500,2500],[2500,4000],[4000,7000],[7000,Infinity]].map(([min,max]) => [`${c}:${min}:${max}`, `${min.toLocaleString('fr-FR')}${max === Infinity ? ' et plus' : ` à moins de ${max.toLocaleString('fr-FR')}`} ${c}`])))}
            {filter('family', 'Configuration du foyer', [['single','Personne seule'],['couple','Couple'],['other','Autre configuration'],['unknown','Non renseignée']])}
            {filter('children', 'Enfants au foyer', [['yes','Avec enfants'],['no','Sans enfants'],['unknown','Non renseigné']])}
            {filter('housing', 'Logement', [['tenant','Locataire'],['owner','Propriétaire'],['other','Autre situation'],['unknown','Non renseigné']])}
          </div><p className="dca-note">Les tranches EUR et CHF sont séparées, sans conversion. Une information absente reste non renseignée.</p><Button variant="secondary" onClick={() => setFilters({ country: '', income: '', family: '', children: '', housing: '' })}>Effacer les filtres</Button></details>
          <label className="budget-check"><input type="checkbox" checked={unused} onChange={e => setUnused(e.target.checked)}/>Masquer les profils déjà utilisés</label>
          <label className="budget-check"><input type="checkbox" checked={hidePublished} onChange={e => setHidePublished(e.target.checked)}/>Masquer les profils publiés</label>
          <p className="dca-note">{filtered.length} profil{filtered.length > 1 ? 's' : ''} · {profiles.filter(p => published.includes(p.id)).length} publié(s) · triés par période du budget</p>
          {filtered.length ? <ChoicePicker aria-label="Choisir un profil budget" value={profile.id} onChange={e => choose(filtered.find(p => p.id === e.target.value))}>
            {filtered.map(p => <option key={p.id} value={p.id}>{budgetDisplayName(p)} · {euro(analyzeBudget(p).income, p.currency)} · {p.period}{published.includes(p.id) ? ' · publié' : ''}{used.includes(p.id) ? ' · utilisé' : ''}{queued.includes(p.id) ? ' · à publier prochainement' : ''}</option>)}
          </ChoicePicker> : <p role="status">Aucun profil ne correspond. Le budget ouvert reste affiché.</p>}
          <div className="dca-buttons"><Button variant="secondary" disabled={!filtered.some(p => p.id !== profile.id)} onClick={random}>Autre profil aléatoire</Button><Button variant="secondary" onClick={toggleUsed}>{used.includes(profile.id) ? 'Marquer non utilisé' : 'Marquer utilisé'}</Button></div>
          <h2>{budgetDisplayName(profile)}</h2>

          <p>{[budgetPublicPresentation(profile).job, budgetPublicPresentation(profile).household, profile.location].filter(Boolean).join(' · ')}</p>
          <p>{budgetKind(profile)} · {profile.period}{profile.approximate && ' · montants approximatifs'}</p>

          <dl className="budget-breakdown"><div><dt>Revenus mensuels</dt><dd>{money(a.income)}</dd></div>{profile.expenses.map((row, i) => <div key={i}><dt>{row.label}</dt><dd>{money(row.amount)}</dd></div>)}</dl>

          <Button variant="secondary" onClick={adapt}>Adapter ce budget</Button>
        </>}
        {!prepared && <Suspense fallback={<p>Chargement de la participation…</p>}><ParticipantEditor profile={profile} edit={edit}/></Suspense>}
        {!!a.errors.length && <div className="dca-errors" role="alert">{a.errors.map(error => <p key={error}>{error}</p>)}</div>}
        {!a.errors.length && <dl className="budget-totals"><div><dt>Dépenses</dt><dd>{money(a.expenses)}</dd></div><div><dt>{a.available < 0 ? 'Déficit avant versements' : 'Reste avant versements'}</dt><dd>{money(a.available)}</dd></div>{!!profile.savings.length && <div><dt>Reste disponible après versements</dt><dd>{money(a.balance)}</dd></div>}</dl>}
        {profile.source && <details className="dca-evidence" onToggle={e => { if (e.currentTarget.open) setEvidenceOpen(true) }}><summary>Source et vérification du profil</summary>
          {evidenceOpen && <Suspense fallback={<p>Chargement de la vérification…</p>}><SourceEvidencePanel profile={profile} onCopy={copy}/></Suspense>}
        </details>}
      </section>
      <div className="dca-publication-column">
        <section className="dca-simple-card dca-simple-preview" aria-label="Image du budget" aria-busy={image.busy}>
          <h2>Mon aperçu</h2><label>Version de l’image<ChoicePicker aria-label="Version de l’image" value={imageMode} onChange={e => setImageMode(e.target.value)}><option value="detailed">Détaillée</option><option value="summary">Synthétique</option></ChoicePicker></label><p className="dca-note">La synthèse regroupe les dépenses par catégorie ; tous les postes restent accessibles dans la version détaillée. Les totaux sont identiques.</p>
          {image.url ? <img src={image.url} alt={`Le budget de ${profile.name} : revenus, dépenses et reste avant épargne`}/> : <p>{a.errors.length ? 'Complète le budget pour préparer l’image.' : 'Préparation de l’image…'}</p>}
          <div className="dca-export-actions"><Button disabled={!image.url} onClick={() => { try { image.download(`budget-${profile.id}-${imageMode}.png`); setFeedback('Téléchargement lancé.') } catch { setFeedback('L’image n’est pas encore disponible.') } }}>Télécharger le PNG</Button>
            {image.url && <a href={image.url} target="_blank" rel="noreferrer">Ouvrir l’image</a>}
            {image.error && <Button variant="secondary" onClick={image.retry}>Réessayer l’image</Button>}
          </div><p role="status">{image.error || (image.busy ? 'Préparation de l’image…' : '')}</p>
        </section>
        <section className="dca-simple-card dca-text-card">
          <label htmlFor="budget-draft">Texte prêt à publier</label><textarea id="budget-draft" maxLength={20000} value={text} onChange={e => { setApproved(false); setRecord({ ...record, text: e.target.value, edited: true }) }}/>
          {staleBudgetText(record) && <div className="dca-errors" role="alert"><p>Les montants du budget ont changé. Votre texte personnalisé est conservé, mais il peut encore afficher les anciens chiffres. « Rétablir le texte » le régénère volontairement.</p><Button variant="secondary" onClick={() => setRecord({ ...record, textFinance: budgetFinancialReference(profile) })}>J’ai vérifié les montants de mon texte</Button></div>}
          <div className="dca-buttons"><Button disabled={!text.trim() || !!a.errors.length} onClick={() => copy(text)}>Copier le texte</Button><Button variant="secondary" onClick={() => { setApproved(false); setRecord({ ...record, text: buildBudgetText(profile), edited: false, textFinance: budgetFinancialReference(profile) }) }}>Rétablir le texte</Button></div>
          <PublicationStatus key={profile.id} published={published.includes(profile.id)} date={publicationDates[profile.id] ?? null} onSave={markPublished}/>
          <label className="budget-check"><input type="checkbox" checked={queued.includes(profile.id)} onChange={e => markQueued(e.target.checked)}/>À publier prochainement</label><p className="dca-note">Trois statuts indépendants, enregistrés manuellement dans ce navigateur.</p>
          {edited && <p className="dca-note">Texte personnalisé conservé. « Rétablir le texte » reprend les chiffres du budget.</p>}
          {!prepared && <label className="budget-check"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)}/>La personne a validé les informations à publier.</label>}
          {!prepared && !approved && <p className="dca-note">Participation à faire valider avant publication.</p>}
          <p role="status" aria-live="polite">{feedback}</p>
        </section>
      </div>
    </div>
  </div>
}
