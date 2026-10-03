import ActionMenu from '../../design-system/ActionMenu'
import { downloadImage } from '../../design-system/downloadImage'
import WorkspaceActions from '../../design-system/WorkspaceActions'
import AssetPicker from '../../design-system/AssetPicker'
import { exposureGroup } from '../../data/asset-selection.js'
import ToolWorkspace from '../../design-system/ToolWorkspace'
import { useState } from 'react'
import PageHeader from '../../design-system/PageHeader'
import Button from '../../design-system/Button'
import { SHEETS } from './data.js'
import { buildFactsheetTweet } from './lib.js'
import { renderFactsheetImage } from './canvasImage.js'
import './factsheet-tweets.css'

export default function App() {
  const [selected, setSelected] = useState(SHEETS[0].id)
  const [drafts, setDrafts] = useState({})
  const [copied, setCopied] = useState(false)
  const [image, setImage] = useState(null)
  const sheet = SHEETS.find((entry) => entry.id === selected)
  const text = drafts[selected] ?? buildFactsheetTweet(sheet)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      document.getElementById('factsheet-draft')?.select()
    }
  }

  function previewImage() {
    setImage({ url: renderFactsheetImage(sheet).toDataURL('image/png'), filename: `${sheet.id}-dans-les-coulisses.png` })
  }

  return <div className="fs-scope">
    <PageHeader title="Dans les coulisses des indices" subtitle={`${SHEETS.length} sujets décryptés à partir de fiches officielles, avec des publications prêtes à relire, modifier et copier.`} />
    <ToolWorkspace renderImage={() => renderFactsheetImage(sheet)} imageAlt={`Coulisses ${sheet.title}`}>
    <div className="fs-panel tool-settings">
      <AssetPicker id="factsheet-subject" label="Choisir un indice ou un ETF" value={selected}
        items={SHEETS.map(entry => ({ id: entry.id, label: entry.title, isin: entry.isin, group: exposureGroup(entry), detail: entry.index }))}
        onChange={value => { setSelected(value); setCopied(false) }} />
      <div className="fs-meta">
        <span>📅 Composition : {sheet.snapshot}</span>
        <span>📈 Performances : {sheet.performance.kind === 'ETF' ? `ETF ${sheet.isin}` : 'indice'} · {sheet.performance.date}</span>
      </div>
      <div className="fs-sources"><strong>Fiches officielles</strong>
        {sheet.source.map((src) => <a key={src.url} target="_blank" rel="noopener noreferrer" href={src.url}>{src.label} ↗</a>)}
      </div>
      <p className="fs-warning">Données figées : relisez les pourcentages et les dates sur les fiches avant chaque publication. La composition décrit l’indice sous-jacent, pas les titres détenus par un ETF synthétique.</p>
    </div>
    <div className="fs-panel fs-editor tool-preview">
      <div className="fs-editor-top"><label className="fs-label" htmlFor="factsheet-draft">Publication modifiable</label><span>{text.length.toLocaleString('fr-FR')} caractères</span></div>
      <textarea id="factsheet-draft" spellCheck="true" value={text} onChange={(event) => { setDrafts((current) => ({ ...current, [selected]: event.target.value })); setCopied(false) }} />
      <WorkspaceActions><Button onClick={copy}>{copied ? '✅ Copié' : '📋 Copier le texte'}</Button><Button variant="secondary" onClick={() => downloadImage(renderFactsheetImage(sheet), `${sheet.id}-dans-les-coulisses.png`)}>Télécharger l’image</Button><ActionMenu><Button variant="secondary" onClick={previewImage}>🖼️ Prévisualiser l’image PNG</Button><Button variant="secondary" onClick={() => setDrafts((current) => { const next = { ...current }; delete next[selected]; return next })}>↩️ Rétablir le modèle</Button></ActionMenu></WorkspaceActions>
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
