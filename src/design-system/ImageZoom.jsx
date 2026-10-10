import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function ImageZoom({ src, alt, onClose, returnFocus }) {
  const dialog = useRef(null)
  const [zoomed, setZoomed] = useState(false)
  useEffect(() => {
    const node = dialog.current
    const previousOverflow = document.body.style.overflow
    node.showModal()
    document.body.style.overflow = 'hidden'
    return () => { node.close(); document.body.style.overflow = previousOverflow; returnFocus?.focus() }
  }, [returnFocus])
  return createPortal(<dialog ref={dialog} className="publication-zoom" aria-label="Image en plein écran"
    onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === dialog.current) onClose() }}>
    <div className="publication-zoom-toolbar">
      <button type="button" aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}>{zoomed ? 'Ajuster à l’écran' : 'Zoom ×2'}</button>
      <button type="button" autoFocus onClick={onClose}>Fermer</button>
    </div>
    <div className="publication-zoom-scroll" data-zoomed={zoomed}><img src={src} alt={alt} /></div>
  </dialog>, document.body)
}
