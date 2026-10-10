import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { notifyPublication } from './publicationActions'

export default function PublicationFeedback() {
  const { pathname } = useLocation()
  const [feedback, setFeedback] = useState(null)
  useEffect(() => {
    setFeedback(null)
    let timer
    const receive = event => {
      clearTimeout(timer)
      setFeedback({ ...event.detail, id: Date.now() })
      timer = setTimeout(() => setFeedback(null), event.detail.kind === 'error' ? 7000 : 4000)
    }
    const download = event => {
      const link = event.target.closest?.('a[download]')
      if (link && !event.defaultPrevented && link.dataset.publicationDownload !== 'handled') notifyPublication('Téléchargement lancé.')
    }
    window.addEventListener('publication-feedback', receive)
    document.addEventListener('click', download)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('publication-feedback', receive)
      document.removeEventListener('click', download)
    }
  }, [pathname])
  return <div className={`publication-feedback ${feedback?.kind === 'error' ? 'is-error' : ''}`} hidden={!feedback}>
    <span key={feedback?.id} role="status" aria-live="polite" aria-atomic="true">{feedback?.message}</span>
    <button type="button" aria-label="Fermer la confirmation" onClick={() => setFeedback(null)}>×</button>
  </div>
}
