import { useEffect, useMemo, useState } from 'react'
import { startPublicationDownload } from '../../design-system/publicationActions.js'

export function useBudgetImage(profile, enabled) {
  const key = JSON.stringify(profile)
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const request = useMemo(() => ({ key, enabled, attempt }), [key, enabled, attempt])

  useEffect(() => {
    if (!request.enabled) return
    let active = true
    let url
    const timer = setTimeout(async () => {
      try {
        const { renderBudgetImage } = await import('./image.js')
        const canvas = await renderBudgetImage(JSON.parse(request.key))
        if (!active) return
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob(value => value ? resolve(value) : reject(new Error('PNG indisponible.')), 'image/png')
        })
        if (!active) return
        url = URL.createObjectURL(blob)
        setResult({ request, url, blob })
      } catch {
        if (active) setResult({ request, error: 'L’image n’a pas pu être préparée. Réessaie.' })
      }
    }, 200)
    return () => {
      active = false
      clearTimeout(timer)
      if (url) URL.revokeObjectURL(url)
    }
  }, [request])

  const current = enabled && result?.request === request ? result : null
  return {
    url: current?.url || '', blob: current?.blob, error: current?.error || '', busy: enabled && !current,
    retry: () => setAttempt(n => n + 1),
    download(filename) {
      if (!current?.url) throw new Error('L’image est en cours de préparation.')
      const link = document.createElement('a')
      link.href = current.url
      link.download = filename
      document.body.append(link)
      try { startPublicationDownload(link) } finally { link.remove() }
    },
  }
}
