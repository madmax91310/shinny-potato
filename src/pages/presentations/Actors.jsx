import { useState } from 'react'
import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import Button from '../../design-system/Button'
import { downloadImage } from '../../design-system/downloadImage.js'
import { PRESENTATION_ACTORS, applyActorOffer, buildActorTweet } from '../../data/presentation-actors.js'
import { usePresentationDraft } from '../presentation-shared/drafts.jsx'
import { renderPresentationImage } from '../presentation-shared/imageExport.js'
import { dateLabel } from '../scpi-presentation/lib.js'
export default function Actors({ family }) {
  const records = PRESENTATION_ACTORS.filter(row => row.family === family)
  const [id, setId, draft, setDraft] = usePresentationDraft(family, records[0].id)
  const actor = records.find(row => row.id === id.split(':')[0])
  const record = applyActorOffer(actor, id.split(':')[1] ?? actor.offers[0]?.id)
  const text = draft ?? buildActorTweet(record)
  const [message, setMessage] = useState('')
  const [exporting, setExporting] = useState(false)
  const renderImage = () => renderPresentationImage(record, 'actor')
  async function copy() {
    try { await navigator.clipboard.writeText(text); setMessage('Texte copié.') }
    catch { document.querySelector('#actor-draft')?.select(); setMessage('Sélectionne le texte pour le copier.') }
  }
  async function download() {
    setExporting(true)
    try { downloadImage(await renderImage(), `${record.id}${record.selectedOffer.id === actor.offers[0].id ? '' : '-'+record.selectedOffer.id}-epargnant-libre.png`); setMessage('Image téléchargée.') }
    catch (error) { setMessage(error.message || 'Impossible de télécharger l’image.') }
    finally { setExporting(false) }
  }
  return <div className="scpi-presentation actor-presentation">
    <ToolWorkspace renderImage={renderImage} imageAlt={`Visuel de ${record.name}`} actions={<>
      <Button onClick={copy}>Copier le texte</Button>
      <Button onClick={download} disabled={exporting}>{exporting ? 'Préparation…' : 'Télécharger l’image'}</Button>
      <Button variant="secondary" onClick={() => { setDraft(null); setMessage('Texte d’origine rétabli.') }}>Rétablir le texte</Button>
      <span role="status">{message}</span>
    </>}>
      <section className="tool-settings">
        <ChoicePicker aria-label="Choisir un acteur" value={actor.id} onChange={event => { setId(event.target.value); setMessage('') }}>
          {records.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}
        </ChoicePicker>
        {actor.offers.length > 1 && <ChoicePicker aria-label="Choisir une offre" value={record.selectedOffer.id} onChange={event => { setId(event.target.value === actor.offers[0].id ? actor.id : `${actor.id}:${event.target.value}`); setMessage('') }}>
          {actor.offers.map(offer => <option key={offer.id} value={offer.id}>{offer.name}</option>)}
        </ChoicePicker>}
        <div className="scpi-evidence">
          <h2>{record.name}</h2><p>{record.role}</p>
          <h3>L’offre présentée</h3><p>{record.offer}</p><p>{record.selectedOffer?.scope}</p>
          {record.selectedOffer?.availability?.status === 'closed' && <p className="data-warning">Souscriptions clôturées le {dateLabel(record.selectedOffer.availability.asOf)}. <a href={record.selectedOffer.availability.sourceUrl} target="_blank" rel="noreferrer">Statut publié par l’acteur</a></p>}
          <h3>Ce que tu détiens</h3><p>{record.vehicle}</p><p>{record.distinction}</p>
          <h3>Fonctionnement</h3><p>{record.mechanism}</p>
          <h3>Accès, revenus et sortie</h3><p>{record.access}</p><p>{record.income}</p><p>{record.liquidity}</p>
          {record.selectedOffer && <>
            <h3>Frais et durée de l’offre</h3>
            {[record.selectedOffer.fields.fees, record.selectedOffer.fields.duration].map(field => <p key={field.label}>{field.value}{field.effectiveAt && <> Conditions datées du {dateLabel(field.effectiveAt)}.</>}</p>)}
            {record.selectedOffer.warnings.map(warning => <p className="data-warning" key={warning}>{warning}</p>)}
            <h3>Informations à compléter</h3><p>{record.selectedOffer.missing.join(' ; ')}.</p>
          </>}
          <h3>Risques propres à l’exposition</h3><p>{record.risks}</p>
          <details><summary>Sources et périmètre de la fiche</summary>
            <p>Conditions publiques de l’offre collectées le {dateLabel(record.checkedAt)}. Le fonctionnement général de l’acteur reste une explication éditoriale vérifiée manuellement le {dateLabel(record.editorialCheckedAt)}. {record.selectedOffer?.availability?.status === 'closed' ? 'La clôture des souscriptions est publiée par l’acteur et signalée ci-dessus.' : 'La disponibilité d’une souscription n’est pas établie par cette fiche.'}</p>
            <p>Collecte quotidienne des conditions publiques accessibles ; les données précédentes sont conservées si la source échoue. Les informations manquantes, la fiscalité et les performances réalisées restent à qualifier dans les documents du véhicule choisi.</p>
            {record.sources.map(source => <p key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}</a></p>)}
          </details>
        </div>
      </section>
      <section className="tool-preview">
        <label htmlFor="actor-draft">Ton texte, modifiable avant publication</label>
        <textarea id="actor-draft" className="scpi-draft" value={text} onChange={event => setDraft(event.target.value)} spellCheck="true" />
        <p className="scpi-length">{text.length.toLocaleString('fr-FR')} caractères · publication longue sur X</p>
      </section>
    </ToolWorkspace>
  </div>
}
