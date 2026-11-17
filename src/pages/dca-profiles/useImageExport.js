import { useCallback, useEffect, useMemo, useState } from 'react'
import { profilePositionLimit } from './engine.js'
import { startPublicationDownload } from '../../design-system/publicationActions.js'

// Text edits and editorial approval do not change the image. Key every render to
// its inputs so a late response can never make an obsolete allocation exportable.
export function useImageExport(profile, field, enabled, maxPositions=profilePositionLimit(profile)) {
  const { approved: _approved, ...imageProfile } = profile
  const key = JSON.stringify([imageProfile, field, maxPositions])
  const [result, setResult] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt(n => n + 1), [])
  const request = useMemo(() => ({key, enabled, attempt}), [key, enabled, attempt])
  useEffect(() => {
    if (!enabled) return
    let active = true, urls=[], timer
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Délai dépassé')), 60000) })
    const debounce = setTimeout(async () => {
      try {
        const [input, selectedField, storedMaximum] = JSON.parse(key)
        const maximum=storedMaximum??Infinity
        const pages = await Promise.race([
          import('./image-series.js').then(module=>module.renderImageSeries(input,selectedField,maximum,async ({canvas,...page})=>{
            try{
              if(!active)throw Error('Export remplacé')
              const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('PNG indisponible')),'image/png'))
              return {...page,blob}
            }finally{canvas.width=canvas.height=1}
          })), timeout,
        ])
        if (!active) return
        const images=pages.map(({blob,...page})=>{const url=URL.createObjectURL(blob);urls.push(url);return {...page,url}})
        setResult({request,images,url:images[0].url})
      } catch {
        if (active) setResult({ request, error: 'L’image n’a pas pu être préparée. Réessaie.' })
      } finally { clearTimeout(timer) }
    }, 250)
    return () => { active = false; clearTimeout(debounce); clearTimeout(timer); urls.forEach(url=>URL.revokeObjectURL(url)) }
  }, [request, key, enabled])
  const current = enabled && result?.request === request ? result : null
  return {
    images:current?.images || [], url: current?.url || '', error: current?.error || '', busy: enabled && !current,
    retry,
    download(filename,index=0) {
      if (!current?.url) throw new Error('Image en cours de préparation.')
      const link = document.createElement('a')
      const page=current.images[index]
      if(!page)throw new Error('Image indisponible.')
      const name=String(profile.name||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
      link.href = page.url; link.download = filename.replace(/\.png$/i,`${name?'-'+name:''}-${page.id}.png`)
      document.body.append(link)
      try { startPublicationDownload(link) } finally { link.remove() }
    },
  }
}
