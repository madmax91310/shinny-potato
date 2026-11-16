import Button from '../../design-system/Button'
import { EXPENSE_CATEGORIES } from './data.js'
import { MAX_BUDGET_LINES, euro } from './lib.js'
import presets from './manual-presets.json'
import { annualRow, monthlyRow, moveBudgetRow } from './row-input.js'
import { useState } from 'react'
const number = value => value === '' ? null : Number(value)

export default function ParticipantEditor({ profile, edit }) {
  const [preset, setPreset] = useState('')
  function changeRow(key, index, patch) { edit({ [key]: profile[key].map((row, i) => i === index ? { ...row, ...patch } : row) }) }
  function rows(key, title) {
    return <fieldset className="budget-lines"><legend>{title}</legend>
      {profile[key].map((row, index) => <div className="budget-row" key={index}>
        <label>Poste {index + 1}<input aria-label={`${title} · poste ${index + 1}`} maxLength={90} value={row.label} onChange={e => changeRow(key, index, { label: e.target.value })}/></label>
        <label>Montant ({profile.currency || 'EUR'} / mois)<input aria-label={`${title} · montant ${index + 1}`} type="number" min="0" max="10000000" step="0.01" readOnly={!!row.annualProvision} value={row.amount ?? ''} onChange={e => changeRow(key, index, { amount: number(e.target.value) })}/></label>
        <button type="button" className="dca-remove" aria-label={`Retirer ${title.toLowerCase()} ${index + 1}`} onClick={() => edit({ [key]: profile[key].filter((_, i) => i !== index) })}>×</button>
        {key === 'expenses' && <label className="budget-category">Catégorie<select value={row.category || 'other'} onChange={e => changeRow(key, index, { category: e.target.value })}>{EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select></label>}
        <details className="budget-row-options"><summary>Options du poste {index + 1}</summary>
          {key === 'expenses' && <><label>Fréquence<select aria-label={`${title} · fréquence ${index + 1}`} value={row.annualProvision ? 'annual' : 'monthly'} onChange={e => changeRow(key, index, e.target.value === 'annual' ? annualRow(row, row.amount === null ? null : Math.round(row.amount * 1200) / 100) : { ...monthlyRow(row), annualProvision: undefined })}><option value="monthly">Mensuelle</option><option value="annual">Annuelle · provision mensuelle</option></select></label>
            {row.annualProvision && <><label>Montant annuel ({profile.currency || 'EUR'})<input aria-label={`${title} · montant annuel ${index + 1}`} type="number" min="0" max="10000000" step="0.01" value={row.annualProvision.amount ?? ''} onChange={e => changeRow(key, index, annualRow(row, number(e.target.value)))}/></label>
              <p>Provision mensuelle : {euro(row.amount || 0, profile.currency)}. {row.annualProvision.amount !== null && Math.round(row.annualProvision.amount * 100) !== Math.round(row.amount * 100) * 12 && `L’arrondi sur douze mois laisse ${euro((Math.round(row.annualProvision.amount * 100) - Math.round(row.amount * 100) * 12) / 100, profile.currency)} d’écart avec le montant annuel.`}</p></>}
          </>}
          <div className="budget-row-order"><Button variant="secondary" disabled={!index} aria-label={`Monter ${title.toLowerCase()} ${index + 1}`} onClick={() => edit({ [key]: moveBudgetRow(profile[key], index, -1) })}>Monter</Button><Button variant="secondary" disabled={index === profile[key].length - 1} aria-label={`Descendre ${title.toLowerCase()} ${index + 1}`} onClick={() => edit({ [key]: moveBudgetRow(profile[key], index, 1) })}>Descendre</Button></div>
        </details>
      </div>)}
      <Button variant="secondary" disabled={profile[key].length >= MAX_BUDGET_LINES} onClick={() => edit({ [key]: [...profile[key], { label: '', amount: null, ...(key === 'expenses' && { category: 'other' }) }] })}>Ajouter un poste</Button>
      <p className="dca-note">{profile[key].length} / {MAX_BUDGET_LINES} lignes</p>
    </fieldset>
  }
  return <>
          <h2>Le profil de votre abonné</h2>
          <p className="dca-note">Ajoutez ou retirez les lignes nécessaires. Les totaux, le texte et l’image se mettent à jour à partir de votre saisie.</p>
          {profile.provenance?.nature === 'manual-copy' && <details><summary>Origine du modèle copié</summary><p>Vérifiez la présentation et les montants pour cette nouvelle fiche. Les statuts du modèle n’ont pas été copiés.</p><pre className="budget-provenance">{JSON.stringify(profile.provenance.copiedFrom, null, 2)}</pre></details>}
          <label>Prénom ou pseudonyme<input maxLength={70} value={profile.name} onChange={e => edit({ name: e.target.value })}/></label>
          <details><summary>Présentation du profil</summary><div className="dca-fields">
            <label>Âge, facultatif<input type="number" min="18" max="110" value={profile.age ?? ''} onChange={e => edit({ age: number(e.target.value) })}/></label>
            <label>Activité<input maxLength={250} value={profile.job} onChange={e => edit({ job: e.target.value })}/></label>
            <label>Localisation générale<input maxLength={250} value={profile.location} onChange={e => edit({ location: e.target.value })}/></label>
            <label>Situation familiale / logement<input maxLength={250} value={profile.household} onChange={e => edit({ household: e.target.value })}/></label>
            <label>Mois du budget<input maxLength={250} value={profile.period} onChange={e => edit({ period: e.target.value })} placeholder="Octobre 2026"/></label>
            <label>Devise<select aria-label="Devise du budget" value={profile.currency || 'EUR'} onChange={e => edit({ currency: e.target.value })}><option value="EUR">EUR · Euro</option><option value="CHF">CHF · Franc suisse</option></select></label>
            <label>Base des revenus<input maxLength={250} value={profile.incomeBasis} onChange={e => edit({ incomeBasis: e.target.value })}/></label>
          </div><label className="budget-check"><input type="checkbox" checked={profile.approximate} onChange={e => edit({ approximate: e.target.checked })}/>Montants approximatifs</label></details>
          {rows('income', 'Revenus')}
          <details><summary>Ajouter une dépense courante</summary><p>Choisis seulement les postes utiles et vérifie ce que couvrent déjà les enveloppes ou les prises en charge. Aucun montant n’est proposé.</p><label>Poste suggéré<select aria-label="Poste courant à ajouter" value={preset} onChange={e => setPreset(e.target.value)}><option value="">Choisir un poste</option>{presets.map(p => <option key={p.id} value={p.id}>{p.label}{p.annual ? ' · annuel' : ''}</option>)}</select></label><Button variant="secondary" disabled={!preset || profile.expenses.length >= MAX_BUDGET_LINES} onClick={() => { const p = presets.find(p => p.id === preset); const row = { label: p.label, amount: null, category: p.category }; edit({ expenses: [...profile.expenses, p.annual ? annualRow(row, null) : row] }); setPreset('') }}>Ajouter cette dépense</Button></details>
          {rows('expenses', 'Dépenses')}
          <details><summary>Épargne et projets</summary>{rows('savings', 'Épargne prévue')}<p className="dca-note">Ces versements sont retirés du solde. Une simple capacité envisagée reste séparée.</p>
            <label>Capacité d’épargne annoncée, facultative<input type="number" min="0" max="10000000" step="0.01" value={profile.capacity ?? ''} onChange={e => edit({ capacity: number(e.target.value) })}/></label>
          </details>
          <label>Contexte<textarea maxLength={3000} value={profile.context} onChange={e => edit({ context: e.target.value })}/></label>
          <label>Questions pour les lecteurs<textarea aria-label="Questions pour les lecteurs" maxLength={3000} value={profile.question} onChange={e => edit({ question: e.target.value })} placeholder="Une question par ligne"/></label>
          <p className="dca-note">Vos questions sont conservées quand les chiffres changent. Aucune question n’est ajoutée automatiquement.</p>
  </>

}
