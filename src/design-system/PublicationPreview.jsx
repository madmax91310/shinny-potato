import { useEffect, useId, useState } from 'react'

// Keep editors mounted so switching views never discards a draft or canvas.
export default function PublicationPreview({ children, renderImage, imageContent, imageAlt = 'Visuel prêt à publier', imageDisabled = false }) {
  const [tab, setTab] = useState('text')
  const [image, setImage] = useState({ status: 'idle', url: '' })
  const id = useId()
  const hasImage = Boolean(renderImage || imageContent)
  useEffect(() => {
    if (tab !== 'image' || !renderImage || imageDisabled) return
    let active = true
    setImage({ status: 'loading', url: '' })
    Promise.resolve().then(renderImage).then(result => {
      const url = typeof result === 'string' ? result : result.toDataURL('image/png')
      if (active) setImage({ status: 'ready', url })
    }).catch(error => { if (active) setImage({ status: 'error', url: '', error: error.message }) })
    return () => { active = false }
  }, [tab, renderImage, imageDisabled])
  function select(next) { setTab(next) }
  function keydown(event) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 'text' : event.key === 'End' ? 'image' : tab === 'text' ? 'image' : 'text'
    select(next); document.getElementById(`${id}-${next}-tab`)?.focus()
  }
  return <div className="publication-preview">
    {hasImage && <div className="publication-tabs" role="tablist" aria-label="Contenu de la publication" onKeyDown={keydown}>
      {['text', 'image'].map(key => <button key={key} id={`${id}-${key}-tab`} type="button" role="tab" aria-selected={tab === key} aria-controls={`${id}-${key}`} tabIndex={tab === key ? 0 : -1} onClick={() => select(key)}>{key === 'text' ? 'Texte' : 'Image'}</button>)}
    </div>}
    <div id={`${id}-text`} role={hasImage ? 'tabpanel' : undefined} aria-labelledby={hasImage ? `${id}-text-tab` : undefined} hidden={hasImage && tab !== 'text'}>{children}</div>
    {hasImage && <div id={`${id}-image`} role="tabpanel" aria-labelledby={`${id}-image-tab`} hidden={tab !== 'image'} className="publication-image-stage">
      {imageDisabled ? <p role="status">Complète les réglages pour afficher le visuel.</p> : imageContent || <>
        {image.status === 'loading' && <p role="status">Préparation du visuel…</p>}
        {image.status === 'error' && <p role="alert">{image.error || 'Impossible de préparer ce visuel.'}</p>}
        {image.status === 'ready' && <img src={image.url} alt={imageAlt} />}
      </>}
    </div>}
  </div>
}
