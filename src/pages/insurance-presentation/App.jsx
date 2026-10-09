import { useCallback, useState } from 'react'
import { usePresentationDraft } from '../presentation-shared/drafts.jsx'
import { renderPresentationImage } from '../presentation-shared/imageExport.js'
import { downloadImage } from '../../design-system/downloadImage.js'
import PageHeader from '../../design-system/PageHeader'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import Button from '../../design-system/Button'
import { INSURANCE } from '../../data/insurance.js'
import { dateLabel, format, annualPublicationNote } from '../scpi-presentation/lib.js'
import { buildTweet, fundReturn, fundGuarantee, fundAllocation, fundOperations, fundCeiling } from './lib.js'
import '../scpi-presentation/style.css'

export default function App({ embedded = false }) {
  const [id, setId, draft, setDraft] = usePresentationDraft('insurance', INSURANCE[0]?.id)
  const [message, setMessage] = useState('')
  const record = INSURANCE.find(row => row.id === id)
  const text = draft ?? (record ? buildTweet(record) : '')
  const [exporting, setExporting] = useState(false)
  const renderImage = useCallback(() => renderPresentationImage(record, 'insurance'), [record])
  async function exportImage() {
    setExporting(true)
    try { downloadImage(await renderImage(), `${record.id}-epargnant-libre.png`); setMessage('Image téléchargée.') }
    catch (error) { setMessage(error.message || 'Impossible de télécharger l’image.') }
    finally { setExporting(false) }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(text); setMessage('Texte copié.') }
    catch { setMessage('Sélectionne le texte dans l’aperçu pour le copier.'); document.querySelector('#insurance-draft')?.select() }
  }
  if (!record) return <p role="alert">Aucun contrat vérifié n’est disponible pour le moment.</p>
  return <div className="scpi-presentation insurance-presentation">
    {!embedded && <PageHeader title="Présentation d’assurance-vie" subtitle="Les supports du contrat, leurs conditions et les frais." />}
    <ToolWorkspace renderImage={renderImage} imageAlt={`Visuel de ${record.name}`} actions={<>
      <Button onClick={copy}>Copier le texte</Button>
      <Button onClick={exportImage} disabled={exporting}>{exporting ? 'Préparation…' : 'Télécharger l’image'}</Button>
      <Button variant="secondary" onClick={() => { setDraft(null); setMessage('Texte d’origine rétabli.') }}>Rétablir le texte</Button>
      <span role="status">{message}</span>
    </>}>
      <section className="tool-settings">
        <ChoicePicker aria-label="Choisir une assurance-vie" value={id} onChange={event => { setId(event.target.value); setMessage('') }}>
          {INSURANCE.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
        </ChoicePicker>
        <div className="scpi-evidence">
          <h2>Les données utilisées</h2>
          <p>Sources officielles vérifiées le {dateLabel(record.checkedAt)}. Les frais et conditions sont ceux observés sur ces pages ; leur date d’effet n’y est pas toujours précisée.</p>
          <p><a href={record.sourceUrl} target="_blank" rel="noreferrer">Présentation officielle du contrat</a></p>
          <details><summary>Les fonds euros et leurs conditions</summary>
            {record.euroFunds.map(fund => <section key={fund.name}>
              <h3>{fund.name}</h3>
              <table className="insurance-return-history"><thead><tr><th>Année</th><th>Rendement net de gestion</th></tr></thead><tbody>{fund.years.map(row => <tr key={row.year}><th scope="row">{row.year}</th><td>{fundReturn(row)}</td></tr>)}</tbody></table>
              {fund.years.filter(row => row.tiers).map(row => <details key={row.year} className="insurance-rate-tiers"><summary>Barème de rendement {row.year}</summary>
                <table><thead><tr><th>Encours du contrat</th><th>Part d’unités de compte</th><th>Rendement</th></tr></thead><tbody>{row.tiers.map((tier, index) => <tr key={index}><td>{tier.encours}</td><td>{tier.condition}</td><td>{format(tier.return)} %</td></tr>)}</tbody></table>
              </details>)}
              {annualPublicationNote(fund.publication) && <p>{annualPublicationNote(fund.publication)}</p>}
              <p>Avant prélèvements sociaux et fiscaux ; historique publié disponible, sans bonus commercial.</p>
              <p>{fundGuarantee(fund)} Frais de gestion : {format(fund.managementFeeMax)} % maximum/an.</p>
              <p>{fundAllocation(fund)} {fundOperations(fund)}</p>
              {fundCeiling(fund) && <p>{fundCeiling(fund)}</p>}
              {fund.notes && <p>{fund.notes}</p>}
              {(fund.sourceUrls ?? [fund.sourceUrl]).map(url => <p key={url}><a href={url} target="_blank" rel="noreferrer">Source et conditions du fonds</a></p>)}
            </section>)}
          </details>
          <details><summary>Comprendre les frais</summary>
            <p>La gestion des unités de compte porte sur leur valeur, et les frais internes des supports s’ajoutent. Les frais de transaction ETF s’appliquent aux opérations concernées.</p>
            <p>Les rendements des fonds euros sont déjà nets de leurs frais de gestion : ces frais ne doivent pas être soustraits une seconde fois.</p>
            {record.fees.notes && <p>{record.fees.notes}</p>}
            {(record.fees.sourceUrls ?? [record.fees.sourceUrl]).map(url => <p key={url}><a href={url} target="_blank" rel="noreferrer">Source des frais</a></p>)}
            <p>Cette fiche concerne la gestion libre. Les mandats de gestion, garanties optionnelles et supports immobiliers peuvent prévoir des conditions supplémentaires.</p>
          </details>
        </div>
      </section>
      <section className="tool-preview">
        <label htmlFor="insurance-draft">Ton texte, modifiable avant publication</label>
        <textarea id="insurance-draft" className="scpi-draft" value={text} onChange={event => setDraft(event.target.value)} spellCheck="true" />
        <p className="scpi-length">{text.length.toLocaleString('fr-FR')} caractères · publication longue sur X</p>
      </section>
    </ToolWorkspace>
  </div>
}
