import { useEffect, useState } from 'react'
import { startPublicationDownload } from '../../design-system/publicationActions.js'

export function useBudgetImage(profile, enabled, mode = 'social') {
  const key = JSON.stringify({ profile, mode })
  const [result, setResult] = useState(null), [attempt, setAttempt] = useState(0), [selection, setSelection] = useState(null)
  useEffect(() => {
    if (!enabled) return
    let active = true
    const urls = []
    const timer = setTimeout(async () => {
      try {
        const { renderBudgetImages } = await import('./image.js')
        const request = JSON.parse(key), canvases = await renderBudgetImages(request.profile, request.mode)
        if (!active) return
        const pending = new Set(), count = canvases.length
        let failed = false
        const fail = () => { failed = true; if (active) setResult({ key, attempt, error: 'L’image n’a pas pu être préparée. Réessaie.' }) }
        const prepare = index => {
          if (!active || failed || urls[index] || pending.has(index)) return
          pending.add(index)
          try {
            canvases[index].toBlob(blob => {
              if (!active || failed) return
              if (!blob) { fail(); return }
              urls[index] = URL.createObjectURL(blob)
              setResult({ key, attempt, urls: [...urls], count, prepare })
            }, 'image/png')
          } catch { fail() }
        }
        // Announce the complete series immediately, then encode only requested
        // pages. A slow intermediate PNG must never block the selected page.
        setResult({ key, attempt, urls: [], count, prepare })
      } catch (error) { if (active) setResult({ key, attempt, error: error.message || 'L’image n’a pas pu être préparée. Réessaie.' }) }
    }, 200)
    return () => { active = false; clearTimeout(timer); urls.forEach(url => URL.revokeObjectURL(url)) }
  }, [key, attempt, enabled])
  const current = enabled && result?.key === key && result.attempt === attempt ? result : null
  const index = selection?.key === key ? Math.min(selection.index, (current?.count || 1) - 1) : 0
  useEffect(() => { current?.prepare?.(index) }, [current, index])
  return { url: current?.urls?.[index] || '', count: current?.count || 0, index, format: mode,
    error: current?.error || '', busy: enabled && (!current || !current.urls?.[index] && !current.error),
    select(index) { if (Number.isInteger(index) && index >= 0 && index < (current?.count || 0)) { setSelection({ key, index }); current.prepare?.(index) } },
    retry: () => setAttempt(n => n + 1),
    download(filename) {
      if (!current?.urls?.[index]) throw new Error('L’image est en cours de préparation.')
      const link = document.createElement('a'); link.href = current.urls[index]; link.download = filename
      document.body.append(link); try { startPublicationDownload(link) } finally { link.remove() }
    },
  }
}
