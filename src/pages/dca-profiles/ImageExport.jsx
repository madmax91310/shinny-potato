import { useId, useState } from 'react'
import Button from '../../design-system/Button'
export default function ImageExport({ image, reason, filename, alt, children }) {
  const [feedback, setFeedback] = useState(null)
  const statusId = useId()
  const message = feedback?.url === image.url ? feedback.message : ''
  function download() {
    try { image.download(filename); setFeedback({url:image.url,message:'Téléchargement lancé. Si rien ne se passe, ouvre l’image pour l’enregistrer.'}) }
    catch { setFeedback({url:image.url,message:'Téléchargement impossible. Ouvre l’image pour l’enregistrer.'}) }
  }
  return <section className="dca-simple-card dca-simple-preview" aria-label="Image des expositions" aria-busy={image.busy}>
    <h2>Mon aperçu</h2>
    {image.url ? <img src={image.url} alt={alt} /> : <p>L’aperçu apparaîtra ici.</p>}
    <div className="dca-export-actions">
      <Button onClick={download} disabled={!image.url} aria-describedby={statusId}>Télécharger le PNG</Button>
      {image.url && <a href={image.url} target="_blank" rel="noreferrer">Ouvrir l’image</a>}
      {image.error && <Button variant="secondary" onClick={image.retry}>Réessayer l’image</Button>}
    </div>
    <p id={statusId} role="status" aria-live="polite">{reason || image.error || (image.busy ? 'Préparation de l’image…' : message)}</p>
    {children}
  </section>
}
