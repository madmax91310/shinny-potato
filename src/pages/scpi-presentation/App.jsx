import { useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import Button from '../../design-system/Button'
import { SCPI } from '../../data/scpi.js'
import { buildTweet, dateLabel, format } from './lib.js'
import './style.css'

export default function App() {
  const [id, setId] = useState(SCPI[0]?.id)
  const [draft, setDraft] = useState(null)
  const [message, setMessage] = useState('')
  const record = SCPI.find(row => row.id === id)
  const text = draft ?? (record ? buildTweet(record) : '')
  async function copy() {
    try { await navigator.clipboard.writeText(text); setMessage('Texte copié.') }
    catch { setMessage('Sélectionne le texte dans l’aperçu pour le copier.'); document.querySelector('.scpi-draft')?.focus(); document.querySelector('.scpi-draft')?.select() }
  }
  if (!record) return <p role="alert">Aucune fiche vérifiée n’est disponible pour le moment.</p>
  return <div className="scpi-presentation">
    <PageHeader title="Présentation de SCPI" subtitle="Ce qu’elle détient, ce qu’elle verse et ce qu’elle coûte." />
    <ToolWorkspace actions={<>
      <Button onClick={copy}>Copier le texte</Button>
      <Button variant="secondary" onClick={() => { setDraft(null); setMessage('Texte d’origine rétabli.') }}>Rétablir le texte</Button>
      <span role="status">{message}</span>
    </>}>
      <section className="tool-settings">
        <ChoicePicker aria-label="Choisir une SCPI" value={id} onChange={event => { setId(event.target.value); setDraft(null); setMessage('') }}>
          {SCPI.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
        </ChoicePicker>
        <div className="scpi-evidence">
          <h2>Les données utilisées</h2>
          <p>Sources officielles vérifiées le {dateLabel(record.checkedAt)}.</p>
          <p>Répartition {record.snapshot.asOf ? `au ${dateLabel(record.snapshot.asOf)}` : 'sans date publiée dans les graphiques'}. Prix au {dateLabel(record.price.asOf)}.</p>
          <p><a href={record.sourceUrl} target="_blank" rel="noreferrer">Présentation officielle</a></p>
          <p><a href={record.conditions.sourceUrl} target="_blank" rel="noreferrer">Frais et conditions de souscription</a></p>
          <details><summary>Toute la répartition</summary>
            {['countries', 'sectors'].map(key => <div key={key}><h3>{key === 'countries' ? 'Pays' : 'Secteurs'}</h3><table><thead><tr><th scope="col">Exposition</th><th scope="col">Poids</th></tr></thead><tbody>{[...record.snapshot[key]].sort((a, b) => b.value - a.value).map(row => <tr key={row.label}><th scope="row">{row.label}</th><td>{format(row.value)} %</td></tr>)}</tbody></table></div>)}
            {record.snapshot.sourceUrls.map(url => <p key={url}><a href={url} target="_blank" rel="noreferrer">Source de la répartition</a></p>)}
          </details>
          <details><summary>Comprendre les chiffres</summary>
            <p>Les taux de distribution sont ceux des années civiles terminées, bruts de fiscalité étrangère et nets des frais de gestion de la SCPI. Ils ne mesurent pas la performance totale et ne décrivent pas le revenu personnel après impôts.</p>
            <p>La commission de gestion porte sur les revenus indiqués, pas sur le capital investi. Les commissions d’acquisition et de travaux restent distinctes : {record.conditions.otherFees}</p>
            <p>Les conditions concernent la détention en direct, en pleine propriété. Un contrat d’assurance-vie peut avoir ses propres frais et conditions.</p>
            {record.occupancy && <p>Taux d’occupation financier : {format(record.occupancy.value)} % au {dateLabel(record.occupancy.asOf)}.</p>}
          </details>
        </div>
      </section>
      <section className="tool-preview">
        <label htmlFor="scpi-draft">Ton texte, modifiable avant publication</label>
        <textarea id="scpi-draft" className="scpi-draft" value={text} onChange={event => setDraft(event.target.value)} spellCheck="true" />
        <p className="scpi-length">{text.length.toLocaleString('fr-FR')} caractères · publication longue sur X</p>
      </section>
    </ToolWorkspace>
  </div>
}
