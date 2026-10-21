import ChoicePicker from '../../design-system/ChoicePicker.jsx'
import { usePublicationPreference } from '../../lib/usePublicationPreference.js'
import { notifyPublication, copyPublicationText } from '../../design-system/publicationActions.js'
import ActionMenu from '../../design-system/ActionMenu'
import { downloadImage } from '../../design-system/downloadImage'
import WorkspaceActions from '../../design-system/WorkspaceActions'
import AssetPicker from '../../design-system/AssetPicker'
import { exposureGroup } from '../../data/asset-selection.js'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { SHEETS } from './data.js'
import { buildFactsheetTweet } from './lib.js'
import { getIndexConcentration, compositionImageSheet } from '../../data/index-company-compositions.js'
import { renderCompositionImage, renderFactsheetImage } from './canvasImage.js'
import { factsheetCurrencies, factsheetCurrency, factsheetInCurrency, factsheetVariants, factsheetInVariant } from './performanceCurrency.js'
import './factsheet-tweets.css'

export default function App() {
  const [selected, setSelected] = usePublicationPreference('index-sheet', SHEETS[0].id, id => SHEETS.some(s => s.id === id))
  const [currency, setCurrency] = usePublicationPreference('index-sheet-currency', 'native', value => ['native', 'EUR', 'USD'].includes(value))
  const [drafts, setDrafts] = useState({})
  const [copied, setCopied] = useState(false)
  const [image, setImage] = useState(null)
  const base = SHEETS.find((entry) => entry.id === selected)
  const [variant, setVariant] = usePublicationPreference('index-sheet-variant', 'native', value => ['native','NETR','GRTR'].includes(value))
  const variants = factsheetVariants(base)
  const effectiveVariant = variants.includes(variant) ? variant : 'native'
  const original = factsheetInVariant(base, effectiveVariant)
  const currencies = factsheetCurrencies(original)
  const effectiveCurrency = currencies.includes(currency) ? currency : 'native'
  const draftKey = `${selected}:${effectiveCurrency}:${effectiveVariant}`
  const selectedRef = useRef(draftKey)
  selectedRef.current = draftKey
  useEffect(() => { setImage(null) }, [draftKey])
  const sheet = factsheetInCurrency(original, effectiveCurrency)
  const imageFilename = `${sheet.id}-${factsheetCurrency(sheet) ?? 'native'}-dans-les-coulisses.png`
  const text = base.compositionOnly ? '' : drafts[draftKey] ?? buildFactsheetTweet(sheet)
  const concentration = useMemo(() => getIndexConcentration(selected), [selected])
  const visualSheet = compositionImageSheet(sheet, concentration)
  const renderMainImage = useCallback(() => renderFactsheetImage(compositionImageSheet(
    factsheetInCurrency(factsheetInVariant(base, effectiveVariant), effectiveCurrency), concentration
  )), [base, effectiveVariant, effectiveCurrency, concentration])
  const [compositionPreview, setCompositionPreview] = useState(null)
  const [compositionAttempt, setCompositionAttempt] = useState(0)
  const readyComposition = compositionPreview?.owner === selected && compositionPreview.canvas
  const compositionFilename = `${sheet.id}-composition-top-10.png`
  useEffect(() => {
    let active = true
    setCompositionPreview(null)
    if (concentration.available) renderCompositionImage(base, concentration).then(canvas => {
      if (active) setCompositionPreview({ owner: selected, canvas, url: canvas.toDataURL('image/png') })
    }).catch(() => { if (active) setCompositionPreview({ owner: selected, error: true }) })
    return () => { active = false }
  }, [selected, base, concentration, compositionAttempt])
  const dateLabel = value => value ? new Date(value).toLocaleDateString('fr-FR', { timeZone: 'UTC' }) : 'non documentée'


  async function copy() {
    try {
      await copyPublicationText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
      document.getElementById('factsheet-draft')?.select()
    }
  }

  async function previewImage() {
    try {
      const canvas = await renderFactsheetImage(visualSheet)
      if (selectedRef.current === draftKey) setImage({ url: canvas.toDataURL('image/png'), filename: imageFilename })
    } catch { notifyPublication('Impossible de préparer l’image. Réessaie.', 'error') }
  }

  return <div className="fs-scope">
    <PageHeader title="Dans les coulisses des indices" subtitle={`${SHEETS.length} indices à explorer : fiches, composition et concentration, avec leurs sources et leurs dates.`} />
    <ToolWorkspace renderImage={renderMainImage} imageAlt={`Coulisses ${sheet.title}`}>
    <div className="fs-panel tool-settings">
      <AssetPicker id="factsheet-subject" label="Choisir un indice" value={selected}
        items={SHEETS.map(entry => ({ id: entry.id, label: entry.title, group: exposureGroup(entry), detail: entry.index }))}
        onChange={value => { setSelected(value); setCopied(false) }} />
      {variants.length > 1 && <label className="fs-label">Dividendes réinvestis <ChoicePicker aria-label="Dividendes réinvestis" value={effectiveVariant} onChange={e => { setVariant(e.target.value); setCopied(false) }}><option value="native">Convention d’origine</option>{variants.map(v => <option key={v} value={v}>{v === 'NETR' ? 'Nets' : 'Bruts'}</option>)}</ChoicePicker></label>}
      {!base.compositionOnly && <><label className="fs-label" htmlFor="factsheet-currency">Devise des performances</label>
      <ChoicePicker id="factsheet-currency" value={effectiveCurrency} onChange={event => { setCurrency(event.target.value); setCopied(false) }}>
        <option value="native">Devise d’origine{factsheetCurrency(original) ? ` (${factsheetCurrency(original)})` : ''}</option>
        {currencies.map(c => <option key={c} value={c}>{c === 'EUR' ? 'Euros (EUR)' : 'Dollars (USD)'}</option>)}
      </ChoicePicker></>}
      <div className="fs-meta">
        <span>📅 Composition de la fiche texte : {sheet.snapshot}</span>
        <span>Récupération de la fiche : {dateLabel(sheet.indexFacts?.source?.checkedAt)}</span>
        {!base.compositionOnly && <span>📈 Performances : {sheet.performance.kind === 'ETF' ? `ETF ${sheet.isin}` : 'indice'} · {sheet.performance.date}</span>}
      </div>
      {!base.compositionOnly && <p className="fs-warning">{sheet.performance.detail}{sheet.performance.currencyNote ? ` · ${sheet.performance.currencyNote}` : ''}</p>}
      <div className="fs-sources"><strong>Sources de la fiche</strong>
        {sheet.source.map((src) => <a key={src.url} target="_blank" rel="noopener noreferrer" href={src.url}>{src.label} ↗</a>)}
      </div>
      <section className="fs-composition-evidence" aria-label="Fiabilité de la composition">
        <strong>Composition et concentration · {concentration.status === 'unavailable' ? 'indisponibles' : concentration.status === 'stale' ? 'données anciennes' : 'disponibles'}</strong>
        {concentration.available ? <>
          <p>{concentration.approximation ? `${concentration.sourceBasis === 'physical-creation-basket' ? 'Approximation par le panier physique de souscription' : 'Approximation par les positions d’un ETF physique'} : ${concentration.sourceLabel} (${concentration.sourceIsin ?? concentration.sourceProductCode}). Il ne s’agit pas d’une composition officielle de l’indice.` : 'Poids de l’indice publiés dans la source indiquée, sans utiliser le portefeuille du fonds.'}</p>
          <p>Composition des deux images : {dateLabel(concentration.asOf)} · Récupération : {dateLabel(concentration.checkedAt)}.</p>
          <p>{concentration.method}</p>
          <a href={concentration.sourceUrl} target="_blank" rel="noopener noreferrer">Source de la composition ↗</a>
          {concentration.identitySourceUrl && <> · <a href={concentration.identitySourceUrl} target="_blank" rel="noopener noreferrer">Benchmark et réplication vérifiés ↗</a> (contrôle : {dateLabel(concentration.identityCheckedAt)})</>}
          {concentration.observedIdentitySourceUrl && <> · <a href={concentration.observedIdentitySourceUrl} target="_blank" rel="noopener noreferrer">Identité actualisée ↗</a> ({dateLabel(concentration.observedIdentityCheckedAt)})</>}
          {concentration.classificationSourceUrl && <> · <a href={concentration.classificationSourceUrl} target="_blank" rel="noopener noreferrer">Noms et classifications par ISIN ↗</a> ({dateLabel(concentration.classificationAsOf)})</>}
          {concentration.indexIdentitySourceUrl && <> · <a href={concentration.indexIdentitySourceUrl} target="_blank" rel="noopener noreferrer">Indice suivi confirmé par MSCI ↗</a></>}
          {concentration.methodologyUrl && <> · <a href={concentration.methodologyUrl} target="_blank" rel="noopener noreferrer">Méthodologie ↗</a></>}
          {concentration.status === 'stale' && <p>Données anciennes : relire la date avant publication.</p>}
          {concentration.refresh?.status === 'failed' && <p>Dernière actualisation en échec : dernière composition valide conservée. {concentration.refresh.error}</p>}
        </> : <p role="status">{concentration.reason} L’encart et le PNG de composition sont désactivés ; la fiche reste accessible.</p>}
        {selected === 'nasdaq-pea' && <p>Nasdaq-100 : entreprises non financières du Nasdaq. Il ne s’agit pas du Nasdaq Composite.</p>}
      </section>
      <p className="fs-warning">Les compositions et performances correspondent aux dates affichées. Un contrôle récent de la source ne change pas la date de la composition ; relisez ces dates avant publication. Les deux images utilisent la composition qualifiée indiquée ci-dessus ; le texte conserve sa fiche et ses conventions. Aucun panier de substitution synthétique n’est utilisé.</p>
    </div>
    <div className="fs-panel fs-editor tool-preview">
      {!base.compositionOnly && <><div className="fs-editor-top"><label className="fs-label" htmlFor="factsheet-draft">Publication modifiable</label><span>{text.length.toLocaleString('fr-FR')} caractères</span></div>
      <textarea id="factsheet-draft" spellCheck="true" value={text} onChange={(event) => { setDrafts((current) => ({ ...current, [draftKey]: event.target.value })); setCopied(false) }} /></>}
      {base.compositionOnly && <p>La composition est disponible ici sans ajouter de série de performance ni de texte de tweet.</p>}
      <WorkspaceActions>{!base.compositionOnly && <Button onClick={copy}>{copied ? '✅ Copié' : '📋 Copier le texte'}</Button>}<Button variant="secondary" onClick={async () => { try { const canvas = await renderFactsheetImage(visualSheet); if (selectedRef.current === draftKey) downloadImage(canvas, imageFilename) } catch { notifyPublication('Impossible de préparer l’image. Réessaie.', 'error') } }}>Télécharger l’image</Button><ActionMenu><Button variant="secondary" onClick={previewImage}>🖼️ Prévisualiser l’image PNG</Button>{concentration.approximation && <Button variant="secondary" onClick={async () => { try { const canvas = await renderFactsheetImage(sheet); if (selectedRef.current === draftKey) setImage({ url: canvas.toDataURL('image/png'), filename: `${sheet.id}-fiche-origine.png` }) } catch { notifyPublication('Impossible de préparer l’image. Réessaie.', 'error') } }}>Prévisualiser la fiche d’origine</Button>}<Button variant="secondary" onClick={() => { setDrafts((current) => { const next = { ...current }; delete next[draftKey]; return next }); notifyPublication('Texte d’origine rétabli.') }}>↩️ Rétablir le modèle</Button></ActionMenu></WorkspaceActions>
    </div>
    </ToolWorkspace>
    <section className="fs-panel fs-composition-panel" aria-label="Visuel de composition">
      <h2>Composition · {sheet.index}</h2>
      {concentration.available ? <>
        <p>Poids des 10 premières entreprises : <strong>{concentration.topWeight.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %</strong></p>
        {readyComposition ? <img className="fs-composition-preview" src={compositionPreview.url} alt={`Composition ${sheet.index} : dix premières entreprises et autres entreprises`} />
          : compositionPreview?.owner === selected && compositionPreview.error ? <p role="alert">Impossible de préparer la composition. <Button variant="secondary" onClick={() => setCompositionAttempt(n => n + 1)}>Réessayer</Button></p> : <p role="status">Préparation du visuel de composition…</p>}
      </> : <p>{concentration.reason}</p>}
      <div className="fs-actions">
        <Button variant="secondary" disabled={!readyComposition} onClick={() => setImage({ url: compositionPreview.url, filename: compositionFilename, composition: true })}>Prévisualiser la composition</Button>
        <Button disabled={!readyComposition} onClick={() => downloadImage(compositionPreview.canvas, compositionFilename)}>Télécharger la composition en PNG</Button>
      </div>
    </section>
    {image && <div className="fs-image-overlay" role="presentation" onClick={() => setImage(null)}>
      <div className="fs-image-dialog" role="dialog" aria-modal="true" aria-label="Aperçu de la fiche PNG" onClick={(event) => event.stopPropagation()}>
        <div className="fs-image-toolbar"><strong>Aperçu de l’image</strong><button type="button" onClick={() => setImage(null)} aria-label="Fermer l’aperçu">✕</button></div>
        <img src={image.url} alt={`${image.composition ? 'Composition' : 'Infographie'} ${sheet.title}`} />
        <a className="fs-image-download" href={image.url} download={image.filename}>⬇️ Télécharger le PNG haute résolution</a>
        <p>Les données de l’image proviennent de la fiche sélectionnée. Les modifications apportées au texte du tweet ne changent pas l’image.</p>
      </div>
    </div>}
  </div>
}
