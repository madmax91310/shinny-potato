import { usePublicationPreference } from '../../lib/usePublicationPreference.js'
import { notifyPublication, copyPublicationText } from '../../design-system/publicationActions.js'
import ActionMenu from '../../design-system/ActionMenu'
import { downloadImage } from '../../design-system/downloadImage'
import WorkspaceActions from '../../design-system/WorkspaceActions'
import AssetPicker from '../../design-system/AssetPicker'
import { exposureGroup } from '../../data/asset-selection.js'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import { useEffect, useRef, useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { SHEETS } from './data.js'
import { buildFactsheetTweet } from './lib.js'
import { renderFactsheetImage } from './canvasImage.js'
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
  const text = drafts[draftKey] ?? buildFactsheetTweet(sheet)

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
      const canvas = await renderFactsheetImage(sheet)
      if (selectedRef.current === draftKey) setImage({ url: canvas.toDataURL('image/png'), filename: imageFilename })
    } catch { notifyPublication('Impossible de préparer l’image. Réessaie.', 'error') }
  }

  return <div className="fs-scope">
    <PageHeader title="Dans les coulisses des indices" subtitle={`${SHEETS.length} sujets décryptés à partir de fiches officielles, avec des publications prêtes à relire, modifier et copier.`} />
    <ToolWorkspace renderImage={() => renderFactsheetImage(sheet)} imageAlt={`Coulisses ${sheet.title}`}>
    <div className="fs-panel tool-settings">
      <AssetPicker id="factsheet-subject" label="Choisir un indice" value={selected}
        items={SHEETS.map(entry => ({ id: entry.id, label: entry.title, group: exposureGroup(entry), detail: entry.index }))}
        onChange={value => { setSelected(value); setCopied(false) }} />
      {variants.length > 1 && <label className="fs-label">Dividendes réinvestis <select aria-label="Dividendes réinvestis" value={effectiveVariant} onChange={e => { setVariant(e.target.value); setCopied(false) }}><option value="native">Convention d’origine</option>{variants.map(v => <option key={v} value={v}>{v === 'NETR' ? 'Nets' : 'Bruts'}</option>)}</select></label>}
      <label className="fs-label" htmlFor="factsheet-currency">Devise des performances</label>
      <select id="factsheet-currency" value={effectiveCurrency} onChange={event => { setCurrency(event.target.value); setCopied(false) }}>
        <option value="native">Devise d’origine{factsheetCurrency(original) ? ` (${factsheetCurrency(original)})` : ''}</option>
        {currencies.map(c => <option key={c} value={c}>{c === 'EUR' ? 'Euros (EUR)' : 'Dollars (USD)'}</option>)}
      </select>
      <div className="fs-meta">
        <span>📅 Composition : {sheet.snapshot}</span>
        <span>📈 Performances : {sheet.performance.kind === 'ETF' ? `ETF ${sheet.isin}` : 'indice'} · {sheet.performance.date}</span>
      </div>
      <p className="fs-warning">{sheet.performance.detail}{sheet.performance.currencyNote ? ` · ${sheet.performance.currencyNote}` : ''}</p>
      <div className="fs-sources"><strong>Fiches officielles</strong>
        {sheet.source.map((src) => <a key={src.url} target="_blank" rel="noopener noreferrer" href={src.url}>{src.label} ↗</a>)}
      </div>
      <p className="fs-warning">Les compositions et performances correspondent aux dates affichées. Un contrôle récent de la source ne change pas la date de la composition ; relisez ces dates avant publication. La composition décrit l’indice sous-jacent, pas les titres détenus par un ETF synthétique.</p>
    </div>
    <div className="fs-panel fs-editor tool-preview">
      <div className="fs-editor-top"><label className="fs-label" htmlFor="factsheet-draft">Publication modifiable</label><span>{text.length.toLocaleString('fr-FR')} caractères</span></div>
      <textarea id="factsheet-draft" spellCheck="true" value={text} onChange={(event) => { setDrafts((current) => ({ ...current, [draftKey]: event.target.value })); setCopied(false) }} />
      <WorkspaceActions><Button onClick={copy}>{copied ? '✅ Copié' : '📋 Copier le texte'}</Button><Button variant="secondary" onClick={async () => { try { const canvas = await renderFactsheetImage(sheet); if (selectedRef.current === draftKey) downloadImage(canvas, imageFilename) } catch { notifyPublication('Impossible de préparer l’image. Réessaie.', 'error') } }}>Télécharger l’image</Button><ActionMenu><Button variant="secondary" onClick={previewImage}>🖼️ Prévisualiser l’image PNG</Button><Button variant="secondary" onClick={() => { setDrafts((current) => { const next = { ...current }; delete next[draftKey]; return next }); notifyPublication('Texte d’origine rétabli.') }}>↩️ Rétablir le modèle</Button></ActionMenu></WorkspaceActions>
    </div>
    </ToolWorkspace>
    {image && <div className="fs-image-overlay" role="presentation" onClick={() => setImage(null)}>
      <div className="fs-image-dialog" role="dialog" aria-modal="true" aria-label="Aperçu de la fiche PNG" onClick={(event) => event.stopPropagation()}>
        <div className="fs-image-toolbar"><strong>Aperçu de l’image</strong><button type="button" onClick={() => setImage(null)} aria-label="Fermer l’aperçu">✕</button></div>
        <img src={image.url} alt={`Infographie ${sheet.title}`} />
        <a className="fs-image-download" href={image.url} download={image.filename}>⬇️ Télécharger le PNG haute résolution</a>
        <p>Les données de l’image proviennent de la fiche sélectionnée. Les modifications apportées au texte du tweet ne changent pas l’image.</p>
      </div>
    </div>}
  </div>
}
