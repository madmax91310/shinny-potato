import { useEffect, useState } from 'react'
import { renderBudgetImage } from './image.js'
import { startPublicationDownload } from '../../design-system/publicationActions.js'

export function useBudgetImage(profile, enabled) {
  const key = JSON.stringify(profile)
  const [result, setResult] = useState(null), [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!enabled) return
    let active = true, url
    const timer = setTimeout(async () => {
      try {
        const canvas = await renderBudgetImage(JSON.parse(key))
        const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error()), 'image/png'))
        if (!active) return
        url = URL.createObjectURL(blob); setResult({ key, attempt, url })
      } catch { if (active) setResult({ key, attempt, error: 'L’image n’a pas pu être préparée. Réessaie.' }) }
    }, 200)
    return () => { active = false; clearTimeout(timer); if (url) URL.revokeObjectURL(url) }
  }, [key, attempt, enabled])
  const current = enabled && result?.key === key && result.attempt === attempt ? result : null
  return { url: current?.url || '', error: current?.error || '', busy: enabled && !current,
    retry: () => setAttempt(n => n + 1),
    download(filename) {
      if (!current?.url) throw new Error('L’image est en cours de préparation.')
      const link = document.createElement('a'); link.href = current.url; link.download = filename
      document.body.append(link); try { startPublicationDownload(link) } finally { link.remove() }
    },
  }
}
