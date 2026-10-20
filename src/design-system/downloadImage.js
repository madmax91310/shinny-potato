import { startPublicationDownload } from './publicationActions.js'

// A Blob URL avoids mobile browser limits on large data-URL downloads.
export function downloadImage(canvas, filename) {
  const source = typeof canvas === 'string' ? canvas : canvas.toDataURL('image/png')
  let objectUrl
  if (source.startsWith('data:image/png;base64,')) {
    const bytes = Uint8Array.from(atob(source.split(',')[1]), ch => ch.charCodeAt(0))
    objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }))
  }
  const link = document.createElement('a')
  link.href = objectUrl || source; link.download = filename
  document.body.append(link)
  try { startPublicationDownload(link) }
  finally {
    link.remove()
    // Keep the resource alive while the browser transfers it to its download manager.
    if (objectUrl) setTimeout(() => URL.revokeObjectURL(objectUrl), 60000)
  }
}
