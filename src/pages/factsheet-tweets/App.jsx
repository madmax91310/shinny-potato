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
    <PageHeader title="Dans les coulisses des indices" subtitle="Onze sujets décryptés à partir de fiches officielles, avec des publications prêtes à relire, modifier et copier." />
    <div className="fs-panel">
      <label className="fs-label" htmlFor="factsheet-subject">Choisir un indice ou un ETF</label>
      <select id="factsheet-subject" value={selected} onChange={(event) => { setSelected(event.target.value); setCopied(false) }}>
        {SHEETS.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}
      </select>
      <div className="fs-meta">
        <span>📅 Composition : {sheet.snapshot}</span>
        <span>📈 Performances : {sheet.performance.kind === 'ETF' ? `ETF ${sheet.isin}` : 'indice'} · {sheet.performance.date}</span>
      </div>
      <div className="fs-sources"><strong>Fiches officielles</strong>
        {sheet.source.map((src) => <a key={src.url} target="_blank" rel="noopener noreferrer" href={src.url}>{src.label} ↗</a>)}
      </div>
      <p className="fs-warning">Données figées : relisez les pourcentages et les dates sur les fiches avant chaque publication. La composition décrit l’indice sous-jacent, pas les titres détenus par un ETF synthétique.</p>
    </div>
    <div className="fs-panel fs-editor">
      <div className="fs-editor-top"><label className="fs-label" htmlFor="factsheet-draft">Publication modifiable</label><span>{text.length.toLocaleString('fr-FR')} caractères</span></div>
      <textarea id="factsheet-draft" spellCheck="true" value={text} onChange={(event) => { setDrafts((current) => ({ ...current, [selected]: event.target.value })); setCopied(false) }} />
      <div className="fs-actions"><Button onClick={copy}>{copied ? '✅ Copié' : '📋 Copier le texte'}</Button><Button variant="secondary" onClick={previewImage}>🖼️ Prévisualiser l’image PNG</Button><Button variant="secondary" onClick={() => setDrafts((current) => { const next = { ...current }; delete next[selected]; return next })}>↩️ Rétablir le modèle</Button></div>
    </div>
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
