import { useEffect, useMemo, useState } from 'react'
import { renderDcaImage } from './image.js'
import { startPublicationDownload } from '../../design-system/publicationActions.js'

// Text edits and editorial approval do not change the image. Key every render to
// its inputs so a late response can never make an obsolete allocation exportable.
export function useImageExport(profile, field, enabled) {
  const { approved: _approved, ...imageProfile } = profile
  const key = JSON.stringify([imageProfile, field])
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const request = useMemo(() => ({key, enabled, attempt}), [key, enabled, attempt])
  useEffect(() => {
    if (!enabled) return
    let active = true, url, timer
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Délai dépassé')), 20000) })
    const debounce = setTimeout(async () => {
      try {
        const blob = await Promise.race([
          renderDcaImage(JSON.parse(key)[0], JSON.parse(key)[1]).then(canvas => new Promise((resolve, reject) => {
            canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG indisponible')), 'image/png')
          })), timeout,
        ])
        if (!active) return
        url = URL.createObjectURL(blob)
        setResult({ request, url })
      } catch {
        if (active) setResult({ request, error: 'L’image n’a pas pu être préparée. Réessaie.' })
      } finally { clearTimeout(timer) }
    }, 250)
    return () => { active = false; clearTimeout(debounce); clearTimeout(timer); if (url) URL.revokeObjectURL(url) }
  }, [request, key, enabled])
  const current = enabled && result?.request === request ? result : null
  return {
    url: current?.url || '', error: current?.error || '', busy: enabled && !current,
    retry: () => setAttempt(n => n + 1),
    download(filename) {
      if (!current?.url) throw new Error('Image en cours de préparation.')
      const link = document.createElement('a')
      link.href = current.url; link.download = filename
      document.body.append(link)
      try { startPublicationDownload(link) } finally { link.remove() }
    },
  }
}
