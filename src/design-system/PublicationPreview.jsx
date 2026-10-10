import { useEffect, useId, useRef, useState } from 'react'
import ImageZoom from './ImageZoom'

// Keep editors mounted so switching views never discards a draft or canvas.
export default function PublicationPreview({ children, renderImage, imageContent, imageAlt = 'Visuel prêt à publier', imageDisabled = false }) {
  const [tab, setTab] = useState('text')
  const [image, setImage] = useState({ status: 'idle', url: '' })
  const id = useId()
  const stage = useRef(null)
  const enlargeButton = useRef(null)
  const [zoom, setZoom] = useState(null)
  const [hasMedia, setHasMedia] = useState(false)
  const [zoomError, setZoomError] = useState('')
  const hasImage = Boolean(renderImage || imageContent)
  useEffect(() => {
    const node = stage.current
    if (!node) return
    const update = () => setHasMedia(Boolean(node.querySelector('img,canvas,svg')))
    update()
    const observer = new MutationObserver(update)
    observer.observe(node, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [hasImage])
  function enlarge() {
    const media = stage.current?.querySelector('img,canvas,svg')
    if (!media) return
    try {
      const src = media.tagName === 'CANVAS' ? media.toDataURL('image/png')
        : media.tagName.toLowerCase() === 'svg' ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(media))}` : media.src
      setZoomError(''); setZoom(src)
    } catch { setZoomError('Impossible d’agrandir cette image. Réessaie après sa préparation.') }
  }
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
    {hasImage && <div id={`${id}-image`} role="tabpanel" aria-labelledby={`${id}-image-tab`} hidden={tab !== 'image'}>
      {!imageDisabled && hasMedia && <button ref={enlargeButton} type="button" className="publication-enlarge" onClick={enlarge}>Agrandir l’image</button>}
      {zoomError && <p role="alert">{zoomError}</p>}
      <div ref={stage} className="publication-image-stage" onClick={event => { if (event.target.closest('img,canvas,svg')) enlarge() }}>
      {imageDisabled ? <p role="status">Complète les réglages pour afficher le visuel.</p> : imageContent || <>
        {image.status === 'loading' && <p role="status">Préparation du visuel…</p>}
        {image.status === 'error' && <p role="alert">{image.error || 'Impossible de préparer ce visuel.'}</p>}
        {image.status === 'ready' && <img src={image.url} alt={imageAlt} />}
      </>}
      </div>
    </div>}
    {zoom && <ImageZoom src={zoom} alt={imageAlt} returnFocus={enlargeButton.current} onClose={() => setZoom(null)} />}
  </div>
}
