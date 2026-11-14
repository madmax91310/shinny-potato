import { useId, useState } from 'react'
import Button from '../../design-system/Button'
export default function ImageExport({ image, reason, filename, alt, children }) {
  const [feedback, setFeedback] = useState(null)
  const [selection,setSelection]=useState(null)
  const index=selection?.key===image.url?selection.index:0
  const pages=image.images||[]
  const url=pages[index]?.url||image.url
  const statusId = useId()
  const message = feedback?.url === image.url ? feedback.message : ''
  function download() {
    try { image.download(filename,index); setFeedback({url:image.url,message:'Téléchargement lancé. Si rien ne se passe, ouvre l’image pour l’enregistrer.'}) }
    catch { setFeedback({url:image.url,message:'Téléchargement impossible. Ouvre l’image pour l’enregistrer.'}) }
  }
  return <section className="dca-simple-card dca-simple-preview" aria-label="Image des expositions" aria-busy={image.busy}>
    <h2>Mon aperçu</h2>
    {pages.length>1&&<nav aria-label="Images à exporter"><p>Image {index+1} / {pages.length} · {pages[index]?.label}</p>{pages.map((page,i)=><Button key={page.id} variant="secondary" aria-pressed={i===index} onClick={()=>setSelection({key:image.url,index:i})}>{page.label}</Button>)}</nav>}
    {url ? <img src={url} alt={`${alt}${pages.length>1?` · ${pages[index].label}`:''}`} /> : <p>L’aperçu apparaîtra ici.</p>}
    <div className="dca-export-actions">
      <Button onClick={download} disabled={!image.url} aria-describedby={statusId}>Télécharger le PNG</Button>
      {image.url && <a href={url} target="_blank" rel="noreferrer">Ouvrir l’image</a>}
      {image.error && <Button variant="secondary" onClick={image.retry}>Réessayer l’image</Button>}
    </div>
    <p id={statusId} role="status" aria-live="polite">{reason || image.error || (image.busy ? 'Préparation de l’image…' : message)}</p>
    {children}
  </section>
}
